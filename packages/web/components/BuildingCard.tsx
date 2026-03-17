import { memo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import Badge from "./ui/Badge";
import type { Building } from "@gemmaham/shared";

interface Props {
    building: Building;
    overdueMilestones?: number;
}

const BuildingCard = memo(function BuildingCard({ building, overdueMilestones }: Props) {
    const { t } = useTranslation();

    return (
        <Link
            to={`/buildings/${building.id}`}
            className="block bg-surface rounded-2xl border border-foreground/6 overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
        >
            {building.coverImageUrl ? (
                <img src={building.coverImageUrl} alt={building.title} className="w-full h-48 object-cover" loading="lazy" />
            ) : (
                <div className="w-full h-48 bg-foreground/5 flex items-center justify-center">
                    <span className="text-4xl">🏗</span>
                </div>
            )}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">{building.title}</h3>
                    <Badge variant={building.status}>{t(`buildings.status.${building.status}`)}</Badge>
                </div>
                <p className="text-sm text-foreground/50 truncate">{building.address}</p>

                {/* Progress bar */}
                <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-foreground/50 mb-1">
                        <span>{t(`buildings.phase.${building.currentPhase}`)}</span>
                        <span>{building.availableUnits}/{building.totalUnits} {t("buildings.unitsAvailable")}</span>
                    </div>
                    <div className="w-full h-1 bg-foreground/6 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full"
                            style={{
                                width: building.status === "completed" ? "100%"
                                    : building.status === "near_completion" ? "85%"
                                    : building.status === "under_construction" ? "50%"
                                    : "10%",
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-3 text-xs text-foreground/40">
                    <span>{building.floors} {t("buildings.floorsLabel")}</span>
                    <span>·</span>
                    <span>{t("buildings.est")}: {building.estimatedCompletion}</span>
                    {overdueMilestones != null && overdueMilestones > 0 && (
                        <>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1 text-accent font-medium">
                                <AlertTriangle size={12} />
                                {overdueMilestones} {t("milestones.overdue")}
                            </span>
                        </>
                    )}
                </div>
            </div>
        </Link>
    );
});

export default BuildingCard;
