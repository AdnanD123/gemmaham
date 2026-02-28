import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import CompanySidebar from "../../components/CompanySidebar";
import RoleGuard from "../../components/RoleGuard";
import RevenueChart from "../../components/charts/RevenueChart";
import OccupancyChart from "../../components/charts/OccupancyChart";
import RevenueByPropertyChart from "../../components/charts/RevenueByPropertyChart";
import { listCompanyFlats, listCompanyHouses, getCompanyReservations } from "../../lib/firestore";
import { deriveCompanyRevenue } from "../../lib/revenue";
import type { AuthContext, Flat, House, Reservation } from "@gemmaham/shared";

type DateRange = "30d" | "90d" | "1y" | "all";

export default function CompanyAnalytics() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>("all");
    const [flats, setFlats] = useState<Flat[]>([]);
    const [houses, setHouses] = useState<House[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);

    useEffect(() => {
        if (!auth.companyId) return;
        (async () => {
            try {
                const [f, h, rResult] = await Promise.all([
                    listCompanyFlats(auth.companyId!),
                    listCompanyHouses(auth.companyId!),
                    getCompanyReservations(auth.companyId!),
                ]);
                setFlats(f);
                setHouses(h);
                setReservations(rResult.items);
            } catch (err) {
                console.error("Failed to load analytics:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.companyId]);

    const revenue = deriveCompanyRevenue(reservations, flats, houses);

    // Filter monthly data by date range
    const filterMonthly = (data: { month: string; revenue: number }[]) => {
        if (dateRange === "all") return data;
        const now = new Date();
        const days = dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
        const cutoff = new Date(now.getTime() - days * 86400000);
        const cutoffMonth = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`;
        return data.filter((d) => d.month >= cutoffMonth);
    };

    // Occupancy data
    const allProperties = [...flats, ...houses];
    const occupancyData = [
        { label: "Available", value: allProperties.filter((p) => p.status === "available").length, color: "#22c55e" },
        { label: "Reserved", value: allProperties.filter((p) => p.status === "reserved").length, color: "#f97316" },
        { label: "Sold", value: allProperties.filter((p) => p.status === "sold").length, color: "#ef4444" },
    ];

    // Property performance table
    const performance = [...flats.map((f) => ({ ...f, type: "flat" })), ...houses.map((h) => ({ ...h, type: "house" }))];

    return (
        <RoleGuard allowedRole="company">
            <Navbar />
            <div className="flex mt-20">
                <CompanySidebar />
                <main className="flex-1 p-6 max-w-5xl">
                    <h1 className="font-serif text-2xl font-bold mb-6">{t("analytics.title")}</h1>

                    {/* Date range selector */}
                    <div className="flex gap-2 mb-6">
                        {(["30d", "90d", "1y", "all"] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    dateRange === range ? "bg-primary text-white" : "bg-foreground/5 text-foreground/60"
                                }`}
                            >
                                {range === "30d" ? t("analytics.last30") : range === "90d" ? t("analytics.last90") : range === "1y" ? t("analytics.lastYear") : t("analytics.allTime")}
                            </button>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <RevenueChart
                            data={filterMonthly(revenue.monthly)}
                            title={t("charts.monthlyRevenue")}
                            loading={loading}
                        />
                        <OccupancyChart
                            data={occupancyData}
                            title={t("charts.occupancy")}
                            loading={loading}
                        />
                    </div>

                    <div className="mb-6">
                        <RevenueByPropertyChart
                            flatRevenue={revenue.byType.flat}
                            houseRevenue={revenue.byType.house}
                            title={t("charts.revenueByProperty")}
                            loading={loading}
                        />
                    </div>

                    {/* Property performance table */}
                    <div className="bg-surface rounded-xl border-2 border-foreground/10 overflow-hidden">
                        <div className="p-4 border-b border-foreground/10">
                            <h3 className="font-semibold">{t("analytics.propertyPerformance")}</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-foreground/10 text-foreground/50">
                                        <th className="text-left p-3">Title</th>
                                        <th className="text-left p-3">Type</th>
                                        <th className="text-left p-3">Status</th>
                                        <th className="text-right p-3">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {performance.map((p) => (
                                        <tr key={p.id} className="border-b border-foreground/5">
                                            <td className="p-3 font-medium">{p.title}</td>
                                            <td className="p-3"><span className="capitalize">{p.type}</span></td>
                                            <td className="p-3"><span className="capitalize">{p.status}</span></td>
                                            <td className="p-3 text-right">{p.currency} {p.price.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </RoleGuard>
    );
}
