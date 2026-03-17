import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import {
    User, Phone, Mail, Calendar, Banknote, CheckCircle2, XCircle,
    Lock, Trophy, Home, Building2, ChevronDown, ChevronUp,
} from "lucide-react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { toMillis, type Reservation, type ReservationStatus } from "@gemmaham/shared";

interface KanbanBoardProps {
    reservations: Reservation[];
    propertyTitles: Record<string, string>;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onScheduleMeeting: (id: string) => void;
    onCompleteMeeting: (id: string) => void;
    onConfirmDeposit: (id: string) => void;
    onMarkReserved: (id: string) => void;
    onMarkCompleted: (id: string) => void;
    processing: boolean;
}

const COLUMNS: { status: ReservationStatus; key: string }[] = [
    { status: "requested", key: "requested" },
    { status: "approved", key: "approved" },
    { status: "reserved", key: "reserved" },
    { status: "completed", key: "completed" },
];

function getDaysInStatus(reservation: Reservation): number {
    const history = reservation.statusHistory;
    if (!history || history.length === 0) {
        return Math.floor((Date.now() - toMillis(reservation.createdAt)) / (1000 * 60 * 60 * 24));
    }
    const lastEntry = history[history.length - 1];
    const changedAt = toMillis(lastEntry.changedAt);
    if (!changedAt) {
        return Math.floor((Date.now() - toMillis(reservation.createdAt)) / (1000 * 60 * 60 * 24));
    }
    return Math.floor((Date.now() - changedAt) / (1000 * 60 * 60 * 24));
}

function getUrgencyBorder(reservation: Reservation): string {
    const days = getDaysInStatus(reservation);
    const expiresAtMs = toMillis(reservation.expiresAt);
    const expiringWithin2Days = expiresAtMs > 0 && (expiresAtMs - Date.now()) < 2 * 24 * 60 * 60 * 1000;

    if (days > 12 || expiringWithin2Days) return "border-l-4 border-l-red-500";
    if (days >= 7) return "border-l-4 border-l-yellow-500";
    return "border-l-4 border-l-green-500";
}

function getPropertyId(reservation: Reservation): string {
    return reservation.flatId || reservation.houseId || reservation.id;
}

