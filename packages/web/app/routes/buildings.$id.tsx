import { useState, useEffect } from "react";
import { useParams, useOutletContext, Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { MessageSquare, Phone, Mail, Globe } from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import FlatCard from "../../components/FlatCard";
import { PageTransition } from "../../components/ui/PageTransition";
import { SkeletonBlock, SkeletonLine } from "../../components/ui/Skeleton";
import {
    getBuilding, listBuildingFlats, getConstructionUpdates,
    getContractors, getCompany, getOrCreateBuildingConversation,
} from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, Building, Flat, ConstructionUpdate, Contractor, Company } from "@gemmaham/shared";

export default function BuildingDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [building, setBuilding] = useState<Building | null>(null);
    const [company, setCompany] = useState<Company | null>(null);
    const [flats, setFlats] = useState<Flat[]>([]);
    const [updates, setUpdates] = useState<ConstructionUpdate[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const [b, f, u, c] = await Promise.all([
                    getBuilding(id),
                    listBuildingFlats(id),
                    getConstructionUpdates(id),
                    getContractors(id),
                ]);
                setBuilding(b);
                setFlats(f);
                setUpdates(u);
                setContractors(c);
                if (b) {
                    const comp = await getCompany(b.companyId);
                    setCompany(comp);
                }
            } catch (e) {
                console.error("Failed to load building:", e);
                addToast("error", t("errors.loadFailed"));
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    if (loading) {
        return (
            <div className="home">
                <main className="max-w-5xl mx-auto p-6 space-y-4">
                    <SkeletonBlock className="h-64 rounded-xl" />
                    <SkeletonLine className="w-64 h-8" />
                    <SkeletonLine className="w-full h-4" />
                    <div className="grid grid-cols-3 gap-4">
                        <SkeletonBlock className="h-48 rounded-lg" />
                        <SkeletonBlock className="h-48 rounded-lg" />
                        <SkeletonBlock className="h-48 rounded-lg" />
                    </div>
                </main>
            </div>
        );
    }

    if (!building) {
        return (
            <div className="home">
                <main className="max-w-5xl mx-auto p-6 text-center py-16">
                    <p className="text-foreground/50">{t("buildings.notFound")}</p>
                    <Link to="/buildings" className="text-primary mt-2 inline-block">{t("buildings.backToBrowse")}</Link>
                </main>
            </div>
        );
    }

    const activeContractors = contractors.filter((c) => c.status !== "completed");
    const completedContractors = contractors.filter((c) => c.status === "completed");

    return (
        <div className="home">
            <PageTransition className="max-w-5xl mx-auto p-6">
                {/* Hero */}
                <div className="relative rounded-2xl overflow-hidden mb-6">
                    {building.coverImageUrl ? (
                        <img src={building.coverImageUrl} alt={building.title} className="w-full h-72 object-cover" loading="lazy" />
                    ) : (
                        <div className="w-full h-72 bg-foreground/5 flex items-center justify-center">
                            <span className="text-6xl">🏗</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-3xl font-bold">{building.title}</h1>
                            <Badge variant={building.status}>{t(`buildings.status.${building.status}`)}</Badge>
                        </div>
                        <p className="text-white/80">{building.address}</p>
                    </div>
                </div>

                {/* Info bar */}
                <div className="flex flex-wrap gap-6 mb-8 text-sm text-foreground/60">
                    <span><strong>{building.floors}</strong> {t("buildings.floorsLabel")}</span>
                    <span><strong>{building.availableUnits}</strong>/{building.totalUnits} {t("buildings.unitsAvailable")}</span>
                    <span>{t("buildings.est")}: <strong>{building.estimatedCompletion}</strong></span>
                    <span>{t("buildings.currentPhase")}: <strong>{t(`buildings.phase.${building.currentPhase}`)}</strong></span>
                </div>

                {/* Description */}
                {building.description && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-2">{t("buildings.description")}</h2>
                        <p className="text-foreground/70 whitespace-pre-line">{building.description}</p>
                    </div>
                )}

                {/* Overall Progress */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold mb-3">{t("construction.progressTitle")}</h2>
                    <div className="bg-surface rounded-2xl border border-foreground/6 shadow-card p-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-foreground/60">{t(`buildings.phase.${building.currentPhase}`)}</span>
                            <Badge variant={building.status}>{t(`buildings.status.${building.status}`)}</Badge>
                        </div>
                        <div className="w-full h-3 bg-foreground/6 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{
                                    width: building.status === "completed" ? "100%"
                                        : building.status === "near_completion" ? "85%"
                                        : building.status === "under_construction" ? "50%"
                                        : "10%",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Construction Timeline */}
                {updates.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-3">{t("construction.timeline")}</h2>
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-foreground/6" />
                            <div className="space-y-4">
                                {updates.map((update) => (
                                    <div key={update.id} className="relative pl-10">
                                        <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                                        <div className="p-4 bg-surface rounded-2xl border border-foreground/6 shadow-card">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium">{update.title}</h3>
                                                <Badge variant="default">{t(`buildings.phase.${update.phase}`)}</Badge>
                                                <span className="text-xs text-foreground/40 ml-auto">{update.progressPercent}%</span>
                                            </div>
                                            {update.description && <p className="text-sm text-foreground/60">{update.description}</p>}
                                            {update.images.length > 0 && (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {update.images.map((img, i) => (
                                                        <img key={i} src={img} alt="" className="w-20 h-20 rounded-lg object-cover" loading="lazy" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Contractors */}
                {contractors.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-3">{t("contractors.title")}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Active contractors */}
                            {activeContractors.map((c) => (
                                <div key={c.id} className="p-4 bg-surface rounded-2xl border border-foreground/6 shadow-card">
                                    <div className="flex items-start gap-3">
                                        {c.logoUrl ? (
                                            <img src={c.logoUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover" loading="lazy" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center text-sm">🔧</div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                {c.contractorUserId ? (
                                                    <Link to={`/contractors/${c.contractorUserId}`} className="font-medium text-primary hover:underline">{c.name}</Link>
                                                ) : (
                                                    <h3 className="font-medium">{c.name}</h3>
                                                )}
                                                <Badge variant={c.status}>{t(`contractors.status.${c.status}`)}</Badge>
                                            </div>
                                            <p className="text-xs text-foreground/50">{c.trade}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="w-full h-1.5 bg-foreground/6 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${c.progressPercent}%` }} />
                                        </div>
                                        <span className="text-xs text-foreground/40 mt-1 block">{c.progressPercent}%</span>
                                    </div>
                                    <div className="flex gap-3 mt-2 text-xs text-foreground/50">
                                        {c.phone && <span className="flex items-center gap-1"><Phone size={10} /> {c.phone}</span>}
                                        {c.email && <span className="flex items-center gap-1"><Mail size={10} /> {c.email}</span>}
                                        {c.website && <span className="flex items-center gap-1"><Globe size={10} /> {c.website}</span>}
                                    </div>
                                </div>
                            ))}

                            {/* Completed contractors — grayed out */}
                            {completedContractors.map((c) => (
                                <div key={c.id} className="p-4 bg-surface rounded-2xl border border-foreground/6 shadow-card opacity-50">
                                    <div className="flex items-start gap-3">
                                        {c.logoUrl ? (
                                            <img src={c.logoUrl} alt={c.name} className="w-10 h-10 rounded-lg object-cover grayscale" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center text-sm">🔧</div>
                                        )}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium">{c.name}</h3>
                                                <Badge variant="completed">{t("contractors.workComplete")}</Badge>
                                            </div>
                                            <p className="text-xs text-foreground/50">{c.trade}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <div className="w-full h-1.5 bg-foreground/6 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 rounded-full w-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Available Units */}
                {flats.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-lg font-bold mb-3">{t("buildings.availableUnitsTitle")}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {flats.map((flat) => (
                                <FlatCard key={flat.id} flat={flat} />
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA */}
                {company && auth.role !== "company" && (
                    <div className="bg-surface rounded-2xl border border-foreground/6 shadow-card p-6 text-center">
                        <p className="text-foreground/60 mb-3">{t("buildings.interestedCta")}</p>
                        <p className="font-medium mb-4">{t("flats.listedBy")}: {company.name}</p>
                        {auth.user ? (
                            <Button onClick={async () => {
                                try {
                                    const { id: convId } = await getOrCreateBuildingConversation(
                                        building.id,
                                        auth.user!.uid,
                                        building.companyId,
                                        {
                                            buildingTitle: building.title,
                                            companyName: company.name,
                                            userName: auth.user!.displayName || "User",
                                        },
                                    );
                                    const cardState = {
                                        cardData: {
                                            title: building.title,
                                            subtitle: building.address,
                                            ...(building.coverImageUrl && { imageUrl: building.coverImageUrl }),
                                            linkType: "building" as const,
                                            linkId: building.id,
                                        },
                                    };
                                    navigate(
                                        auth.role === "contractor"
                                            ? `/contractor/messages/${convId}`
                                            : `/user/messages/${convId}`,
                                        { state: cardState },
                                    );
                                } catch (e) {
                                    console.error("Failed to start conversation:", e);
                                    addToast("error", t("errors.loadFailed"));
                                }
                            }}>
                                <MessageSquare size={16} className="mr-2" /> {t("buildings.contactAgency")}
                            </Button>
                        ) : auth.loading ? (
                            <Button disabled>
                                <MessageSquare size={16} className="mr-2" /> {t("buildings.contactAgency")}
                            </Button>
                        ) : (
                            <Link to="/auth/login">
                                <Button>{t("buildings.contactAgency")}</Button>
                            </Link>
                        )}
                    </div>
                )}
            </PageTransition>
        </div>
    );
}
