import { useEffect, useState } from "react";
import { useOutletContext, Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { List, CalendarDays } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import { ContentLoader } from "../../components/ui/ContentLoader";
import ContractorCalendar from "../../components/ContractorCalendar";
import { getContractorAssignments } from "../../lib/firestore";
import type { AuthContext, Contractor } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

type Assignment = Contractor & { buildingName: string };
type ViewMode = "list" | "calendar";

export default function ContractorProjects() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>("list");

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
            className="block p-4 bg-surface rounded-2xl border border-foreground/6 hover:border-primary/20 transition-colors"
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
            <PageTransition>
            <div className="flex">
                <main className="flex-1 p-6 max-w-4xl">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="font-serif text-2xl font-bold">{t("nav.projects")}</h1>
                        <div className="flex gap-1 bg-foreground/5 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-primary text-white" : "text-foreground/50 hover:text-foreground"}`}
                                title={t("contractor.listView")}
                            >
                                <List size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode("calendar")}
                                className={`p-2 rounded-md transition-colors ${viewMode === "calendar" ? "bg-primary text-white" : "text-foreground/50 hover:text-foreground"}`}
                                title={t("contractor.calendarView")}
                            >
                                <CalendarDays size={16} />
                            </button>
                        </div>
                    </div>

                    <ContentLoader loading={loading} skeleton={
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-20 bg-foreground/5 rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    }>
                        {assignments.length === 0 ? (
                            <p className="text-foreground/50 text-center py-12">{t("contractor.noAssignments")}</p>
                        ) : viewMode === "calendar" ? (
                            <ContractorCalendar
                                assignments={assignments}
                                onSelect={(buildingId) => navigate(`/contractor/projects/${buildingId}`)}
                            />
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
                    </ContentLoader>
                </main>
            </div>
            </PageTransition>
        </RoleGuard>
    );
}
