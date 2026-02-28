import { memo } from "react";
import { useTranslation } from "react-i18next";
import { MapPin, Calendar } from "lucide-react";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import type { Building } from "@gemmaham/shared";

interface Props {
    building: Building;
    companyName: string;
    alreadyApplied: boolean;
    onApply: (building: Building) => void;
}

const ProjectCard = memo(function ProjectCard({ building, companyName, alreadyApplied, onApply }: Props) {
    const { t } = useTranslation();

    return (
        <div className="bg-surface rounded-xl border-2 border-foreground/10 overflow-hidden">
            {building.coverImageUrl ? (
                <img src={building.coverImageUrl} alt={building.title} className="w-full h-40 object-cover" />
            ) : (
                <div className="w-full h-40 bg-foreground/5 flex items-center justify-center">
                    <span className="text-4xl">🏗</span>
                </div>
            )}
            <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold truncate">{building.title}</h3>
                    <Badge variant={building.status}>{t(`buildings.status.${building.status}`)}</Badge>
                </div>
                <p className="text-sm text-foreground/50 truncate">{companyName}</p>

                <div className="flex flex-col gap-1 mt-3 text-xs text-foreground/40">
                    <span className="flex items-center gap-1">
                        <MapPin size={12} /> {building.address}
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar size={12} /> {t("buildings.est")}: {building.estimatedCompletion}
                    </span>
                </div>

                <div className="flex items-center gap-3 mt-3 text-xs text-foreground/40">
                    <span>{building.floors} {t("buildings.floorsLabel")}</span>
                    <span>·</span>
                    <span>{building.totalUnits} {t("buildings.tabUnits")}</span>
                    <span>·</span>
                    <span>{t(`buildings.phase.${building.currentPhase}`)}</span>
                </div>

                <div className="mt-4">
                    {alreadyApplied ? (
                        <Button size="sm" variant="outline" disabled className="w-full">
                            {t("applications.alreadyApplied")}
                        </Button>
                    ) : (
                        <Button size="sm" className="w-full" onClick={() => onApply(building)}>
                            {t("applications.applyNow")}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
});

export default ProjectCard;
