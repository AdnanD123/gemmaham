import { useState, useEffect } from "react";
import { useParams, useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import Navbar from "../../components/Navbar";
import ContractorSidebar from "../../components/ContractorSidebar";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import { getBuilding, getContractorAssignments, getConstructionUpdates } from "../../lib/firestore";
import type { AuthContext, Building, Contractor, ConstructionUpdate } from "@gemmaham/shared";

type Assignment = Contractor & { buildingName: string };

export default function ContractorProjectDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const auth = useOutletContext<AuthContext>();

    const [building, setBuilding] = useState<Building | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [updates, setUpdates] = useState<ConstructionUpdate[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id || !auth.user) return;
        (async () => {
            try {
                const [b, assignments, u] = await Promise.all([
                    getBuilding(id),
                    getContractorAssignments(auth.user!.uid),
                    getConstructionUpdates(id),
                ]);
                setBuilding(b);
                setAssignment(assignments.find((a) => a.buildingId === id) || null);
                setUpdates(u);
            } catch (err) {
                console.error("Failed to load project:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [id, auth.user]);

    return (
        <RoleGuard allowedRole="contractor">
            <Navbar />
            <div className="flex mt-20">
                <ContractorSidebar />
                <main className="flex-1 p-6 max-w-4xl">
                    <Link to="/contractor/projects" className="flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground mb-4">
                        <ArrowLeft size={16} /> {t("contractor.backToBuildings")}
                    </Link>

                    {loading ? (
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-foreground/10 rounded w-1/2" />
                            <div className="h-40 bg-foreground/10 rounded-xl" />
                        </div>
                    ) : !building ? (
                        <p className="text-foreground/50">{t("buildings.notFound")}</p>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <h1 className="font-serif text-2xl font-bold">{building.title}</h1>
                                <Badge variant={building.status}>{t(`buildings.status.${building.status}`)}</Badge>
                            </div>

                            <p className="text-foreground/50 mb-6">{building.address}</p>

                            {/* My assignment */}
                            {assignment && (
                                <div className="p-4 bg-surface rounded-xl border-2 border-foreground/10 mb-6">
                                    <h2 className="font-semibold mb-3">{t("contractor.myAssignment")}</h2>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-foreground/50">{t("contractor.trade")}:</span>
                                            <p className="font-medium">{assignment.trade}</p>
                                        </div>
                                        <div>
                                            <span className="text-foreground/50">{t("contractor.status_label")}:</span>
                                            <p><Badge variant={assignment.status}>{t(`contractor.status.${assignment.status}`)}</Badge></p>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-foreground/50">{t("contractor.progress")}:</span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex-1 h-3 bg-foreground/10 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${assignment.progressPercent}%` }} />
                                                </div>
                                                <span className="text-sm font-medium">{assignment.progressPercent}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Construction updates */}
                            {updates.length > 0 && (
                                <div>
                                    <h2 className="font-semibold mb-3">{t("construction.timeline")}</h2>
                                    <div className="space-y-3">
                                        {updates.map((u) => (
                                            <div key={u.id} className="p-4 bg-surface rounded-xl border border-foreground/10">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium">{u.title}</h3>
                                                    <Badge variant={u.phase as any}>{t(`buildings.phase.${u.phase}`)}</Badge>
                                                </div>
                                                <p className="text-sm text-foreground/50">{u.description}</p>
                                                <p className="text-xs text-foreground/40 mt-1">Progress: {u.progressPercent}%</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </RoleGuard>
    );
}
