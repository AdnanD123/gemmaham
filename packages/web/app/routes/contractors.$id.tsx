import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Phone, Mail, Globe, Wrench } from "lucide-react";
import Badge from "../../components/ui/Badge";
import { PageTransition } from "../../components/ui/PageTransition";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { getContractorProfile, getContractorAssignments } from "../../lib/firestore";
import type { ContractorProfile, Contractor } from "@gemmaham/shared";

export default function PublicContractorProfile() {
    const { id } = useParams();
    const { t } = useTranslation();
    const [profile, setProfile] = useState<ContractorProfile | null>(null);
    const [assignments, setAssignments] = useState<(Contractor & { buildingName: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const [p, a] = await Promise.all([
                    getContractorProfile(id),
                    getContractorAssignments(id),
                ]);
                setProfile(p);
                setAssignments(a);
            } catch (e) {
                console.error("Failed to load contractor profile:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    return (
        <div className="home">
            <PageTransition className="max-w-3xl mx-auto p-6">
                <Link to="/buildings" className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground mb-6">
                    <ArrowLeft size={16} /> {t("common.back")}
                </Link>

                <ContentLoader loading={loading} skeleton={
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <SkeletonBlock className="w-20 h-20 rounded-lg" />
                            <div>
                                <SkeletonLine className="h-6 w-48 mb-2" />
                                <SkeletonLine className="h-4 w-32" />
                            </div>
                        </div>
                        <SkeletonBlock className="h-24 w-full" />
                    </div>
                }>
                    {!profile ? (
                        <div className="text-center py-12 bg-surface rounded-2xl border border-foreground/6 shadow-card">
                            <Wrench size={32} className="mx-auto text-foreground/20 mb-3" />
                            <p className="text-foreground/50">{t("contractor.notFound")}</p>
                        </div>
                    ) : (
                    <div className="bg-surface rounded-2xl border border-foreground/6 shadow-card p-6">
                        <div className="flex items-start gap-5 mb-6">
                            {profile.logoUrl ? (
                                <img src={profile.logoUrl} alt={profile.companyName} className="w-20 h-20 rounded-lg object-cover" loading="lazy" />
                            ) : (
                                <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Wrench size={32} className="text-primary" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                                <p className="text-foreground/60">{profile.companyName}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {profile.categories && profile.categories.length > 0 ? (
                                        profile.categories.map((cat) => (
                                            <Badge key={cat.category} variant="default">
                                                {t(`contractorCategories.categories.${cat.category}`)}
                                            </Badge>
                                        ))
                                    ) : (
                                        <Badge>{t(`contractor.specialties.${profile.specialty}`)}</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        {profile.description && (
                            <div className="mb-6">
                                <h2 className="font-medium mb-2">{t("contractor.about")}</h2>
                                <p className="text-foreground/70">{profile.description}</p>
                            </div>
                        )}

                        {/* Categories & subcategories */}
                        {profile.categories && profile.categories.length > 0 && (
                            <div className="mb-6">
                                <h2 className="font-medium mb-3">{t("contractorCategories.label")}</h2>
                                <div className="space-y-3">
                                    {profile.categories.map((cat) => (
                                        <div key={cat.category}>
                                            <p className="text-sm font-medium text-foreground/80 mb-1">
                                                {t(`contractorCategories.categories.${cat.category}`)}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {cat.subcategories.map((sub) => (
                                                    <Badge key={sub} variant="default">
                                                        {t(`contractorCategories.subcategories.${sub}`)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 mb-6">
                            {profile.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Phone size={14} className="text-foreground/40" />
                                    <span>{profile.phone}</span>
                                </div>
                            )}
                            {profile.email && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Mail size={14} className="text-foreground/40" />
                                    <span>{profile.email}</span>
                                </div>
                            )}
                            {profile.website && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Globe size={14} className="text-foreground/40" />
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        {profile.website}
                                    </a>
                                </div>
                            )}
                        </div>

                        {/* Assigned buildings */}
                        {assignments.length > 0 && (
                            <div>
                                <h2 className="font-medium mb-3">{t("contractor.assignedBuildings")}</h2>
                                <div className="space-y-2">
                                    {assignments.map((a) => (
                                        <Link
                                            key={a.id}
                                            to={`/buildings/${a.buildingId}`}
                                            className="block p-3 bg-background rounded-xl border border-foreground/6 hover:border-primary/30 transition-colors"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{a.buildingName}</span>
                                                <Badge variant={a.status === "in_progress" ? "info" : a.status === "completed" ? "success" : "default"}>
                                                    {t(`contractor.status.${a.status}`)}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                </ContentLoader>
            </PageTransition>
        </div>
    );
}
