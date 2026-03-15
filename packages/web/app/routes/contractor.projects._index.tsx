import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import { getContractorAssignments } from "../../lib/firestore";
import type { AuthContext, Contractor } from "@gemmaham/shared";

type Assignment = Contractor & { buildingName: string };

export default function ContractorProjects() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!auth.user) return;
        (async () => {
            try {
                const data = await getContractorAssignments(auth.user!.uid);
                setAssignments(data);
            } catch (err) {
                console.error("Failed to load assignments:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.user]);

    const grouped = {
        in_progress: assignments.filter((a) => a.status === "in_progress"),
        upcoming: assignments.filter((a) => a.status === "upcoming"),
        completed: assignments.filter((a) => a.status === "completed"),
    };

    const renderAssignment = (a: Assignment) => (
        <Link
            key={a.id}
            to={`/contractor/projects/${a.buildingId}`}
            className="block p-4 bg-surface rounded-xl border-2 border-foreground/10 hover:border-primary/20 transition-colors"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-medium">{a.buildingName}</h3>
                    <p className="text-sm text-foreground/50">{a.trade} - {a.category}</p>
                </div>
                <Badge variant={a.status}>{t(`contractor.status.${a.status}`)}</Badge>
            </div>
            <div className="mt-2">
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${a.progressPercent}%` }}
                        />
                    </div>
                    <span className="text-xs text-foreground/50">{a.progressPercent}%</span>
                </div>
            </div>
        </Link>
    );

    return (
        <RoleGuard allowedRole="contractor">
            <Navbar />
            <div className="flex mt-20">
                <main className="flex-1 p-6 max-w-4xl">
                    <h1 className="font-serif text-2xl font-bold mb-6">{t("nav.projects")}</h1>

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 bg-foreground/5 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : assignments.length === 0 ? (
                        <p className="text-foreground/50 text-center py-12">{t("contractor.noAssignments")}</p>
                    ) : (
                        <>
                            {grouped.in_progress.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wide mb-3">{t("priority.inProgress")}</h2>
                                    <div className="space-y-3">{grouped.in_progress.map(renderAssignment)}</div>
                                </div>
                            )}
                            {grouped.upcoming.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wide mb-3">{t("priority.planned")}</h2>
                                    <div className="space-y-3">{grouped.upcoming.map(renderAssignment)}</div>
                                </div>
                            )}
                            {grouped.completed.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-sm font-semibold text-foreground/50 uppercase tracking-wide mb-3">{t("priority.completed")}</h2>
                                    <div className="space-y-3">{grouped.completed.map(renderAssignment)}</div>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </RoleGuard>
    );
}
