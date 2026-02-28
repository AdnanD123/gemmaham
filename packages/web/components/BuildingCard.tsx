import { memo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import Badge from "./ui/Badge";
import type { Building } from "@gemmaham/shared";

interface Props {
    building: Building;
}

const BuildingCard = memo(function BuildingCard({ building }: Props) {
    const { t } = useTranslation();

    return (
        <Link
            to={`/buildings/${building.id}`}
            className="block bg-surface rounded-xl border-2 border-foreground/10 overflow-hidden hover:border-primary/30 transition-colors"
        >
            {building.coverImageUrl ? (
                <img src={building.coverImageUrl} alt={building.title} className="w-full h-48 object-cover" />
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
                    <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
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
                </div>
            </div>
        </Link>
    );
});

export default BuildingCard;
