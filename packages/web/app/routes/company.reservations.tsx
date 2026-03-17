import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { User, Phone, Mail, Calendar, Banknote, CheckCircle2, XCircle, Lock, Trophy, List, LayoutGrid, Home, CreditCard, Users, Zap } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Modal from "../../components/ui/Modal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ReservationTimeline from "../../components/ReservationTimeline";
import ReservationListSkeleton from "../../components/skeletons/ReservationSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { KanbanBoard } from "../../components/KanbanBoard";
import {
    getCompanyReservations, updateReservationStatus, getFlat,
    updateReservationMeeting, completeReservationMeeting, confirmDeposit,
} from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, Reservation, ReservationStatus } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

type TabKey = "requests" | "active" | "history";
type ViewMode = "list" | "board";

const VIEW_PREF_KEY = "gemmaham_reservations_view";

interface FlatGroup {
    flatId: string;
    flatTitle: string;
    reservations: Reservation[];
}

export default function CompanyReservations() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [flatTitles, setFlatTitles] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>("requests");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        if (typeof window !== "undefined") {
            return (localStorage.getItem(VIEW_PREF_KEY) as ViewMode) || "list";
        }
        return "list";
    });

    const toggleViewMode = (mode: ViewMode) => {
        setViewMode(mode);
        if (typeof window !== "undefined") {
            localStorage.setItem(VIEW_PREF_KEY, mode);
        }
    };

    // Reject modal
    const [rejectTarget, setRejectTarget] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState("");

    // Meeting modal
    const [meetingTarget, setMeetingTarget] = useState<string | null>(null);
    const [meetingDate, setMeetingDate] = useState("");
    const [meetingNotes, setMeetingNotes] = useState("");

    // Deposit modal
    const [depositTarget, setDepositTarget] = useState<string | null>(null);
    const [depositAmount, setDepositAmount] = useState("");

    const [processing, setProcessing] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (!auth.companyId) return;
        (async () => {
            try {
                const { items } = await getCompanyReservations(auth.companyId!);
                setReservations(items);

                const titles: Record<string, string> = {};
                const uniqueFlatIds = [...new Set(items.map((r) => r.flatId))];
                await Promise.all(
                    uniqueFlatIds.map(async (flatId) => {
                        const flat = await getFlat(flatId);
                        if (flat) titles[flatId] = flat.title;
                    }),
                );
                setFlatTitles(titles);
            } catch (e) {
                console.error("Failed to load reservations:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.companyId]);

    // Categorize
    const requests = useMemo(() => reservations.filter((r) => r.status === "requested"), [reservations]);
    const active = useMemo(() => reservations.filter((r) => ["approved", "reserved"].includes(r.status)), [reservations]);
    const history = useMemo(() => reservations.filter((r) => ["completed", "rejected", "cancelled", "expired"].includes(r.status)), [reservations]);

    const tabs: { key: TabKey; label: string; count: number }[] = [
        { key: "requests", label: t("reservation.requestsTab"), count: requests.length },
        { key: "active", label: t("reservation.activeTab"), count: active.length },
        { key: "history", label: t("reservation.historyTab"), count: history.length },
    ];

    const currentList = activeTab === "requests" ? requests : activeTab === "active" ? active : history;

    // Group by flat
    const grouped = useMemo(() => {
        const groups: Record<string, FlatGroup> = {};
        currentList.forEach((r) => {
            if (!groups[r.flatId]) {
                groups[r.flatId] = { flatId: r.flatId, flatTitle: flatTitles[r.flatId] || r.flatId, reservations: [] };
            }
            groups[r.flatId].reservations.push(r);
        });
        return Object.values(groups);
    }, [currentList, flatTitles]);

    const handleStatusUpdate = async (id: string, status: ReservationStatus, reason?: string) => {
        setProcessing(true);
        try {
            await updateReservationStatus(id, status, reason);
            setReservations((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
            const toastKey = `toast.reservation${status.charAt(0).toUpperCase() + status.slice(1)}`;
            addToast("success", t(toastKey));
        } catch (e) {
            console.error("Failed to update:", e);
            addToast("error", t("toast.statusUpdateFailed"));
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        await handleStatusUpdate(rejectTarget, "rejected", rejectReason || undefined);
        setRejectTarget(null);
        setRejectReason("");
    };

    const handleScheduleMeeting = async () => {
        if (!meetingTarget || !meetingDate) return;
        setProcessing(true);
        try {
            await updateReservationMeeting(meetingTarget, meetingDate, meetingNotes || undefined);
            setReservations((prev) => prev.map((r) => r.id === meetingTarget ? { ...r, meetingDate, meetingNotes } : r));
            addToast("success", t("toast.meetingScheduled"));
            setMeetingTarget(null);
            setMeetingDate("");
            setMeetingNotes("");
        } catch (e) {
            console.error("Failed to schedule meeting:", e);
            addToast("error", t("toast.statusUpdateFailed"));
        } finally {
            setProcessing(false);
        }
    };

    const handleCompleteMeeting = async (id: string) => {
        setProcessing(true);
        try {
            await completeReservationMeeting(id);
            setReservations((prev) => prev.map((r) => r.id === id ? { ...r, meetingCompleted: true } : r));
            addToast("success", t("toast.meetingCompleted"));
        } catch (e) {
            addToast("error", t("toast.statusUpdateFailed"));
        } finally {
            setProcessing(false);
        }
    };

    const handleConfirmDeposit = async () => {
        if (!depositTarget || !depositAmount) return;
        setProcessing(true);
        try {
            await confirmDeposit(depositTarget, parseFloat(depositAmount));
            setReservations((prev) => prev.map((r) =>
                r.id === depositTarget ? { ...r, depositPaid: true, depositAmount: parseFloat(depositAmount) } : r
            ));
            addToast("success", t("toast.depositConfirmed"));
            setDepositTarget(null);
            setDepositAmount("");
        } catch (e) {
            addToast("error", t("toast.statusUpdateFailed"));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6 max-w-5xl">
                        <div className="flex items-center justify-between mb-8">
                            <h1 className="text-2xl font-serif font-bold">{t("company.reservationsTitle")}</h1>
                            <div className="flex gap-1 bg-foreground/5 rounded-lg p-1">
                                <button
                                    type="button"
                                    onClick={() => toggleViewMode("list")}
                                    className={`p-1.5 rounded-md transition-colors ${
                                        viewMode === "list"
                                            ? "bg-primary text-white"
                                            : "text-foreground/50 hover:text-foreground/70"
                                    }`}
                                    title={t("reservations.listView")}
                                >
                                    <List size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => toggleViewMode("board")}
                                    className={`p-1.5 rounded-md transition-colors ${
                                        viewMode === "board"
                                            ? "bg-primary text-white"
                                            : "text-foreground/50 hover:text-foreground/70"
                                    }`}
                                    title={t("reservations.boardView")}
                                >
                                    <LayoutGrid size={16} />
                                </button>
                            </div>
                        </div>

                        <ContentLoader loading={loading} skeleton={<ReservationListSkeleton />}>
                            {reservations.length === 0 ? (
                                <p className="text-center py-12 text-foreground/50">{t("company.noReservations")}</p>
                            ) : viewMode === "board" ? (
                                <KanbanBoard
                                    reservations={reservations}
                                    propertyTitles={flatTitles}
                                    onApprove={(id) => handleStatusUpdate(id, "approved")}
                                    onReject={(id) => { setRejectTarget(id); setRejectReason(""); }}
                                    onScheduleMeeting={(id) => { setMeetingTarget(id); setMeetingDate(""); setMeetingNotes(""); }}
                                    onCompleteMeeting={handleCompleteMeeting}
                                    onConfirmDeposit={(id) => { setDepositTarget(id); setDepositAmount(""); }}
                                    onMarkReserved={(id) => handleStatusUpdate(id, "reserved")}
                                    onMarkCompleted={(id) => handleStatusUpdate(id, "completed")}
                                    processing={processing}
                                />
                            ) : (
                            <>
                                {/* Tabs */}
                                <div className="flex gap-1 mb-8 bg-foreground/5 rounded-lg p-1 w-fit">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
                                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                                activeTab === tab.key
                                                    ? "bg-primary text-white font-medium"
                                                    : "text-foreground/50 hover:text-foreground/70"
                                            }`}
                                        >
                                            {tab.label}
                                            {tab.count > 0 && (
                                                <span className="ml-1.5 text-xs text-foreground/40">({tab.count})</span>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                {currentList.length === 0 ? (
                                    <p className="text-center py-8 text-foreground/50">{t("reservation.noRequests")}</p>
                                ) : (
                                    <div className="space-y-6">
                                        {grouped.map((group) => (
                                            <div key={group.flatId}>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-sm font-medium text-foreground/70">
                                                        {group.flatTitle}
                                                    </span>
                                                    <span className="text-xs text-foreground/30">({group.reservations.length})</span>
                                                </div>

                                                <div className="space-y-3">
                                                    {group.reservations.map((r) => (
                                                        <div key={r.id} className="p-4 bg-surface rounded-2xl border border-foreground/6">
                                                            <div className="flex items-start gap-4">
                                                                {/* User snapshot */}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <Badge variant={r.status as any}>
                                                                            {t(`reservation.status.${r.status}`)}
                                                                        </Badge>
                                                                    </div>

                                                                    {/* User info from snapshot */}
                                                                    {r.userSnapshot && (
                                                                        <div className="bg-foreground/5 rounded-lg p-3 mb-3">
                                                                            <p className="text-xs font-medium text-foreground/40 mb-1.5">{t("reservation.userInfo")}</p>
                                                                            <div className="space-y-1">
                                                                                <div className="flex items-center gap-2 text-sm">
                                                                                    {r.userSnapshot.photoURL && (
                                                                                        <img loading="lazy" src={r.userSnapshot.photoURL} alt="" className="w-6 h-6 rounded-full" />
                                                                                    )}
                                                                                    <User size={14} className="text-foreground/40" />
                                                                                    <span>{r.userSnapshot.displayName}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2 text-xs text-foreground/60">
                                                                                    <Mail size={12} className="text-foreground/40" />
                                                                                    <span>{r.userSnapshot.email}</span>
                                                                                </div>
                                                                                {r.userSnapshot.phone && (
                                                                                    <div className="flex items-center gap-2 text-xs text-foreground/60">
                                                                                        <Phone size={12} className="text-foreground/40" />
                                                                                        <span>{r.userSnapshot.phone}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {r.notes && (
                                                                        <p className="text-sm text-foreground/50 italic mb-2">"{r.notes}"</p>
                                                                    )}

                                                                    {/* Additional booking info */}
                                                                    {(r.preferredMoveIn || r.financingMethod || r.occupants || r.urgency) && (
                                                                        <div className="bg-foreground/5 rounded-lg p-3 mb-3">
                                                                            <p className="text-xs font-medium text-foreground/40 mb-1.5">{t("reservation.additionalInfo")}</p>
                                                                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                                                                {r.preferredMoveIn && (
                                                                                    <span className="flex items-center gap-1 text-xs text-foreground/60">
                                                                                        <Home size={12} className="text-foreground/40" />
                                                                                        {t("reservation.preferredMoveIn")}: {new Date(r.preferredMoveIn).toLocaleDateString()}
                                                                                    </span>
                                                                                )}
                                                                                {r.financingMethod && (
                                                                                    <span className="flex items-center gap-1 text-xs text-foreground/60">
                                                                                        <CreditCard size={12} className="text-foreground/40" />
                                                                                        {t(`reservation.${r.financingMethod}`)}
                                                                                    </span>
                                                                                )}
                                                                                {r.occupants && (
                                                                                    <span className="flex items-center gap-1 text-xs text-foreground/60">
                                                                                        <Users size={12} className="text-foreground/40" />
                                                                                        {r.occupants} {t("reservation.occupants").toLowerCase()}
                                                                                    </span>
                                                                                )}
                                                                                {r.urgency && (
                                                                                    <Badge variant={r.urgency === "urgent" ? "rejected" : r.urgency === "3months" ? "approved" : "default"} className="text-xs">
                                                                                        <Zap size={10} className="mr-0.5" />
                                                                                        {t(`reservation.${r.urgency === "3months" ? "within3Months" : r.urgency}`)}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            {r.specialRequirements && (
                                                                                <p className="text-xs text-foreground/50 mt-1.5 italic">"{r.specialRequirements}"</p>
                                                                            )}
                                                                        </div>
                                                                    )}

                                                                    {/* Meeting & deposit status */}
                                                                    <div className="flex flex-wrap gap-3 text-xs text-foreground/50">
                                                                        {r.meetingDate ? (
                                                                            <span className="flex items-center gap-1">
                                                                                <Calendar size={12} />
                                                                                {new Date(r.meetingDate as string).toLocaleDateString()}
                                                                                {r.meetingCompleted && " \u2713"}
                                                                            </span>
                                                                        ) : r.status === "approved" && (
                                                                            <span className="text-foreground/30">{t("reservation.meetingNotScheduled")}</span>
                                                                        )}
                                                                        {r.depositPaid && (
                                                                            <span className="flex items-center gap-1 text-green-600">
                                                                                <Banknote size={12} />
                                                                                {t("reservation.depositPaid")} ({r.depositAmount?.toLocaleString()})
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Action buttons */}
                                                                <div className="shrink-0 flex flex-col gap-1.5">
                                                                    {r.status === "requested" && (
                                                                        <>
                                                                            <Button size="sm" disabled={processing} onClick={() => handleStatusUpdate(r.id, "approved")}>
                                                                                <CheckCircle2 size={14} className="mr-1" />
                                                                                {t("reservation.approve")}
                                                                            </Button>
                                                                            <Button size="sm" variant="ghost" disabled={processing} onClick={() => { setRejectTarget(r.id); setRejectReason(""); }}>
                                                                                <XCircle size={14} className="mr-1" />
                                                                                {t("reservation.reject")}
                                                                            </Button>
                                                                        </>
                                                                    )}

                                                                    {r.status === "approved" && (
                                                                        <>
                                                                            {!r.meetingDate && (
                                                                                <Button size="sm" variant="ghost" onClick={() => { setMeetingTarget(r.id); setMeetingDate(""); setMeetingNotes(""); }}>
                                                                                    <Calendar size={14} className="mr-1" />
                                                                                    {t("reservation.scheduleMeeting")}
                                                                                </Button>
                                                                            )}
                                                                            {r.meetingDate && !r.meetingCompleted && (
                                                                                <Button size="sm" variant="ghost" disabled={processing} onClick={() => handleCompleteMeeting(r.id)}>
                                                                                    {t("reservation.completeMeeting")}
                                                                                </Button>
                                                                            )}
                                                                            {!r.depositPaid && (
                                                                                <Button size="sm" variant="ghost" onClick={() => { setDepositTarget(r.id); setDepositAmount(""); }}>
                                                                                    <Banknote size={14} className="mr-1" />
                                                                                    {t("reservation.confirmDeposit")}
                                                                                </Button>
                                                                            )}
                                                                            <Button size="sm" disabled={processing} onClick={() => handleStatusUpdate(r.id, "reserved")}>
                                                                                <Lock size={14} className="mr-1" />
                                                                                {t("reservation.markReserved")}
                                                                            </Button>
                                                                        </>
                                                                    )}

                                                                    {r.status === "reserved" && (
                                                                        <Button size="sm" disabled={processing} onClick={() => handleStatusUpdate(r.id, "completed")}>
                                                                            <Trophy size={14} className="mr-1" />
                                                                            {t("reservation.markCompleted")}
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Expandable timeline */}
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                                                                className="text-xs text-primary hover:underline mt-2"
                                                            >
                                                                {t("reservation.timeline")}
                                                            </button>

                                                            {expandedId === r.id && r.statusHistory && (
                                                                <div className="mt-3 pt-3 border-t border-foreground/6">
                                                                    <ReservationTimeline history={r.statusHistory} />
                                                                </div>
                                                            )}
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

            {/* Reject Modal */}
            <Modal isOpen={!!rejectTarget} onClose={() => setRejectTarget(null)} title={t("reservation.reject")}>
                <div className="space-y-4">
                    <Textarea
                        label={t("reservation.rejectionReason")}
                        placeholder={t("reservation.rejectionPlaceholder")}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setRejectTarget(null)}>{t("common.cancel")}</Button>
                        <Button onClick={handleReject} disabled={processing}>
                            {t("reservation.reject")}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Meeting Modal */}
            <Modal isOpen={!!meetingTarget} onClose={() => setMeetingTarget(null)} title={t("reservation.scheduleMeeting")}>
                <div className="space-y-4">
                    <Input
                        label={t("reservation.meetingDate")}
                        type="datetime-local"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                    />
                    <Textarea
                        label={t("reservation.meetingNotes")}
                        placeholder=""
                        value={meetingNotes}
                        onChange={(e) => setMeetingNotes(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setMeetingTarget(null)}>{t("common.cancel")}</Button>
                        <Button onClick={handleScheduleMeeting} disabled={processing || !meetingDate}>
                            {t("reservation.scheduleMeeting")}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Deposit Modal */}
            <Modal isOpen={!!depositTarget} onClose={() => setDepositTarget(null)} title={t("reservation.confirmDeposit")}>
                <div className="space-y-4">
                    <Input
                        label={t("reservation.depositAmountLabel")}
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                    />
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setDepositTarget(null)}>{t("common.cancel")}</Button>
                        <Button onClick={handleConfirmDeposit} disabled={processing || !depositAmount}>
                            {t("reservation.confirmDeposit")}
                        </Button>
                    </div>
                </div>
            </Modal>
            </PageTransition>
        </RoleGuard>
    );
}
