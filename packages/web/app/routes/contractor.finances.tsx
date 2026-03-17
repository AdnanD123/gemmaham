import { useState, useCallback } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { DollarSign, Clock, Wrench, CheckCircle } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import StatCard from "../../components/StatCard";
import Badge from "../../components/ui/Badge";
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { PageTransition } from "../../components/ui/PageTransition";
import { useContractor } from "../../lib/hooks/useContractor";
import { format } from "date-fns";
import type { AuthContext, Contractor } from "@gemmaham/shared";
import { toMillis } from "@gemmaham/shared";

type PaymentStatus = "pending" | "received";

interface EarningsRow {
    id: string;
    buildingId: string;
    buildingName: string;
    trade: string;
    contractValue: number;
    currency: string;
    status: string;
    endDate: Contractor["endDate"];
}

export default function ContractorFinances() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { assignments, loading } = useContractor(auth.user?.uid);

    // Track payment status client-side (keyed by assignment id)
    const [paymentStatuses, setPaymentStatuses] = useState<Record<string, PaymentStatus>>({});

    const getPaymentStatus = useCallback(
        (id: string): PaymentStatus => paymentStatuses[id] ?? "pending",
        [paymentStatuses],
    );

    const togglePaymentStatus = useCallback((id: string) => {
        setPaymentStatuses((prev) => ({
            ...prev,
            [id]: prev[id] === "received" ? "pending" : "received",
        }));
    }, []);

    const completed = assignments.filter((a) => a.status === "completed");
    const inProgress = assignments.filter((a) => a.status === "in_progress");
    const upcoming = assignments.filter((a) => a.status === "upcoming");

    const totalEarnings = completed.reduce(
        (sum, a) => sum + (a.contractValue ?? 0),
        0,
    );
    const pendingPayments = inProgress.reduce(
        (sum, a) => sum + (a.contractValue ?? 0),
        0,
    );

    const earningsRows: EarningsRow[] = assignments
        .filter((a) => a.contractValue && a.contractValue > 0)
        .map((a) => ({
            id: a.id,
            buildingId: a.buildingId,
            buildingName: a.buildingName,
            trade: a.trade,
            contractValue: a.contractValue ?? 0,
            currency: a.currency,
            status: a.status,
            endDate: a.endDate,
        }));

    const formatDate = (ts: Contractor["endDate"]): string => {
        const ms = toMillis(ts);
        if (!ms) return "—";
        return format(new Date(ms), "dd MMM yyyy");
    };

    return (
        <RoleGuard allowedRole="contractor">
            <PageTransition>
                <div className="home">
                    <div className="flex">
                        <main className="flex-1 p-6 max-w-5xl">
                            <h1 className="font-serif text-2xl font-bold mb-6">
                                {t("finances.title")}
                            </h1>

                            <ContentLoader loading={loading} skeleton={<DashboardSkeleton />}>
                                {/* Summary cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <StatCard
                                        icon={DollarSign}
                                        value={totalEarnings > 0 ? `${totalEarnings.toLocaleString()}` : "—"}
                                        label={t("finances.totalEarnings")}
                                    />
                                    <StatCard
                                        icon={Clock}
                                        value={pendingPayments > 0 ? `${pendingPayments.toLocaleString()}` : "—"}
                                        label={t("finances.pendingPayments")}
                                    />
                                    <StatCard
                                        icon={Wrench}
                                        value={inProgress.length + upcoming.length}
                                        label={t("finances.activeProjects")}
                                    />
                                    <StatCard
                                        icon={CheckCircle}
                                        value={completed.length}
                                        label={t("finances.completedProjects")}
                                    />
                                </div>

                                {/* Earnings table */}
                                <div className="bg-surface rounded-2xl border border-foreground/6 overflow-hidden">
                                    <div className="p-4 border-b border-foreground/6">
                                        <h3 className="font-semibold">{t("finances.earningsTable")}</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-foreground/6 text-foreground/50">
                                                    <th className="text-left p-3">{t("finances.buildingName")}</th>
                                                    <th className="text-left p-3">{t("finances.trade")}</th>
                                                    <th className="text-right p-3">{t("finances.contractValue")}</th>
                                                    <th className="text-left p-3">{t("finances.status")}</th>
                                                    <th className="text-left p-3">{t("finances.paymentStatus")}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {earningsRows.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={5} className="p-6 text-center text-foreground/40">
                                                            {t("finances.noData")}
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    earningsRows.map((row) => (
                                                        <tr key={row.id} className="border-b border-foreground/5">
                                                            <td className="p-3 font-medium">{row.buildingName}</td>
                                                            <td className="p-3">{row.trade}</td>
                                                            <td className="p-3 text-right">
                                                                {row.currency} {row.contractValue.toLocaleString()}
                                                            </td>
                                                            <td className="p-3">
                                                                <Badge variant={row.status}>
                                                                    {row.status.replace("_", " ")}
                                                                </Badge>
                                                            </td>
                                                            <td className="p-3">
                                                                {row.status === "completed" ? (
                                                                    <button
                                                                        onClick={() => togglePaymentStatus(row.id)}
                                                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                                                            getPaymentStatus(row.id) === "received"
                                                                                ? "bg-green-100 text-green-700"
                                                                                : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                                                        }`}
                                                                    >
                                                                        {getPaymentStatus(row.id) === "received"
                                                                            ? t("finances.received")
                                                                            : t("finances.markReceived")}
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-foreground/40 text-xs">—</span>
                                                                )}
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
                </div>
            </PageTransition>
        </RoleGuard>
    );
}
