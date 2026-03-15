import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Building2, Home, DoorOpen, DollarSign, CalendarCheck } from "lucide-react";
import Navbar from "../../components/Navbar";
import RoleGuard from "../../components/RoleGuard";
import StatCard from "../../components/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import RevenueChart from "../../components/charts/RevenueChart";
import OccupancyChart from "../../components/charts/OccupancyChart";
import RevenueByPropertyChart from "../../components/charts/RevenueByPropertyChart";
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";
import { listCompanyBuildings, listCompanyFlats, listCompanyHouses, getCompanyReservations, getCompany, updateReservationStatus } from "../../lib/firestore";
import { deriveCompanyRevenue } from "../../lib/revenue";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, Company, Flat, House, Reservation } from "@gemmaham/shared";

type DateRange = "30d" | "90d" | "1y" | "all";

export default function CompanyDashboard() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { addToast } = useToast();
    const [company, setCompany] = useState<Company | null>(null);
    const [flats, setFlats] = useState<Flat[]>([]);
    const [houses, setHouses] = useState<House[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [stats, setStats] = useState({ buildings: 0, flats: 0, houses: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>("all");

    useEffect(() => {
        if (!auth.companyId) {
            setLoading(false);
            return;
        }
        const cid = auth.companyId!;
        (async () => {
            const [compResult, buildingsResult, flatsResult, housesResult, resResult] = await Promise.allSettled([
                getCompany(cid),
                listCompanyBuildings(cid),
                listCompanyFlats(cid),
                listCompanyHouses(cid),
                getCompanyReservations(cid),
            ]);

            if (compResult.status === "fulfilled") setCompany(compResult.value);
            else console.error("Failed to load company:", compResult.reason);

            const b = buildingsResult.status === "fulfilled" ? buildingsResult.value : [];
            const f = flatsResult.status === "fulfilled" ? flatsResult.value : [];
            const h = housesResult.status === "fulfilled" ? housesResult.value : [];
            const res = resResult.status === "fulfilled" ? resResult.value.items : [];

            setFlats(f);
            setHouses(h);
            setReservations(res);
            setStats({
                buildings: b.length,
                flats: f.length,
                houses: h.length,
                pending: res.filter((r) => r.status === "requested").length,
            });
            setLoading(false);
        })();
    }, [auth.companyId]);

    const revenue = deriveCompanyRevenue(reservations, flats, houses);

    const filterMonthly = (data: { month: string; revenue: number }[]) => {
        if (dateRange === "all") return data;
        const days = dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
        const cutoff = new Date(Date.now() - days * 86400000);
        const cutoffMonth = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`;
        return data.filter((d) => d.month >= cutoffMonth);
    };

    const pendingReservations = reservations.filter((r) => r.status === "requested").slice(0, 5);

    const allProperties = [...flats, ...houses];
    const occupancyData = [
        { label: t("dashboard.available"), value: allProperties.filter((p) => p.status === "available").length, color: "#22c55e" },
        { label: t("dashboard.reserved"), value: allProperties.filter((p) => p.status === "reserved").length, color: "#f97316" },
        { label: t("dashboard.sold"), value: allProperties.filter((p) => p.status === "sold").length, color: "#ef4444" },
    ];

    const performance = [
        ...flats.map((f) => ({ ...f, type: "flat" })),
        ...houses.map((h) => ({ ...h, type: "house" })),
    ];

    const handleApprove = async (id: string) => {
        try {
            await updateReservationStatus(id, "approved");
            setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" } : r));
            setStats((prev) => ({ ...prev, pending: prev.pending - 1 }));
            addToast("success", t("toast.reservationApproved"));
        } catch {
            addToast("error", t("errors.loadFailed"));
        }
    };

    const handleReject = async (id: string) => {
        try {
            await updateReservationStatus(id, "rejected");
            setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" } : r));
            setStats((prev) => ({ ...prev, pending: prev.pending - 1 }));
            addToast("success", t("toast.reservationRejected"));
        } catch {
            addToast("error", t("errors.loadFailed"));
        }
    };

    return (
        <RoleGuard allowedRole="company">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <main className="flex-1 p-6 max-w-5xl">
                        <h1 className="text-2xl font-bold mb-2">
                            {company ? t("company.welcome", { name: company.name }) : t("company.dashboard")}
                        </h1>
                        <p className="text-foreground/50 mb-8">{t("company.manageDesc")}</p>

                        {loading ? (
                            <DashboardSkeleton />
                        ) : (
                            <>
                                {/* Stat cards */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                    <StatCard icon={Building2} value={stats.buildings} label={t("buildings.myBuildings")} linkTo="/company/buildings" />
                                    <StatCard icon={DoorOpen} value={stats.flats} label={t("properties.flats")} linkTo="/company/properties" />
                                    <StatCard icon={Home} value={stats.houses} label={t("properties.houses")} linkTo="/company/properties" />
                                    <StatCard icon={DollarSign} value={revenue.total > 0 ? `${revenue.total.toLocaleString()}` : "—"} label={t("dashboard.totalRevenue")} />
                                    <StatCard icon={CalendarCheck} value={stats.pending} label={t("company.pendingReservations")} linkTo="/company/reservations" />
                                </div>

                                {/* Pending reservations */}
                                {pendingReservations.length > 0 && (
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="font-semibold text-lg">{t("dashboard.pendingActions")}</h2>
                                            <Link to="/company/reservations" className="text-sm text-primary hover:underline">
                                                {t("dashboard.viewAll")}
                                            </Link>
                                        </div>
                                        <div className="space-y-3">
                                            {pendingReservations.map((r) => (
                                                <div key={r.id} className="flex items-center justify-between p-4 bg-surface rounded-xl border-2 border-foreground/10">
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {r.propertyType === "house" ? t("properties.houses") : t("properties.flats")} — {t("reservations.reservation")}
                                                        </p>
                                                        <p className="text-xs text-foreground/50">{r.userName || r.userId}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button size="sm" onClick={() => handleApprove(r.id)}>{t("reservation.approve")}</Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleReject(r.id)}>
                                                            <span className="text-red-500">{t("reservation.reject")}</span>
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Analytics section */}
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="font-semibold text-lg">{t("analytics.title")}</h2>
                                    <div className="flex gap-2">
                                        {(["30d", "90d", "1y", "all"] as const).map((range) => (
                                            <button
                                                key={range}
                                                onClick={() => setDateRange(range)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                                    dateRange === range ? "bg-primary text-white" : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                                                }`}
                                            >
                                                {range === "30d" ? t("analytics.last30") : range === "90d" ? t("analytics.last90") : range === "1y" ? t("analytics.lastYear") : t("analytics.allTime")}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    <RevenueChart data={filterMonthly(revenue.monthly)} title={t("charts.monthlyRevenue")} loading={false} />
                                    <OccupancyChart data={occupancyData} title={t("charts.occupancy")} loading={false} />
                                </div>

                                <div className="mb-6">
                                    <RevenueByPropertyChart
                                        flatRevenue={revenue.byType.flat}
                                        houseRevenue={revenue.byType.house}
                                        title={t("charts.revenueByProperty")}
                                        loading={false}
                                    />
                                </div>

                                {/* Property performance table */}
                                {performance.length > 0 && (
                                    <div className="bg-surface rounded-xl border-2 border-foreground/10 overflow-hidden mb-8">
                                        <div className="p-4 border-b border-foreground/10">
                                            <h3 className="font-semibold">{t("analytics.propertyPerformance")}</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-foreground/10 text-foreground/50">
                                                        <th className="text-left p-3">{t("company.title")}</th>
                                                        <th className="text-left p-3">{t("common.type")}</th>
                                                        <th className="text-left p-3">{t("company.statusLabel")}</th>
                                                        <th className="text-right p-3">{t("company.price")}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {performance.map((p) => (
                                                        <tr key={p.id} className="border-b border-foreground/5 hover:bg-foreground/2 transition-colors">
                                                            <td className="p-3 font-medium">{p.title}</td>
                                                            <td className="p-3 capitalize">{p.type}</td>
                                                            <td className="p-3"><Badge variant={p.status as any}>{p.status}</Badge></td>
                                                            <td className="p-3 text-right font-medium">{p.currency} {p.price.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Empty state */}
                                {stats.buildings === 0 && stats.flats === 0 && stats.houses === 0 && (
                                    <div className="text-center py-8 bg-surface rounded-xl border-2 border-foreground/10">
                                        <p className="text-foreground/50 mb-4">{t("company.getStartedDesc")}</p>
                                        <Link to="/company/buildings/new">
                                            <Button>{t("buildings.addFirstBuilding")}</Button>
                                        </Link>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
