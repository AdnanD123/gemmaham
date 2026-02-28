import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import type { StatusHistoryEntry } from "@gemmaham/shared";

interface ReservationTimelineProps {
    history: StatusHistoryEntry[];
}

function formatDate(dateStr: string | { seconds: number }): string {
    const date = typeof dateStr === "object" && "seconds" in dateStr
        ? new Date(dateStr.seconds * 1000)
        : new Date(dateStr as string);
    return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const statusIcon = (status: string) => {
    switch (status) {
        case "approved":
        case "reserved":
        case "completed":
            return <CheckCircle2 size={16} className="text-green-500" />;
        case "rejected":
        case "cancelled":
            return <XCircle size={16} className="text-red-500" />;
        case "expired":
            return <AlertCircle size={16} className="text-gray-400" />;
        default:
            return <Clock size={16} className="text-blue-500" />;
    }
};

const ReservationTimeline = ({ history }: ReservationTimelineProps) => {
    const { t } = useTranslation();

    if (!history || history.length === 0) return null;

    return (
        <div className="space-y-0">
            {history.map((entry, i) => (
                <div key={i} className="flex gap-3 relative">
                    {/* Vertical line */}
                    {i < history.length - 1 && (
                        <div className="absolute left-[7px] top-6 w-0.5 h-[calc(100%-8px)] bg-foreground/10" />
                    )}
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5 z-10 bg-surface">
                        {statusIcon(entry.to)}
                    </div>
                    {/* Content */}
                    <div className="pb-4 flex-1 min-w-0">
                        <p className="text-sm font-medium">
                            {t(`reservation.status.${entry.to}`)}
                        </p>
                        <p className="text-xs text-foreground/40">
                            {formatDate(entry.changedAt as string)}
                        </p>
                        {entry.reason && (
                            <p className="text-xs text-foreground/50 mt-0.5 italic">
                                {entry.reason}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReservationTimeline;
