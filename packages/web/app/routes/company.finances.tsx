import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { DollarSign, TrendingUp, TrendingDown, CalendarCheck } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import StatCard from "../../components/StatCard";
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { PageTransition } from "../../components/ui/PageTransition";
import {
    listCompanyFlats,
    listCompanyHouses,
    getCompanyReservations,
    listCompanyBuildings,
    getContractors,
} from "../../lib/firestore";
import { deriveCompanyRevenue } from "../../lib/revenue";
import type {
    AuthContext,
    Flat,
    House,
    Reservation,
    Building,
    Contractor,
} from "@gemmaham/shared";

interface BuildingRevenue {
    buildingId: string;
    buildingName: string;
    flatsSold: number;
    revenue: number;
    contractorCosts: number;
    profit: number;
}

interface ContractorCostRow {
    contractorName: string;
    buildingName: string;
    trade: string;
    contractValue: number;
    currency: string;
    status: string;
}

export default function CompanyFinances() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const [loading, setLoading] = useState(true);
    const [flats, setFlats] = useState<Flat[]>([]);
    const [houses, setHouses] = useState<House[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [allContractors, setAllContractors] = useState<(Contractor & { buildingName: string })[]>([]);

    useEffect(() => {
        if (!auth.companyId) return;
        (async () => {
            try {
                const [f, h, rResult, b] = await Promise.all([
                    listCompanyFlats(auth.companyId!),
                    listCompanyHouses(auth.companyId!),
                    getCompanyReservations(auth.companyId!),
                    listCompanyBuildings(auth.companyId!),
                ]);
                setFlats(f);
                setHouses(h);
                setReservations(rResult.items);
                setBuildings(b);

                // Fetch contractors for each building
                const contractorResults: (Contractor & { buildingName: string })[] = [];
                for (const building of b) {
                    const contractors = await getContractors(building.id);
                    for (const c of contractors) {
                        contractorResults.push({ ...c, buildingName: building.title });
                    }
                }
                setAllContractors(contractorResults);
            } catch (err) {
                console.error("Failed to load financial data:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.companyId]);

    const revenue = deriveCompanyRevenue(reservations, flats, houses);

    const completedReservations = reservations.filter((r) => r.status === "completed");
    const activeReservations = reservations.filter(
        (r) => r.status === "approved" || r.status === "reserved",
    );

    const totalCosts = allContractors.reduce(
        (sum, c) => sum + (c.contractValue ?? 0),
        0,
    );
    const netProfit = revenue.total - totalCosts;

    // Revenue by building
    const flatMap = new Map(flats.map((f) => [f.id, f]));
    const buildingRevenueMap = new Map<string, BuildingRevenue>();

    for (const building of buildings) {
        buildingRevenueMap.set(building.id, {
            buildingId: building.id,
            buildingName: building.title,
            flatsSold: 0,
            revenue: 0,
            contractorCosts: 0,
            profit: 0,
        });
    }

    for (const r of completedReservations) {
        if (r.propertyType === "flat" && r.flatId) {
            const flat = flatMap.get(r.flatId);
            if (flat?.buildingId) {
                const entry = buildingRevenueMap.get(flat.buildingId);
                if (entry) {
                    entry.flatsSold += 1;
                    entry.revenue += flat.price;
                }
            }
        }
    }

    for (const c of allContractors) {
        const entry = buildingRevenueMap.get(c.buildingId);
        if (entry) {
            entry.contractorCosts += c.contractValue ?? 0;
        }
    }

    for (const entry of buildingRevenueMap.values()) {
        entry.profit = entry.revenue - entry.contractorCosts;
    }

    const buildingRevenueRows = Array.from(buildingRevenueMap.values()).filter(
        (r) => r.revenue > 0 || r.contractorCosts > 0,
    );

    // Contractor costs table
    const contractorCostRows: ContractorCostRow[] = allContractors
        .filter((c) => c.contractValue && c.contractValue > 0)
        .map((c) => ({
            contractorName: c.name,
            buildingName: c.buildingName,
            trade: c.trade,
            contractValue: c.contractValue ?? 0,
            currency: c.currency,
            status: c.status,
        }));

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
                <div className="flex">
                    <main className="flex-1 p-6 max-w-5xl">
                        <h1 className="font-serif text-2xl font-bold mb-6">
                            {t("finances.title")}
                        </h1>

                        <ContentLoader loading={loading} skeleton={<DashboardSkeleton />}>
                            {/* Summary cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                <StatCard
                                    icon={DollarSign}
                                    value={revenue.total > 0 ? `${revenue.total.toLocaleString()}` : "—"}
                                    label={t("finances.totalRevenue")}
                                />
                                <StatCard
                                    icon={TrendingDown}
                                    value={totalCosts > 0 ? `${totalCosts.toLocaleString()}` : "—"}
                                    label={t("finances.totalCosts")}
                                />
                                <StatCard
                                    icon={TrendingUp}
                                    value={netProfit !== 0 ? `${netProfit.toLocaleString()}` : "—"}
                                    label={t("finances.netProfit")}
                                />
                                <StatCard
                                    icon={CalendarCheck}
                                    value={activeReservations.length}
                                    label={t("finances.activeReservations")}
                                />
                            </div>

                            {/* Revenue by Building table */}
                            <div className="bg-surface rounded-2xl border border-foreground/6 overflow-hidden mb-8">
                                <div className="p-4 border-b border-foreground/6">
                                    <h3 className="font-semibold">{t("finances.revenueByBuilding")}</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[600px]">
                                        <thead>
                                            <tr className="border-b border-foreground/6 text-foreground/50">
                                                <th className="text-left p-3">{t("finances.buildingName")}</th>
                                                <th className="text-right p-3">{t("finances.flatsSold")}</th>
                                                <th className="text-right p-3">{t("finances.totalRevenue")}</th>
                                                <th className="text-right p-3">{t("finances.contractorCosts")}</th>
                                                <th className="text-right p-3">{t("finances.netProfit")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {buildingRevenueRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-6 text-center text-foreground/40">
                                                        {t("finances.noData")}
                                                    </td>
                                                </tr>
                                            ) : (
                                                buildingRevenueRows.map((row) => (
                                                    <tr key={row.buildingId} className="border-b border-foreground/5">
                                                        <td className="p-3 font-medium">{row.buildingName}</td>
                                                        <td className="p-3 text-right">{row.flatsSold}</td>
                                                        <td className="p-3 text-right">{row.revenue.toLocaleString()}</td>
                                                        <td className="p-3 text-right">{row.contractorCosts.toLocaleString()}</td>
                                                        <td className={`p-3 text-right font-medium ${row.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                                                            {row.profit.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Contractor Costs table */}
                            <div className="bg-surface rounded-2xl border border-foreground/6 overflow-hidden">
                                <div className="p-4 border-b border-foreground/6">
                                    <h3 className="font-semibold">{t("finances.contractorCosts")}</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm min-w-[600px]">
                                        <thead>
                                            <tr className="border-b border-foreground/6 text-foreground/50">
                                                <th className="text-left p-3">{t("finances.contractorName")}</th>
                                                <th className="text-left p-3">{t("finances.buildingName")}</th>
                                                <th className="text-left p-3">{t("finances.trade")}</th>
                                                <th className="text-right p-3">{t("finances.contractValue")}</th>
                                                <th className="text-left p-3">{t("finances.status")}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contractorCostRows.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-6 text-center text-foreground/40">
                                                        {t("finances.noData")}
                                                    </td>
                                                </tr>
                                            ) : (
                                                contractorCostRows.map((row, idx) => (
                                                    <tr key={idx} className="border-b border-foreground/5">
                                                        <td className="p-3 font-medium">{row.contractorName}</td>
                                                        <td className="p-3">{row.buildingName}</td>
                                                        <td className="p-3">{row.trade}</td>
                                                        <td className="p-3 text-right">
                                                            {row.currency} {row.contractValue.toLocaleString()}
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="capitalize">{row.status.replace("_", " ")}</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </ContentLoader>
                    </main>
                </div>
            </PageTransition>
        </RoleGuard>
    );
}