export function KanbanBoard({
    reservations,
    propertyTitles,
    onApprove,
    onReject,
    onScheduleMeeting,
    onCompleteMeeting,
    onConfirmDeposit,
    onMarkReserved,
    onMarkCompleted,
    processing,
}: KanbanBoardProps) {
    const { t } = useTranslation();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const columnData = useMemo(() => {
        return COLUMNS.map((col) => ({
            ...col,
            reservations: reservations.filter((r) => r.status === col.status),
        }));
    }, [reservations]);

    return (
        <div className="overflow-x-auto -mx-6 px-6 pb-4">
            <div className="flex gap-4 min-w-[900px]">
                {columnData.map((column) => (
                    <div
                        key={column.status}
                        className="flex-1 min-w-[220px] bg-foreground/2 rounded-2xl p-3"
                    >
                        {/* Column header */}
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-foreground/70">
                                {t(`reservation.status.${column.status}`)}
                            </h3>
                            <Badge variant={column.status as any}>
                                {column.reservations.length}
                            </Badge>
                        </div>

                        {/* Cards */}
                        <div className="space-y-2.5">
                            {column.reservations.length === 0 ? (
                                <p className="text-xs text-foreground/30 text-center py-6">
                                    {t("reservation.noRequests")}
                                </p>
                            ) : (
                                column.reservations.map((r, index) => {
                                    const isExpanded = expandedId === r.id;
                                    const daysInStatus = getDaysInStatus(r);
                                    const urgencyBorder = getUrgencyBorder(r);
                                    const propId = getPropertyId(r);
                                    const propTitle = propertyTitles[propId] || propId;

                                    return (
                                        <motion.div
                                            key={r.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{
                                                duration: 0.2,
                                                delay: index * 0.05,
                                                ease: "easeOut",
                                            }}
                                            className={`bg-surface rounded-xl border border-foreground/6 shadow-card ${urgencyBorder} overflow-hidden`}
                                        >
                                            {/* Card summary — always visible */}
                                            <button
                                                type="button"
                                                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                                                className="w-full text-left p-3"
                                            >
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    {r.propertyType === "house" ? (
                                                        <Home size={12} className="text-foreground/40 shrink-0" />
                                                    ) : (
                                                        <Building2 size={12} className="text-foreground/40 shrink-0" />
                                                    )}
                                                    <span className="text-sm font-medium truncate">
                                                        {propTitle}
                                                    </span>
                                                </div>

                                                {r.userSnapshot && (
                                                    <div className="flex items-center gap-1.5 mb-1.5">
                                                        {r.userSnapshot.photoURL && (
                                                            <img
                                                                loading="lazy"
                                                                src={r.userSnapshot.photoURL}
                                                                alt=""
                                                                className="w-4 h-4 rounded-full"
                                                            />
                                                        )}
                                                        <span className="text-xs text-foreground/60 truncate">
                                                            {r.userSnapshot.displayName}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <span className="text-[11px] text-foreground/40">
                                                        {t("reservations.daysInStatus", { count: daysInStatus })}
                                                    </span>
                                                    {isExpanded ? (
                                                        <ChevronUp size={12} className="text-foreground/30" />
                                                    ) : (
                                                        <ChevronDown size={12} className="text-foreground/30" />
                                                    )}
                                                </div>

                                                {/* Expiring soon warning */}
                                                {r.expiresAt && toMillis(r.expiresAt) > 0 && (toMillis(r.expiresAt) - Date.now()) < 2 * 24 * 60 * 60 * 1000 && (toMillis(r.expiresAt) - Date.now()) > 0 && (
                                                    <span className="text-[10px] text-red-500 font-medium mt-1 block">
                                                        {t("reservations.expiringSoon")}
                                                    </span>
                                                )}
                                            </button>

                                            {/* Expanded details */}
                                            {isExpanded && (
                                                <div className="px-3 pb-3 border-t border-foreground/6">
                                                    {/* User info */}
                                                    {r.userSnapshot && (
                                                        <div className="bg-foreground/5 rounded-lg p-2 mt-2 mb-2">
                                                            <p className="text-[10px] font-medium text-foreground/40 mb-1">
                                                                {t("reservation.userInfo")}
                                                            </p>
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-1.5 text-xs">
                                                                    <User size={11} className="text-foreground/40" />
                                                                    <span>{r.userSnapshot.displayName}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5 text-[11px] text-foreground/60">
                                                                    <Mail size={10} className="text-foreground/40" />
                                                                    <span className="truncate">{r.userSnapshot.email}</span>
                                                                </div>
                                                                {r.userSnapshot.phone && (
                                                                    <div className="flex items-center gap-1.5 text-[11px] text-foreground/60">
                                                                        <Phone size={10} className="text-foreground/40" />
                                                                        <span>{r.userSnapshot.phone}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {r.notes && (
                                                        <p className="text-xs text-foreground/50 italic mb-2">"{r.notes}"</p>
                                                    )}

                                                    {/* Meeting & deposit status */}
                                                    <div className="flex flex-wrap gap-2 text-[11px] text-foreground/50 mb-2">
                                                        {r.meetingDate ? (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={10} />
                                                                {new Date(toMillis(r.meetingDate)).toLocaleDateString()}
                                                                {r.meetingCompleted && " \u2713"}
                                                            </span>
                                                        ) : r.status === "approved" ? (
                                                            <span className="text-foreground/30">{t("reservation.meetingNotScheduled")}</span>
                                                        ) : null}
                                                        {r.depositPaid && (
                                                            <span className="flex items-center gap-1 text-green-600">
                                                                <Banknote size={10} />
                                                                {t("reservation.depositPaid")} ({r.depositAmount?.toLocaleString()})
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Action buttons */}
                                                    <div className="flex flex-col gap-1.5">
                                                        {r.status === "requested" && (
                                                            <>
                                                                <Button size="sm" disabled={processing} onClick={() => onApprove(r.id)}>
                                                                    <CheckCircle2 size={12} className="mr-1" />
                                                                    {t("reservation.approve")}
                                                                </Button>
                                                                <Button size="sm" variant="ghost" disabled={processing} onClick={() => onReject(r.id)}>
                                                                    <XCircle size={12} className="mr-1" />
                                                                    {t("reservation.reject")}
                                                                </Button>
                                                            </>
                                                        )}

                                                        {r.status === "approved" && (
                                                            <>
                                                                {!r.meetingDate && (
                                                                    <Button size="sm" variant="ghost" onClick={() => onScheduleMeeting(r.id)}>
                                                                        <Calendar size={12} className="mr-1" />
                                                                        {t("reservation.scheduleMeeting")}
                                                                    </Button>
                                                                )}
                                                                {r.meetingDate && !r.meetingCompleted && (
                                                                    <Button size="sm" variant="ghost" disabled={processing} onClick={() => onCompleteMeeting(r.id)}>
                                                                        {t("reservation.completeMeeting")}
                                                                    </Button>
                                                                )}
                                                                {!r.depositPaid && (
                                                                    <Button size="sm" variant="ghost" onClick={() => onConfirmDeposit(r.id)}>
                                                                        <Banknote size={12} className="mr-1" />
                                                                        {t("reservation.confirmDeposit")}
                                                                    </Button>
                                                                )}
                                                                <Button size="sm" disabled={processing} onClick={() => onMarkReserved(r.id)}>
                                                                    <Lock size={12} className="mr-1" />
                                                                    {t("reservation.markReserved")}
                                                                </Button>
                                                            </>
                                                        )}

                                                        {r.status === "reserved" && (
                                                            <Button size="sm" disabled={processing} onClick={() => onMarkCompleted(r.id)}>
                                                                <Trophy size={12} className="mr-1" />
                                                                {t("reservation.markCompleted")}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
