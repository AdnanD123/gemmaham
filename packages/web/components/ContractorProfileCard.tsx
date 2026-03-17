import { memo } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Wrench } from "lucide-react";
import Badge from "./ui/Badge";
import type { ContractorProfile } from "@gemmaham/shared";

interface Props {
    contractor: ContractorProfile;
}

const ContractorProfileCard = memo(function ContractorProfileCard({ contractor }: Props) {
    const { t } = useTranslation();

    return (
        <Link
            to={`/contractors/${contractor.id}`}
            className="block bg-surface rounded-2xl border border-foreground/6 overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
        >
            <div className="p-5">
                <div className="flex items-start gap-3">
                    {contractor.logoUrl ? (
                        <img src={contractor.logoUrl} alt={contractor.displayName} className="w-14 h-14 rounded-lg object-cover shrink-0" loading="lazy" />
                    ) : (
                        <div className="w-14 h-14 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
                            <Wrench size={22} className="text-primary" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate">{contractor.displayName}</h3>
                        <p className="text-sm text-foreground/50 truncate">{contractor.companyName}</p>
                    </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                    {contractor.categories && contractor.categories.length > 0 ? (
                        <>
                            {contractor.categories.slice(0, 3).map((cat) => (
                                <Badge key={cat.category} variant="default">
                                    {t(`contractorCategories.categories.${cat.category}`)}
                                </Badge>
                            ))}
                            {contractor.categories.length > 3 && (
                                <Badge variant="default">+{contractor.categories.length - 3}</Badge>
                            )}
                        </>
                    ) : (
                        <Badge variant={contractor.specialty}>
                            {t(`contractor.specialties.${contractor.specialty}`)}
                        </Badge>
                    )}
                </div>

                {contractor.description && (
                    <p className="text-sm text-foreground/60 mt-3 line-clamp-2">{contractor.description}</p>
                )}

                {contractor.yearsExperience != null && contractor.yearsExperience > 0 && (
                    <p className="text-xs text-foreground/40 mt-2">
                        {contractor.yearsExperience} {t("contractor.yearsExp")}
                    </p>
                )}
            </div>
        </Link>
    );
});

export default ContractorProfileCard;
