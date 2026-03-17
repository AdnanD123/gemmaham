import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2 } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Textarea from "../../components/ui/Textarea";
import ReservationListSkeleton from "../../components/skeletons/ReservationSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import {
    getCompanyCustomizationRequests, updateCustomizationRequestStatus,
    getFlat, getUserProfile,
} from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, CustomizationRequest, RequestStatus } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

interface EnrichedRequest extends CustomizationRequest {
    flatTitle?: string;
    userName?: string;
}

type FilterTab = "all" | "pending" | "approved" | "rejected";

const RESPONSE_TEMPLATES = [
    "responseTemplateApproved",
    "responseTemplateModified",
    "responseTemplateUnavailable",
] as const;

export default function CompanyRequests() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const [requests, setRequests] = useState<EnrichedRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [respondingTo, setRespondingTo] = useState<string | null>(null);
    const [responseNote, setResponseNote] = useState("");
    const [processing, setProcessing] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (!auth.companyId) return;
        (async () => {
            try {
                const reqs = await getCompanyCustomizationRequests(auth.companyId!);
                const enriched = await Promise.all(
                    reqs.map(async (req) => {
                        const [flat, user] = await Promise.all([
                            getFlat(req.flatId).catch(() => null),
                            getUserProfile(req.userId).catch(() => null),
                        ]);
                        return {
                            ...req,
                            flatTitle: flat?.title || req.flatId,
                            userName: user?.displayName || req.userId,
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
    }, [auth.companyId]);

    const handleStatusUpdate = async (requestId: string, status: RequestStatus) => {
        setProcessing(true);
        try {
            await updateCustomizationRequestStatus(requestId, status, responseNote || undefined);
            setRequests((prev) =>
                prev.map((r) => r.id === requestId ? { ...r, status, companyNotes: responseNote || r.companyNotes } : r)
            );
            setRespondingTo(null);
            setResponseNote("");
            addToast("success", t(`toast.request${status.charAt(0).toUpperCase() + status.slice(1)}`));
        } catch (e) {
            console.error("Failed to update request:", e);
            addToast("error", t("toast.requestFailed"));
        } finally {
            setProcessing(false);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        setBulkProcessing(true);
        try {
            await Promise.all(
                Array.from(selectedIds).map((id) =>
                    updateCustomizationRequestStatus(id, "approved", t("flatCustomization.responseTemplateApproved"))
                )
            );
            setRequests((prev) =>
                prev.map((r) =>
                    selectedIds.has(r.id)
                        ? { ...r, status: "approved" as RequestStatus, companyNotes: t("flatCustomization.responseTemplateApproved") }
                        : r
                )
            );
            setSelectedIds(new Set());
            addToast("success", t("toast.requestApproved"));
        } catch (e) {
            console.error("Failed to bulk approve:", e);
            addToast("error", t("toast.requestFailed"));
        } finally {
            setBulkProcessing(false);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
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

    const pendingRequests = useMemo(() => requests.filter((r) => r.status === "pending"), [requests]);

    const filterTabs: { key: FilterTab; label: string }[] = [
        { key: "all", label: t("flatCustomization.filterAll") },
        { key: "pending", label: t("flatCustomization.filterPending") },
        { key: "approved", label: t("flatCustomization.filterApproved") },
        { key: "rejected", label: t("flatCustomization.filterRejected") },
    ];

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6 max-w-4xl">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold">{t("customizations.requestsTitle")}</h1>
                            {selectedIds.size > 0 && (
                                <Button
                                    onClick={handleBulkApprove}
                                    disabled={bulkProcessing}
                                >
                                    <CheckCircle2 size={16} className="mr-1.5" />
                                    {t("flatCustomization.bulkApprove")} ({selectedIds.size})
                                </Button>
                            )}
                        </div>

                        <ContentLoader loading={loading} skeleton={<ReservationListSkeleton />}>
                            {requests.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-foreground/40">{t("customizations.noRequests")}</p>
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
                                                    <span className="text-sm font-medium text-foreground/70">
                                                        {group.flatTitle}
                                                        <span className="text-foreground/30 ml-2">({group.requests.length})</span>
                                                    </span>
                                                </div>

                                                {/* Requests for this flat */}
                                                <div className="space-y-3">
                                                    {group.requests.map((req) => (
                                                        <div key={req.id} className="p-4 bg-surface rounded-2xl border border-foreground/6">
                                                            <div className="flex items-start gap-3">
                                                                {/* Checkbox for pending requests */}
                                                                {req.status === "pending" && (
                                                                    <label className="mt-1 shrink-0">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedIds.has(req.id)}
                                                                            onChange={() => toggleSelect(req.id)}
                                                                            className="w-4 h-4 rounded border-foreground/20 text-primary accent-primary"
                                                                        />
                                                                    </label>
                                                                )}

                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Badge variant={req.status as any}>{t(`customizations.reqStatus.${req.status}`)}</Badge>
                                                                    </div>
                                                                    <p className="text-sm text-foreground/60">
                                                                        {t("customizations.requestedBy")}: <span className="text-foreground">{req.userName}</span>
                                                                    </p>
                                                                    <p className="text-sm text-foreground/60 mt-1">
                                                                        {t("customizations.selectedOption")}: <span className="font-medium text-foreground">{req.selectedOption}</span>
                                                                    </p>
                                                                    {req.notes && (
                                                                        <p className="text-sm text-foreground/50 mt-1 italic">"{req.notes}"</p>
                                                                    )}
                                                                    {req.companyNotes && (
                                                                        <p className="text-sm text-primary mt-1">{t("customizations.yourNote")}: {req.companyNotes}</p>
                                                                    )}
                                                                </div>

                                                                {req.status === "pending" && (
                                                                    <div className="shrink-0">
                                                                        {respondingTo === req.id ? (
                                                                            <div className="space-y-2 w-64">
                                                                                <Textarea
                                                                                    placeholder={t("customizations.notePlaceholder")}
                                                                                    value={responseNote}
                                                                                    onChange={(e) => setResponseNote(e.target.value)}
                                                                                />
                                                                                {/* Quick templates */}
                                                                                <div className="flex flex-wrap gap-1">
                                                                                    {RESPONSE_TEMPLATES.map((key) => (
                                                                                        <button
                                                                                            key={key}
                                                                                            type="button"
                                                                                            onClick={() => setResponseNote(t(`flatCustomization.${key}`))}
                                                                                            className="text-xs px-2 py-0.5 bg-foreground/5 rounded border border-foreground/6 text-foreground/50 hover:text-foreground/70 hover:border-foreground/20 transition-colors"
                                                                                        >
                                                                                            {t(`flatCustomization.${key}`).slice(0, 20)}...
                                                                                        </button>
                                                                                    ))}
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                    <Button size="sm" disabled={processing} onClick={() => handleStatusUpdate(req.id, "approved")}>
                                                                                        {t("customizations.approve")}
                                                                                    </Button>
                                                                                    <Button size="sm" variant="ghost" disabled={processing} onClick={() => handleStatusUpdate(req.id, "rejected")}>
                                                                                        {t("customizations.reject")}
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <Button size="sm" onClick={() => { setRespondingTo(req.id); setResponseNote(""); }}>
                                                                                {t("customizations.respond")}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                )}
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
            </PageTransition>
        </RoleGuard>
    );
}
