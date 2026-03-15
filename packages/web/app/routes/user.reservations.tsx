import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import AuthGuard from "../../components/AuthGuard";
import ReservationCard from "../../components/ReservationCard";
import ReservationTimeline from "../../components/ReservationTimeline";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ReservationListSkeleton from "../../components/skeletons/ReservationSkeleton";
import { getUserReservations, updateReservationStatus, getFlat, getHouse } from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import { toMillis, type AuthContext, type Reservation } from "@gemmaham/shared";

type TabKey = "requests" | "active" | "history";

export default function UserReservations() {
    const auth = useOutletContext<AuthContext>();
    const { t } = useTranslation();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [propertyTitles, setPropertyTitles] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [cancelTarget, setCancelTarget] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>("requests");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { addToast } = useToast();

    useEffect(() => {
        if (!auth.user) return;
        (async () => {
            try {
                const { items } = await getUserReservations(auth.user!.uid);
                setReservations(items);

                const titles: Record<string, string> = {};
                await Promise.all(
                    items.map(async (r) => {
                        try {
                            if (r.propertyType === "house" && r.houseId) {
                                const house = await getHouse(r.houseId);
                                if (house) titles[r.houseId] = house.title;
                            } else if (r.flatId) {
                                const flat = await getFlat(r.flatId);
                                if (flat) titles[r.flatId] = flat.title;
                            }
                        } catch {}
                    }),
                );
                setPropertyTitles(titles);
            } catch (e) {
                console.error("Failed to load reservations:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.user]);

    const handleCancel = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        try {
            await updateReservationStatus(cancelTarget, "cancelled", "Cancelled by user");
            setReservations((prev) =>
                prev.map((r) => r.id === cancelTarget ? { ...r, status: "cancelled" as const } : r)
            );
            addToast("success", t("toast.reservationCancelled"));
        } catch (e) {
            console.error("Failed to cancel:", e);
            addToast("error", t("toast.cancelFailed"));
        } finally {
            setCancelling(false);
            setCancelTarget(null);
        }
    };

    // Categorize reservations
    const requests = useMemo(
        () => reservations.filter((r) => r.status === "requested"),
        [reservations],
    );
    const active = useMemo(
        () => reservations.filter((r) => ["approved", "reserved"].includes(r.status)),
        [reservations],
    );
    const history = useMemo(
        () => reservations.filter((r) => ["completed", "rejected", "cancelled", "expired"].includes(r.status)),
        [reservations],
    );

    const tabs: { key: TabKey; label: string; count: number }[] = [
        { key: "requests", label: t("reservation.requestsTab"), count: requests.length },
        { key: "active", label: t("reservation.activeTab"), count: active.length },
        { key: "history", label: t("reservation.historyTab"), count: history.length },
    ];

    const currentList = activeTab === "requests" ? requests : activeTab === "active" ? active : history;

    return (
        <AuthGuard>
            <div className="home">
                <Navbar />
                <div className="flex">
                    <main className="flex-1 p-6 max-w-4xl">
                        <h1 className="text-2xl font-bold mb-6">{t("user.myReservations")}</h1>

                        {loading ? (
                            <ReservationListSkeleton />
                        ) : reservations.length === 0 ? (
                            <p className="text-center py-12 text-foreground/40">{t("user.noReservations")}</p>
                        ) : (
                            <>
                                {/* Tabs */}
                                <div className="flex gap-1 mb-6 bg-foreground/5 rounded-lg p-1 w-fit">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => { setActiveTab(tab.key); setExpandedId(null); }}
                                            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                                                activeTab === tab.key
                                                    ? "bg-surface shadow-sm font-medium text-foreground"
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
                                    <p className="text-center py-8 text-foreground/40">{t("reservation.noRequests")}</p>
                                ) : (
                                    <div className="space-y-3">
                                        {currentList.map((r) => (
                                            <div key={r.id}>
                                                <ReservationCard
                                                    reservation={r}
                                                    flatTitle={propertyTitles[r.propertyType === "house" ? (r.houseId || "") : (r.flatId || "")]}
                                                    onCancel={setCancelTarget}
                                                    onExpand={(id) => setExpandedId(expandedId === id ? null : id)}
                                                />
                                                {/* Expanded detail */}
                                                {expandedId === r.id && (
                                                    <div className="ml-4 mt-2 p-4 bg-foreground/5 rounded-xl border border-foreground/10 space-y-4">
                                                        {/* Timeline */}
                                                        {r.statusHistory && r.statusHistory.length > 0 && (
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-2">{t("reservation.timeline")}</h4>
                                                                <ReservationTimeline history={r.statusHistory} />
                                                            </div>
                                                        )}

                                                        {/* Meeting info */}
                                                        {r.meetingDate && (
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">{t("reservation.meetingDate")}</h4>
                                                                <p className="text-sm text-foreground/60">
                                                                    {new Date(toMillis(r.meetingDate)).toLocaleString()}
                                                                    {r.meetingCompleted && ` — ${t("reservation.meetingCompleted")}`}
                                                                </p>
                                                                {r.meetingNotes && (
                                                                    <p className="text-xs text-foreground/50 mt-1">{r.meetingNotes}</p>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Deposit info */}
                                                        {r.depositPaid && (
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">{t("reservation.depositAmount")}</h4>
                                                                <p className="text-sm text-foreground/60">
                                                                    {r.depositAmount?.toLocaleString()} — {t("reservation.depositPaid")}
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Company notes */}
                                                        {r.companyNotes && (
                                                            <div>
                                                                <h4 className="text-sm font-medium mb-1">{t("customizations.agencyNote")}</h4>
                                                                <p className="text-sm text-foreground/50">{r.companyNotes}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
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
                title={t("user.cancelReservationTitle")}
                message={t("user.cancelReservationMsg")}
                confirmLabel={t("user.cancelReservation")}
                loading={cancelling}
            />
        </AuthGuard>
    );
}
