import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, Banknote, Home, Building2 } from "lucide-react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import { toMillis, type Reservation } from "@gemmaham/shared";

interface Props {
    reservation: Reservation;
    flatTitle?: string;
    showActions?: boolean;
    onConfirm?: (id: string) => void;
    onCancel?: (id: string) => void;
    onExpand?: (id: string) => void;
}

const ReservationCard = memo(({ reservation, flatTitle, showActions, onConfirm, onCancel, onExpand }: Props) => {
    const { t } = useTranslation();
    const date = reservation.createdAt instanceof Date
        ? reservation.createdAt
        : new Date((reservation.createdAt as any)?.seconds * 1000 || Date.now());

    const canCancel = ["requested", "approved"].includes(reservation.status);

    return (
        <div
            className={`p-4 bg-surface rounded-2xl border border-foreground/6 shadow-card ${onExpand ? "cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200" : ""}`}
            onClick={() => onExpand?.(reservation.id)}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        {reservation.propertyType === "house" ? (
                            <Home size={14} className="text-foreground/40 shrink-0" />
                        ) : (
                            <Building2 size={14} className="text-foreground/40 shrink-0" />
                        )}
                        <h3 className="font-medium truncate">{flatTitle || t("reservationCard.flat")}</h3>
                        <Badge variant={reservation.status as any}>
                            {t(`reservation.status.${reservation.status}`)}
                        </Badge>
                    </div>
                    {reservation.notes && (
                        <p className="text-sm text-foreground/50 truncate">{reservation.notes}</p>
                    )}
                    <p className="text-xs text-foreground/40 mt-1">
                        {date.toLocaleDateString()}
                    </p>
                </div>

                <div className="flex gap-2 shrink-0">
                    {showActions && reservation.status === "requested" && (
                        <>
                            {onConfirm && (
                                <Button size="sm" onClick={(e) => { e.stopPropagation(); onConfirm(reservation.id); }}>
                                    {t("reservation.approve")}
                                </Button>
                            )}
                            {onCancel && (
                                <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onCancel(reservation.id); }}>
                                    {t("reservation.reject")}
                                </Button>
                            )}
                        </>
                    )}

                    {!showActions && canCancel && onCancel && (
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onCancel(reservation.id); }}>
                            {t("common.cancel")}
                        </Button>
                    )}
                </div>
            </div>

            {/* Meeting & deposit info */}
            {(reservation.meetingDate || reservation.depositPaid) && (
                <div className="flex gap-4 mt-2 text-xs text-foreground/50">
                    {reservation.meetingDate && (
                        <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {t("reservation.meetingDate")}:{" "}
                            {new Date(toMillis(reservation.meetingDate)).toLocaleDateString()}
                            {reservation.meetingCompleted && " \u2713"}
                        </span>
                    )}
                    {reservation.depositPaid && (
                        <span className="flex items-center gap-1">
                            <Banknote size={12} />
                            {t("reservation.depositPaid")} ({reservation.depositAmount?.toLocaleString()})
                        </span>
                    )}
                </div>
            )}

            {/* Rejection reason */}
            {reservation.status === "rejected" && reservation.rejectionReason && (
                <p className="text-xs text-accent mt-2">
                    {reservation.rejectionReason}
                </p>
            )}
        </div>
    );
});

export default ReservationCard;
