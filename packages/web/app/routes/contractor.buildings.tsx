import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Wrench, MapPin } from "lucide-react";
import Navbar from "../../components/Navbar";
import ContractorSidebar from "../../components/ContractorSidebar";
import RoleGuard from "../../components/RoleGuard";
import { SkeletonLine } from "../../components/ui/Skeleton";
import Badge from "../../components/ui/Badge";
import { useContractor } from "../../lib/hooks/useContractor";
import type { AuthContext } from "@gemmaham/shared";

export default function ContractorBuildings() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { assignments, loading } = useContractor(auth.user?.uid);

    return (
        <RoleGuard allowedRole="contractor">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <ContractorSidebar />
                    <main className="flex-1 p-6 max-w-5xl">
                        <h1 className="text-2xl font-bold mb-6">{t("contractor.assignedBuildings")}</h1>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-surface rounded-xl border-2 border-foreground/10 p-5">
                                        <SkeletonLine className="h-6 w-3/4 mb-3" />
                                        <SkeletonLine className="h-4 w-1/2 mb-4" />
                                        <SkeletonLine className="h-2 w-full" />
                                    </div>
                                ))}
                            </div>
                        ) : assignments.length === 0 ? (
                            <div className="text-center py-12 bg-surface rounded-xl border-2 border-foreground/10">
                                <Wrench size={32} className="mx-auto text-foreground/20 mb-3" />
                                <p className="text-foreground/50">{t("contractor.noAssignments")}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {assignments.map((a) => (
                                    <Link
                                        key={a.id}
                                        to={`/contractor/buildings/${a.buildingId}`}
                                        className="bg-surface rounded-xl border-2 border-foreground/10 p-5 hover:border-primary/30 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-bold text-lg">{a.buildingName}</h3>
                                            <Badge variant={a.status === "in_progress" ? "info" : a.status === "completed" ? "success" : "default"}>
                                                {t(`contractor.status.${a.status}`)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-foreground/50 mb-2">
                                            <MapPin size={14} className="inline mr-1" />
                                            {a.trade} — {t(`contractor.specialties.${a.category}`)}
                                        </p>
                                        <div className="mt-3">
                                            <div className="flex justify-between text-xs text-foreground/50 mb-1">
                                                <span>{t("contractor.progress")}</span>
                                                <span>{a.progressPercent}%</span>
                                            </div>
                                            <div className="h-2 bg-foreground/10 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all"
                                                    style={{ width: `${a.progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
