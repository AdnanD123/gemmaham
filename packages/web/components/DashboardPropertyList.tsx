import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Search } from "lucide-react";
import PrioritySection from "./PrioritySection";
import ReservationCard from "./ReservationCard";
import Button from "./ui/Button";
import type { Reservation } from "@gemmaham/shared";

interface Props {
    reservations: Reservation[];
    propertyTitles: Map<string, string>;
    onCancel?: (id: string) => void;
    onExpand?: (id: string) => void;
}

const DashboardPropertyList = ({ reservations, propertyTitles, onCancel, onExpand }: Props) => {
    const { t } = useTranslation();

    const inProgress = reservations.filter((r) =>
        ["approved", "reserved"].includes(r.status)
    );
    const planned = reservations.filter((r) => r.status === "requested");
    const completed = reservations.filter((r) =>
        ["completed", "rejected", "cancelled", "expired"].includes(r.status)
    );

    const getTitle = (r: Reservation) => {
        const id = r.flatId || r.houseId || "";
        return propertyTitles.get(id) || t("reservationCard.flat");
    };

    if (reservations.length === 0) {
        return (
            <div className="text-center py-12">
                <Search size={48} className="mx-auto text-foreground/20 mb-4" />
                <p className="text-foreground/50 mb-4">{t("dashboard.noProperties")}</p>
                <Link to="/properties">
                    <Button>{t("dashboard.browseProperties")}</Button>
                </Link>
            </div>
        );
    }

    return (
        <div>
            <PrioritySection priority="in_progress" count={inProgress.length}>
                {inProgress.map((r) => (
                    <ReservationCard
                        key={r.id}
                        reservation={r}
                        flatTitle={getTitle(r)}
                        onCancel={onCancel}
                        onExpand={onExpand}
                    />
                ))}
            </PrioritySection>

            <PrioritySection priority="planned" count={planned.length}>
                {planned.map((r) => (
                    <ReservationCard
                        key={r.id}
                        reservation={r}
                        flatTitle={getTitle(r)}
                        onCancel={onCancel}
                        onExpand={onExpand}
                    />
                ))}
            </PrioritySection>

            <PrioritySection priority="completed" count={completed.length}>
                {completed.map((r) => (
                    <ReservationCard
                        key={r.id}
                        reservation={r}
                        flatTitle={getTitle(r)}
                        onExpand={onExpand}
                    />
                ))}
            </PrioritySection>
        </div>
    );
};

export default DashboardPropertyList;
