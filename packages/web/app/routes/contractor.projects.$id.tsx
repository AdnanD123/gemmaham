import { useState, useEffect } from "react";
import { useParams, useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Download, FileText, Shield, ClipboardList, Ruler, File } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { getBuilding, getContractorAssignments, getConstructionUpdates, getBuildingDocuments } from "../../lib/firestore";
import { formatTimestamp } from "@gemmaham/shared";
import type { AuthContext, Building, Contractor, ConstructionUpdate, BuildingDocument, BuildingDocumentType } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";
import { ProgressReporter } from "../../components/ProgressReporter";

type Assignment = Contractor & { buildingName: string };

export default function ContractorProjectDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const auth = useOutletContext<AuthContext>();

    const [building, setBuilding] = useState<Building | null>(null);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [updates, setUpdates] = useState<ConstructionUpdate[]>([]);
    const [sharedDocs, setSharedDocs] = useState<BuildingDocument[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        if (!id || !auth.user) return;
        try {
            const [b, assignments, u, docs] = await Promise.all([
                getBuilding(id),
                getContractorAssignments(auth.user!.uid),
                getConstructionUpdates(id),
                getBuildingDocuments(id),
            ]);
            setBuilding(b);
            setAssignment(assignments.find((a) => a.buildingId === id) || null);
            setUpdates(u);
            setSharedDocs(docs.filter((d) => d.sharedWithContractors));
        } catch (err) {
            console.error("Failed to load project:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id, auth.user]);

    return (
        <RoleGuard allowedRole="contractor">
            <PageTransition>
            <div className="flex">
                <main className="flex-1 p-6 max-w-4xl">
                    <Link to="/contractor/projects" className="flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground mb-4">
                        <ArrowLeft size={16} /> {t("contractor.backToBuildings")}
                    </Link>

                    <ContentLoader loading={loading} skeleton={
                        <div className="animate-pulse space-y-4">
                            <div className="h-8 bg-foreground/10 rounded w-1/2" />
                            <div className="h-40 bg-foreground/10 rounded-2xl" />
                        </div>
                    }>
                        {!building ? (
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
                                <div className="p-4 bg-surface rounded-2xl border border-foreground/6 mb-6">
                                    <h2 className="font-semibold mb-3">{t("contractor.myAssignment")}</h2>
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                        <div>
                                            <span className="text-foreground/50">{t("contractor.trade")}:</span>
                                            <p className="font-medium">{assignment.trade}</p>
                                        </div>
                                        <div>
                                            <span className="text-foreground/50">{t("contractor.status_label")}:</span>
                                            <p><Badge variant={assignment.status}>{t(`contractor.status.${assignment.status}`)}</Badge></p>
                                        </div>
                                    </div>

                                    {assignment.contractorUserId === auth.user?.uid && (
                                        <ProgressReporter
                                            buildingId={assignment.buildingId}
                                            contractorId={assignment.id}
                                            currentProgress={assignment.progressPercent}
                                            currentStatus={assignment.status}
                                            onUpdate={loadData}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Project Documents */}
                            {sharedDocs.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="font-semibold mb-3">{t("documents.title")}</h2>
                                    <div className="space-y-3">
                                        {sharedDocs.map((d) => {
                                            const iconMap: Record<BuildingDocumentType, typeof FileText> = {
                                                plan: Ruler,
                                                permit: Shield,
                                                contract: ClipboardList,
                                                specification: FileText,
                                                other: File,
                                            };
                                            const Icon = iconMap[d.type] || File;
                                            return (
                                                <div key={d.id} className="rounded-2xl border border-foreground/6 shadow-card bg-surface p-4 flex items-center gap-4">
                                                    <div className="p-2 bg-foreground/5 rounded-xl shrink-0">
                                                        <Icon size={20} className="text-foreground/60" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium truncate">{d.name}</h4>
                                                            <Badge variant={d.type as string}>{t(`documents.${d.type}`)}</Badge>
                                                        </div>
                                                        <p className="text-xs text-foreground/40">{formatTimestamp(d.createdAt)}</p>
                                                    </div>
                                                    <a
                                                        href={d.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 hover:bg-foreground/5 rounded-lg transition-colors shrink-0"
                                                        title={t("documents.download")}
                                                    >
                                                        <Download size={16} />
                                                    </a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Construction updates */}
                            {updates.length > 0 && (
                                <div>
                                    <h2 className="font-semibold mb-3">{t("construction.timeline")}</h2>
                                    <div className="space-y-3">
                                        {updates.map((u) => (
                                            <div key={u.id} className="p-4 bg-surface rounded-2xl border border-foreground/6">
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
                    </ContentLoader>
                </main>
            </div>
            </PageTransition>
        </RoleGuard>
    );
}
