import { useState, useEffect } from "react";
import { useParams, useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, MapPin, Calendar } from "lucide-react";
import Navbar from "../../components/Navbar";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import { getBuilding, getConstructionUpdates } from "../../lib/firestore";
import { useContractor } from "../../lib/hooks/useContractor";
import type { AuthContext, Building, ConstructionUpdate } from "@gemmaham/shared";

export default function ContractorBuildingDetail() {
    const { id } = useParams();
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { assignments } = useContractor(auth.user?.uid);
    const [building, setBuilding] = useState<Building | null>(null);
    const [updates, setUpdates] = useState<ConstructionUpdate[]>([]);
    const [loading, setLoading] = useState(true);

    const myAssignment = assignments.find((a) => a.buildingId === id);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const [b, u] = await Promise.all([
                    getBuilding(id),
                    getConstructionUpdates(id),
                ]);
                setBuilding(b);
                setUpdates(u);
            } catch (e) {
                console.error("Failed to load building:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    return (
        <RoleGuard allowedRole="contractor">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <main className="flex-1 p-6 max-w-5xl">
                        <Link to="/contractor/buildings" className="flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground mb-4">
                            <ArrowLeft size={16} /> {t("contractor.backToBuildings")}
                        </Link>

                        {loading ? (
                            <div className="space-y-4">
                                <SkeletonLine className="h-8 w-2/3" />
                                <SkeletonLine className="h-4 w-1/2" />
                                <SkeletonBlock className="h-48 w-full" />
                            </div>
                        ) : !building ? (
                            <div className="text-center py-12 bg-surface rounded-xl border-2 border-foreground/10">
                                <p className="text-foreground/50">{t("buildings.notFound")}</p>
                            </div>
                        ) : (
                            <>
                                {building.coverImageUrl && (
                                    <img
                                        src={building.coverImageUrl}
                                        alt={building.title}
                                        className="w-full h-48 object-cover rounded-xl mb-6"
                                    />
                                )}

                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h1 className="text-2xl font-bold">{building.title}</h1>
                                        <p className="text-foreground/50 flex items-center gap-1 mt-1">
                                            <MapPin size={14} /> {building.address}
                                        </p>
                                    </div>
                                    <Badge variant={building.status === "completed" ? "success" : "info"}>
                                        {t(`buildings.status.${building.status}`)}
                                    </Badge>
                                </div>

                                <p className="text-foreground/70 mb-6">{building.description}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-surface p-4 rounded-lg border border-foreground/10">
                                        <p className="text-sm text-foreground/50">{t("buildings.totalUnits")}</p>
                                        <p className="text-xl font-bold">{building.totalUnits}</p>
                                    </div>
                                    <div className="bg-surface p-4 rounded-lg border border-foreground/10">
                                        <p className="text-sm text-foreground/50">{t("buildings.floors")}</p>
                                        <p className="text-xl font-bold">{building.floors}</p>
                                    </div>
                                    <div className="bg-surface p-4 rounded-lg border border-foreground/10">
                                        <p className="text-sm text-foreground/50">{t("buildings.startDate")}</p>
                                        <p className="text-xl font-bold flex items-center gap-1">
                                            <Calendar size={14} /> {building.startDate}
                                        </p>
                                    </div>
                                    <div className="bg-surface p-4 rounded-lg border border-foreground/10">
                                        <p className="text-sm text-foreground/50">{t("buildings.estimatedCompletion")}</p>
                                        <p className="text-xl font-bold flex items-center gap-1">
                                            <Calendar size={14} /> {building.estimatedCompletion}
                                        </p>
                                    </div>
                                </div>

                                {/* My assignment info */}
                                {myAssignment && (
                                    <div className="bg-primary/5 border-2 border-primary/20 rounded-xl p-5 mb-8">
                                        <h2 className="font-bold mb-2">{t("contractor.myAssignment")}</h2>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-foreground/50">{t("contractor.trade")}:</span>{" "}
                                                <span className="font-medium">{myAssignment.trade}</span>
                                            </div>
                                            <div>
                                                <span className="text-foreground/50">{t("contractor.status_label")}:</span>{" "}
                                                <Badge variant={myAssignment.status === "in_progress" ? "info" : myAssignment.status === "completed" ? "success" : "default"}>
                                                    {t(`contractor.status.${myAssignment.status}`)}
                                                </Badge>
                                            </div>
                                            <div>
                                                <span className="text-foreground/50">{t("contractor.progress")}:</span>{" "}
                                                <span className="font-medium">{myAssignment.progressPercent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Construction updates */}
                                {updates.length > 0 && (
                                    <div>
                                        <h2 className="text-lg font-bold mb-4">{t("buildings.constructionUpdates")}</h2>
                                        <div className="space-y-4">
                                            {updates.map((u) => (
                                                <div key={u.id} className="bg-surface border border-foreground/10 rounded-lg p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="font-medium">{u.title}</h3>
                                                        <Badge>{t(`buildings.phase.${u.phase}`)}</Badge>
                                                    </div>
                                                    <p className="text-sm text-foreground/60">{u.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
