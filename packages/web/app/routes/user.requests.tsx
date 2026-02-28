import { useState, useEffect, useMemo } from "react";
import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import UserSidebar from "../../components/UserSidebar";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ReservationListSkeleton from "../../components/skeletons/ReservationSkeleton";
import { getUserCustomizationRequests, updateCustomizationRequestStatus, getFlat } from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, CustomizationRequest, RequestStatus } from "@gemmaham/shared";

interface EnrichedRequest extends CustomizationRequest {
    flatTitle?: string;
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
                const enriched = await Promise.all(
                    reqs.map(async (req) => {
                        const flat = await getFlat(req.flatId).catch(() => null);
                        return { ...req, flatTitle: flat?.title || req.flatId };
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

    const filterTabs: { key: FilterTab; label: string }[] = [
        { key: "all", label: t("flatCustomization.filterAll") },
        { key: "pending", label: t("flatCustomization.filterPending") },
        { key: "approved", label: t("flatCustomization.filterApproved") },
        { key: "rejected", label: t("flatCustomization.filterRejected") },
    ];

    return (
        <RoleGuard allowedRole="user">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <UserSidebar />
                    <main className="flex-1 p-6 max-w-4xl">
                        <h1 className="text-2xl font-bold mb-6">{t("customizations.myRequests")}</h1>

                        {loading ? (
                            <ReservationListSkeleton />
                        ) : requests.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-foreground/40">{t("customizations.noRequestsUser")}</p>
                            </div>
                        ) : (
                            <>
                                {/* Filter Tabs */}
                                <div className="flex gap-1 mb-6 bg-foreground/5 rounded-lg p-1 w-fit">
                                    {filterTabs.map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setActiveFilter(tab.key)}
                                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                                activeFilter === tab.key
                                                    ? "bg-surface shadow-sm font-medium text-foreground"
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
                                                </div>

                                                {/* Requests for this flat */}
                                                <div className="space-y-3">
                                                    {group.requests.map((req) => (
                                                        <div key={req.id} className="p-4 bg-surface rounded-xl border-2 border-foreground/10">
                                                            <div className="flex items-start justify-between gap-4">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Badge variant={req.status as any}>{t(`customizations.reqStatus.${req.status}`)}</Badge>
                                                                    </div>
                                                                    <p className="text-sm text-foreground/60">
                                                                        {t("customizations.selectedOption")}: <span className="font-medium text-foreground">{req.selectedOption}</span>
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
        </RoleGuard>
    );
}
