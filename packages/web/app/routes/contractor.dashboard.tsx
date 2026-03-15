import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Wrench, CheckCircle, DollarSign, FolderKanban } from "lucide-react";
import Navbar from "../../components/Navbar";
import RoleGuard from "../../components/RoleGuard";
import StatCard from "../../components/StatCard";
import Badge from "../../components/ui/Badge";
import RevenueChart from "../../components/charts/RevenueChart";
import ProjectProgressChart from "../../components/charts/ProjectProgressChart";
import DashboardSkeleton from "../../components/skeletons/DashboardSkeleton";
import PrioritySection from "../../components/PrioritySection";
import { useContractor } from "../../lib/hooks/useContractor";
import { deriveContractorRevenue } from "../../lib/revenue";
import type { AuthContext } from "@gemmaham/shared";

export default function ContractorDashboard() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { profile, assignments, loading } = useContractor(auth.user?.uid);

    const revenue = deriveContractorRevenue(assignments);

    const inProgress = assignments.filter((a) => a.status === "in_progress");
    const upcoming = assignments.filter((a) => a.status === "upcoming");
    const completed = assignments.filter((a) => a.status === "completed");

    const progressData = inProgress.map((a) => ({
        name: a.buildingName,
        progress: a.progressPercent,
    }));

    const renderAssignment = (a: (typeof assignments)[0]) => (
        <Link
            key={a.id}
            to={`/contractor/projects/${a.buildingId}`}
            className="flex items-center justify-between p-4 bg-surface rounded-xl border-2 border-foreground/10 hover:border-primary/20 transition-colors"
        >
            <div className="min-w-0">
                <h3 className="font-medium truncate">{a.buildingName}</h3>
                <p className="text-sm text-foreground/50">{a.trade} — {a.category}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-foreground/10 rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${a.progressPercent}%` }} />
                    </div>
                    <span className="text-xs text-foreground/50">{a.progressPercent}%</span>
                </div>
                <Badge variant={a.status}>{t(`contractor.status.${a.status}`)}</Badge>
            </div>
        </Link>
    );

    return (
        <RoleGuard allowedRole="contractor">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <main className="flex-1 p-6 max-w-5xl">
                        <h1 className="text-2xl font-bold mb-2">
                            {profile ? t("contractor.welcomeBack", { name: profile.displayName }) : t("contractor.dashboard")}
                        </h1>
                        <p className="text-foreground/50 mb-8">{t("contractor.dashboardDesc")}</p>

                        {loading ? (
                            <DashboardSkeleton />
                        ) : (
                            <>
                                {/* Stat cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                    <StatCard icon={Wrench} value={inProgress.length} label={t("contractor.activeProjects")} linkTo="/contractor/projects" />
                                    <StatCard icon={FolderKanban} value={assignments.length} label={t("dashboard.totalProjects")} linkTo="/contractor/projects" />
                                    <StatCard icon={CheckCircle} value={completed.length} label={t("dashboard.completed")} />
                                    <StatCard icon={DollarSign} value={revenue.total > 0 ? `${revenue.total.toLocaleString()}` : "—"} label={t("dashboard.totalRevenue")} />
                                </div>

                                {/* Charts */}
                                {(progressData.length > 0 || revenue.monthly.length > 0) && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                        <ProjectProgressChart
                                            data={progressData}
                                            title={t("charts.projectProgress")}
                                            loading={false}
                                        />
                                        <RevenueChart
                                            data={revenue.monthly}
                                            title={t("charts.monthlyRevenue")}
                                            loading={false}
                                        />
                                    </div>
                                )}

                                {/* Priority sections */}
                                {assignments.length === 0 ? (
                                    <div className="text-center py-8 bg-surface rounded-xl border-2 border-foreground/10">
                                        <Wrench size={32} className="mx-auto text-foreground/20 mb-3" />
                                        <p className="text-foreground/50">{t("contractor.noAssignments")}</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="font-semibold text-lg">{t("nav.projects")}</h2>
                                            <Link to="/contractor/projects" className="text-sm text-primary hover:underline">
                                                {t("dashboard.viewAll")}
                                            </Link>
                                        </div>
                                        {inProgress.length > 0 && (
                                            <PrioritySection priority="in_progress" count={inProgress.length}>
                                                <div className="space-y-3">{inProgress.map(renderAssignment)}</div>
                                            </PrioritySection>
                                        )}
                                        {upcoming.length > 0 && (
                                            <PrioritySection priority="planned" count={upcoming.length}>
                                                <div className="space-y-3">{upcoming.map(renderAssignment)}</div>
                                            </PrioritySection>
                                        )}
                                        {completed.length > 0 && (
                                            <PrioritySection priority="completed" count={completed.length} defaultExpanded={false}>
                                                <div className="space-y-3">{completed.map(renderAssignment)}</div>
                                            </PrioritySection>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
