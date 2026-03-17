import { useState, useEffect, useMemo } from "react";
import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
    Building2, Home, DoorOpen, DollarSign, CalendarCheck,
    AlertTriangle, ClipboardList, Palette, Users, Clock,
    ArrowRight, ChevronRight,
} from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import StatCard from "../../components/StatCard";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import RevenueChart from "../../components/charts/RevenueChart";
import OccupancyChart from "../../components/charts/OccupancyChart";
import RevenueByPropertyChart from "../../components/charts/RevenueByPropertyChart";
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import {
    listCompanyBuildings, listCompanyFlats, listCompanyHouses,
    getCompanyReservations, getCompany, updateReservationStatus,
    getCompanyApplications, getCompanyCustomizationRequests,
} from "../../lib/firestore";
import { deriveCompanyRevenue } from "../../lib/revenue";
import { useToast } from "../../lib/contexts/ToastContext";
import { formatDistanceToNow } from "date-fns";
import type { AuthContext, Company, Flat, House, Reservation, ContractorApplication, CustomizationRequest } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

type DateRange = "30d" | "90d" | "1y" | "all";

interface AttentionItem {
    icon: typeof AlertTriangle;
    label: string;
    count: number;
    color: string;
    linkTo: string;
}

export default function CompanyDashboard() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { addToast } = useToast();
    const [company, setCompany] = useState<Company | null>(null);
    const [flats, setFlats] = useState<Flat[]>([]);
    const [houses, setHouses] = useState<House[]>([]);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [applications, setApplications] = useState<ContractorApplication[]>([]);
    const [custRequests, setCustRequests] = useState<CustomizationRequest[]>([]);
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
            const [compResult, buildingsResult, flatsResult, housesResult, resResult, appsResult, reqsResult] = await Promise.allSettled([
                getCompany(cid),
                listCompanyBuildings(cid),
                listCompanyFlats(cid),
                listCompanyHouses(cid),
                getCompanyReservations(cid),
                getCompanyApplications(cid, "pending"),
                getCompanyCustomizationRequests(cid),
            ]);

            if (compResult.status === "fulfilled") setCompany(compResult.value);

            const b = buildingsResult.status === "fulfilled" ? buildingsResult.value : [];
            const f = flatsResult.status === "fulfilled" ? flatsResult.value : [];
            const h = housesResult.status === "fulfilled" ? housesResult.value : [];
            const res = resResult.status === "fulfilled" ? resResult.value.items : [];
            const apps = appsResult.status === "fulfilled" ? appsResult.value : [];
            const reqs = reqsResult.status === "fulfilled" ? reqsResult.value : [];

            setFlats(f);
            setHouses(h);
            setReservations(res);
            setApplications(apps);
            setCustRequests(reqs);
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

    const pendingReservations = reservations.filter((r) => r.status === "requested");
    const pendingRequests = custRequests.filter((r) => r.status === "pending");
    const expiringReservations = reservations.filter((r) => {
        if (r.status !== "approved" && r.status !== "requested") return false;
        if (!r.expiresAt) return false;
        const expiresAt = r.expiresAt instanceof Date ? r.expiresAt : new Date((r.expiresAt as any).seconds * 1000);
        const twoDays = 2 * 24 * 60 * 60 * 1000;
        return expiresAt.getTime() - Date.now() < twoDays;
    });

    const attentionItems = useMemo<AttentionItem[]>(() => {
        const items: AttentionItem[] = [];
        if (pendingReservations.length > 0) {
            items.push({
                icon: CalendarCheck,
                label: t("company.pendingReservations"),
                count: pendingReservations.length,
                color: "text-orange-500",
                linkTo: "/company/reservations",
            });
        }
        if (applications.length > 0) {
            items.push({
                icon: Users,
                label: t("company.pendingApplications", { defaultValue: "Contractor Applications" }),
                count: applications.length,
                color: "text-blue-500",
                linkTo: "/company/buildings",
            });
        }
        if (pendingRequests.length > 0) {
            items.push({
                icon: Palette,
                label: t("company.pendingCustomizations", { defaultValue: "Customization Requests" }),
                count: pendingRequests.length,
                color: "text-purple-500",
                linkTo: "/company/requests",
            });
        }
        if (expiringReservations.length > 0) {
            items.push({
                icon: Clock,
                label: t("company.expiringSoon", { defaultValue: "Expiring Soon" }),
                count: expiringReservations.length,
                color: "text-red-500",
                linkTo: "/company/reservations",
            });
        }
        return items;
    }, [pendingReservations, applications, pendingRequests, expiringReservations, t]);

    const allProperties = [...flats, ...houses];
    const occupancyData = [
        { label: t("dashboard.available"), value: allProperties.filter((p) => p.status === "available").length, color: "#30d158" },
        { label: t("dashboard.reserved"), value: allProperties.filter((p) => p.status === "reserved").length, color: "#5856d6" },
        { label: t("dashboard.sold"), value: allProperties.filter((p) => p.status === "sold").length, color: "#ff6b6b" },
    ];

    const performance = [
        ...flats.map((f) => ({ ...f, type: "flat" })),
        ...houses.map((h) => ({ ...h, type: "house" })),
    ];

    const handleApprove = async (id: string) => {
        try {
            await updateReservationStatus(id, "approved");
            setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: "approved" as const } : r));
            setStats((prev) => ({ ...prev, pending: prev.pending - 1 }));
            addToast("success", t("toast.reservationApproved"));
        } catch {
            addToast("error", t("errors.loadFailed"));
        }
    };

    const handleReject = async (id: string) => {
        try {
            await updateReservationStatus(id, "rejected");
            setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status: "rejected" as const } : r));
            setStats((prev) => ({ ...prev, pending: prev.pending - 1 }));
            addToast("success", t("toast.reservationRejected"));
        } catch {
            addToast("error", t("errors.loadFailed"));
        }
    };

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6 max-w-5xl">
                        <h1 className="text-2xl font-bold mb-2">
                            {company ? t("company.welcome", { name: company.name }) : t("company.dashboard")}
                        </h1>
                        <p className="text-foreground/50 mb-8">{t("company.manageDesc")}</p>

                        <ContentLoader loading={loading} skeleton={<DashboardSkeleton />}>
                                {/* Needs Attention Section */}
                                {attentionItems.length > 0 && (
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                                            <h2 className="font-semibold text-lg">{t("company.needsAttention", { defaultValue: "Needs Attention" })}</h2>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                            {attentionItems.map((item) => (
                                                <Link
                                                    key={item.linkTo + item.label}
                                                    to={item.linkTo}
                                                    className="flex items-center gap-3 p-4 bg-surface rounded-2xl border border-foreground/6 hover:border-primary/30 transition-colors group"
                                                >
                                                    <div className={`p-2 rounded-lg bg-foreground/5 ${item.color}`}>
                                                        <item.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-2xl font-bold">{item.count}</p>
                                                        <p className="text-xs text-foreground/50 truncate">{item.label}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Stat cards */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                                    <StatCard icon={Building2} value={stats.buildings} label={t("buildings.myBuildings")} linkTo="/company/buildings" />
                                    <StatCard icon={DoorOpen} value={stats.flats} label={t("properties.flats")} linkTo="/company/properties" />
                                    <StatCard icon={Home} value={stats.houses} label={t("properties.houses")} linkTo="/company/properties" />
                                    <StatCard icon={DollarSign} value={revenue.total > 0 ? `${revenue.total.toLocaleString()}` : "—"} label={t("dashboard.totalRevenue")} />
                                    <StatCard icon={CalendarCheck} value={stats.pending} label={t("company.pendingReservations")} linkTo="/company/reservations" />
                                </div>

                                {/* Pending reservations — quick actions */}
                                {pendingReservations.length > 0 && (
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="font-semibold text-lg">{t("dashboard.pendingActions")}</h2>
                                            <Link to="/company/reservations" className="text-sm text-primary hover:underline flex items-center gap-1">
                                                {t("dashboard.viewAll")} <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </div>
                                        <div className="space-y-3">
                                            {pendingReservations.slice(0, 5).map((r) => {
                                                const requestDate = r.requestDate
                                                    ? formatDistanceToNow(
                                                        r.requestDate instanceof Date ? r.requestDate : new Date((r.requestDate as any).seconds * 1000),
                                                        { addSuffix: true }
                                                    )
                                                    : "";
                                                return (
                                                    <div key={r.id} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-foreground/6">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            {r.userSnapshot?.photoURL ? (
                                                                <img loading="lazy" src={r.userSnapshot.photoURL} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                            ) : (
                                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                                    {(r.userSnapshot?.displayName || r.userName || "?").charAt(0).toUpperCase()}
                                                                </div>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-sm truncate">
                                                                    {r.userSnapshot?.displayName || r.userName || r.userId}
                                                                </p>
                                                                <p className="text-xs text-foreground/50">
                                                                    {r.propertyType === "house" ? t("properties.houses") : t("properties.flats")}
                                                                    {requestDate && ` · ${requestDate}`}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <Button size="sm" onClick={() => handleApprove(r.id)}>{t("reservation.approve")}</Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleReject(r.id)}>
                                                                <span className="text-red-500">{t("reservation.reject")}</span>
                                                            </Button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    <RevenueChart data={filterMonthly(revenue.monthly)} title={t("charts.monthlyRevenue")} loading={false} />
                                    <OccupancyChart data={occupancyData} title={t("charts.occupancy")} loading={false} />
                                </div>

                                <div className="mb-8">
                                    <RevenueByPropertyChart
                                        flatRevenue={revenue.byType.flat}
                                        houseRevenue={revenue.byType.house}
                                        title={t("charts.revenueByProperty")}
                                        loading={false}
                                    />
                                </div>

                                {/* Property performance table */}
                                {performance.length > 0 && (
                                    <div className="bg-surface rounded-2xl border border-foreground/6 overflow-hidden mb-8">
                                        <div className="p-4 border-b border-foreground/6">
                                            <h3 className="font-semibold">{t("analytics.propertyPerformance")}</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-foreground/6 text-foreground/50">
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
                                                            <td className="p-3"><Badge variant={p.status}>{p.status}</Badge></td>
                                                            <td className="p-3 text-right font-medium">{p.currency} {p.price.toLocaleString()}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}

                                {/* Empty state — onboarding checklist */}
                                {stats.buildings === 0 && stats.flats === 0 && stats.houses === 0 && (
                                    <div className="py-8 bg-surface rounded-2xl border border-foreground/6">
                                        <p className="text-center text-foreground/50 mb-6">{t("company.getStartedDesc")}</p>
                                        <div className="max-w-md mx-auto space-y-4 px-6">
                                            <Link to="/company/buildings/new" className="flex items-center gap-4 p-4 rounded-xl border border-foreground/6 hover:border-primary/30 transition-colors group">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">1</div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{t("onboarding.step1Title")}</p>
                                                    <p className="text-xs text-foreground/50">{t("onboarding.step1Desc")}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                                            </Link>
                                            <Link to="/company/properties" className="flex items-center gap-4 p-4 rounded-xl border border-foreground/6 hover:border-primary/30 transition-colors group">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">2</div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm group-hover:text-primary transition-colors">{t("onboarding.step2Title")}</p>
                                                    <p className="text-xs text-foreground/50">{t("onboarding.step2Desc")}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                                            </Link>
                                            <div className="flex items-center gap-4 p-4 rounded-xl border border-foreground/6 opacity-60">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground/5 text-foreground/40 font-bold text-sm shrink-0">3</div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-sm">{t("onboarding.step3Title")}</p>
                                                    <p className="text-xs text-foreground/50">{t("onboarding.step3Desc")}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                        </ContentLoader>
                    </main>
                </div>
            </div>
            </PageTransition>
        </RoleGuard>
    );
}
