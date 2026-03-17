import { useState, useEffect, useMemo } from "react";
import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { DollarSign, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ReservationListSkeleton from "../../components/skeletons/ReservationSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { getUserCustomizationRequests, updateCustomizationRequestStatus, getFlat, getCustomizationOptions } from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, CustomizationRequest, RequestStatus } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

interface EnrichedRequest extends CustomizationRequest {
    flatTitle?: string;
    priceImpact?: number | null;
    optionTitle?: string;
}

type FilterTab = "all" | "pending" | "approved" | "rejected";

export default function UserRequests() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const [requests, setRequests] = useState<EnrichedRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelTarget, setCancelTarget] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
    const { addToast } = useToast();

    useEffect(() => {
        if (!auth.user) return;
        (async () => {
            try {
                const reqs = await getUserCustomizationRequests(auth.user!.uid);
                // Cache customization options per flat to avoid duplicate fetches
                const optionsCache: Record<string, Awaited<ReturnType<typeof getCustomizationOptions>>> = {};
                const enriched = await Promise.all(
                    reqs.map(async (req) => {
                        const flat = await getFlat(req.flatId).catch(() => null);
                        if (!optionsCache[req.flatId]) {
                            optionsCache[req.flatId] = await getCustomizationOptions(req.flatId).catch(() => []);
                        }
                        const option = optionsCache[req.flatId].find((o) => o.id === req.customizationOptionId);
                        return {
                            ...req,
                            flatTitle: flat?.title || req.flatId,
                            priceImpact: option?.priceImpact ?? null,
                            optionTitle: option?.title,
                        };
                    })
                );
                setRequests(enriched);
            } catch (e) {
                console.error("Failed to load requests:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.user]);

    const handleCancel = async () => {
        if (!cancelTarget) return;
        try {
            await updateCustomizationRequestStatus(cancelTarget, "cancelled");
            setRequests((prev) => prev.map((r) => r.id === cancelTarget ? { ...r, status: "cancelled" } : r));
            addToast("success", t("toast.requestCancelled"));
        } catch (e) {
            console.error("Failed to cancel request:", e);
            addToast("error", t("toast.requestFailed"));
        } finally {
            setCancelTarget(null);
        }
    };

    // Filter requests
    const filteredRequests = useMemo(() => {
        if (activeFilter === "all") return requests;
        return requests.filter((r) => r.status === activeFilter);
    }, [requests, activeFilter]);

    // Group by flat
    const groupedByFlat = useMemo(() => {
        const groups: Record<string, { flatTitle: string; flatId: string; requests: EnrichedRequest[] }> = {};
        filteredRequests.forEach((req) => {
            if (!groups[req.flatId]) {
                groups[req.flatId] = { flatTitle: req.flatTitle || req.flatId, flatId: req.flatId, requests: [] };
            }
            groups[req.flatId].requests.push(req);
        });
        return Object.values(groups);
    }, [filteredRequests]);

    // Counts for filter tabs
    const counts = useMemo(() => ({
        all: requests.length,
        pending: requests.filter((r) => r.status === "pending").length,
        approved: requests.filter((r) => r.status === "approved").length,
        rejected: requests.filter((r) => r.status === "rejected").length,
    }), [requests]);

    // Price summary
    const priceSummary = useMemo(() => {
        const active = requests.filter((r) => r.status !== "cancelled");
        const totalImpact = active.reduce((sum, r) => sum + (r.priceImpact || 0), 0);
        const pendingImpact = active.filter((r) => r.status === "pending").reduce((sum, r) => sum + (r.priceImpact || 0), 0);
        const approvedImpact = active.filter((r) => r.status === "approved" || r.status === "completed").reduce((sum, r) => sum + (r.priceImpact || 0), 0);
        return { totalSelections: active.length, totalImpact, pendingImpact, approvedImpact };
    }, [requests]);

    const filterTabs: { key: FilterTab; label: string }[] = [
        { key: "all", label: t("flatCustomization.filterAll") },
        { key: "pending", label: t("flatCustomization.filterPending") },
        { key: "approved", label: t("flatCustomization.filterApproved") },
        { key: "rejected", label: t("flatCustomization.filterRejected") },
    ];

    return (
        <RoleGuard allowedRole="user">
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6 max-w-4xl">
                        <h1 className="text-2xl font-bold mb-6">{t("customizations.myRequests")}</h1>

                        <ContentLoader loading={loading} skeleton={<ReservationListSkeleton />}>
                            {requests.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-foreground/40">{t("customizations.noRequestsUser")}</p>
                                </div>
                            ) : (
                            <>
                                {/* Price Summary Card */}
                                {priceSummary.totalImpact !== 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                                        <div className="p-4 bg-surface rounded-2xl border border-foreground/6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <DollarSign size={14} className="text-primary" />
                                                <span className="text-xs text-foreground/50">{t("customizations.totalImpact")}</span>
                                            </div>
                                            <p className="text-lg font-bold text-foreground">
                                                {priceSummary.totalImpact > 0 ? "+" : ""}{priceSummary.totalImpact.toLocaleString()} EUR
                                            </p>
                                        </div>
                                        <div className="p-4 bg-surface rounded-2xl border border-foreground/6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TrendingUp size={14} className="text-foreground/40" />
                                                <span className="text-xs text-foreground/50">{t("customizations.totalSelections")}</span>
                                            </div>
                                            <p className="text-lg font-bold text-foreground">{priceSummary.totalSelections}</p>
                                        </div>
                                        <div className="p-4 bg-surface rounded-2xl border border-foreground/6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Clock size={14} className="text-yellow-500" />
                                                <span className="text-xs text-foreground/50">{t("customizations.pendingImpact")}</span>
                                            </div>
                                            <p className="text-lg font-bold text-foreground">
                                                {priceSummary.pendingImpact > 0 ? "+" : ""}{priceSummary.pendingImpact.toLocaleString()} EUR
                                            </p>
                                        </div>
                                        <div className="p-4 bg-surface rounded-2xl border border-foreground/6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle2 size={14} className="text-green-500" />
                                                <span className="text-xs text-foreground/50">{t("customizations.approvedImpact")}</span>
                                            </div>
                                            <p className="text-lg font-bold text-foreground">
                                                {priceSummary.approvedImpact > 0 ? "+" : ""}{priceSummary.approvedImpact.toLocaleString()} EUR
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Filter Tabs */}
                                <div className="flex gap-1 mb-6 bg-foreground/5 rounded-lg p-1 w-fit">
                                    {filterTabs.map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActiveFilter(tab.key)}
                                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                                activeFilter === tab.key
                                                    ? "bg-primary text-white font-medium"
                                                    : "text-foreground/50 hover:text-foreground/70"
                                            }`}
                                        >
                                            {tab.label}
                                            {counts[tab.key] > 0 && (
                                                <span className="ml-1.5 text-xs text-foreground/40">({counts[tab.key]})</span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {filteredRequests.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-foreground/40">{t("customizations.noRequests")}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {groupedByFlat.map((group) => (
                                            <div key={group.flatId}>
                                                {/* Flat group header */}
                                                <div className="flex items-center justify-between mb-3">
                                                    <Link
                                                        to={`/flats/${group.flatId}`}
                                                        className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
                                                    >
                                                        {group.flatTitle}
                                                        <span className="text-foreground/30 ml-2">({group.requests.length})</span>
                                                    </Link>
                                                    {(() => {
                                                        const groupImpact = group.requests
                                                            .filter((r) => r.status !== "cancelled")
                                                            .reduce((sum, r) => sum + (r.priceImpact || 0), 0);
                                                        return groupImpact !== 0 ? (
                                                            <span className="text-xs text-foreground/50">
                                                                {groupImpact > 0 ? "+" : ""}{groupImpact.toLocaleString()} EUR
                                                            </span>
                                                        ) : null;
                                                    })()}
                                                </div>

                                                {/* Requests for this flat */}
                                                <div className="space-y-3">
                                                    {group.requests.map((req) => (
                                                        <div key={req.id} className="p-4 bg-surface rounded-2xl border border-foreground/6">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Badge variant={req.status as any}>{t(`customizations.reqStatus.${req.status}`)}</Badge>
                                                                    </div>
                                                                    <p className="text-sm text-foreground/60">
                                                                        {req.optionTitle && <span className="text-foreground/40">{req.optionTitle}: </span>}
                                                                        <span className="font-medium text-foreground">{req.selectedOption}</span>
                                                                        {req.priceImpact != null && req.priceImpact !== 0 && (
                                                                            <span className="ml-2 text-xs font-medium text-primary">
                                                                                {req.priceImpact > 0 ? "+" : ""}{req.priceImpact.toLocaleString()} EUR
                                                                            </span>
                                                                        )}
                                                                        {req.priceImpact === 0 && (
                                                                            <span className="ml-2 text-xs text-foreground/40">{t("customizations.included")}</span>
                                                                        )}
                                                                    </p>
                                                                    {req.notes && (
                                                                        <p className="text-sm text-foreground/50 mt-1 italic">"{req.notes}"</p>
                                                                    )}
                                                                    {req.companyNotes && (
                                                                        <p className="text-sm text-primary mt-2">
                                                                            {t("customizations.agencyNote")}: {req.companyNotes}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                                <div className="flex gap-2 shrink-0">
                                                                    {req.status === "pending" && (
                                                                        <Button size="sm" variant="ghost" onClick={() => setCancelTarget(req.id)}>
                                                                            {t("common.cancel")}
                                                                        </Button>
                                                                    )}
                                                                    {req.status === "rejected" && (
                                                                        <Link to={`/flats/${req.flatId}`}>
                                                                            <Button size="sm" variant="ghost">
                                                                                {t("flatCustomization.resubmit")}
                                                                            </Button>
                                                                        </Link>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                        </ContentLoader>
                    </main>
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!cancelTarget}
                onClose={() => setCancelTarget(null)}
                onConfirm={handleCancel}
                title={t("customizations.cancelRequestTitle")}
                message={t("customizations.cancelRequestMsg")}
                confirmLabel={t("common.confirm")}
            />
            </PageTransition>
        </RoleGuard>
    );
}
