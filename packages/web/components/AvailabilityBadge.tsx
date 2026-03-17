import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import type { ContractorAvailability } from "@gemmaham/shared";

interface Props {
    availability?: ContractorAvailability;
    availableFrom?: string;
}

const dotStyles: Record<string, string> = {
    available: "bg-green-500 animate-pulse",
    busy: "bg-yellow-500",
    unavailable: "bg-red-500",
};

export default function AvailabilityBadge({ availability, availableFrom }: Props) {
    const { t } = useTranslation();

    const dotClass = availability ? dotStyles[availability] : "bg-foreground/30";

    const label = (() => {
        if (!availability) return t("contractor.notSpecified");
        if (availability === "available") return t("contractor.available");
        if (availability === "unavailable") return t("contractor.unavailable");
        // busy
        if (availableFrom) {
            try {
                const date = format(new Date(availableFrom), "MMM d, yyyy");
                return t("contractor.busyUntil", { date });
            } catch {
                return t("contractor.busy");
            }
        }
        return t("contractor.busy");
    })();

    return (
        <span className="inline-flex items-center gap-1.5 text-sm text-foreground/70">
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
            {label}
        </span>
    );
}
