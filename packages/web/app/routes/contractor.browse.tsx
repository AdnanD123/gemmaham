import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { Building2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import RoleGuard from "../../components/RoleGuard";
import ProjectCard from "../../components/ProjectCard";
import ApplicationModal from "../../components/ApplicationModal";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { listBrowsableProjects, getCompany, getContractorProfile, getContractorApplicationForBuilding } from "../../lib/firestore";
import type { AuthContext, Building, ContractorProfile } from "@gemmaham/shared";

export default function ContractorBrowse() {
    const { t } = useTranslation();
    const { user } = useOutletContext<AuthContext>();
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
    const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [contractorProfile, setContractorProfile] = useState<ContractorProfile | null>(null);
    const [applyTarget, setApplyTarget] = useState<Building | null>(null);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const [projects, profile] = await Promise.all([
                    listBrowsableProjects(),
                    getContractorProfile(user.uid),
                ]);
                setBuildings(projects);
                setContractorProfile(profile);

                // Fetch company names
                const uniqueCompanyIds = [...new Set(projects.map((b) => b.companyId))];
                const names: Record<string, string> = {};
                await Promise.all(
                    uniqueCompanyIds.map(async (cid) => {
                        try {
                            const company = await getCompany(cid);
                            if (company) names[cid] = company.name;
                        } catch {
                            // ignore
                        }
                    })
                );
                setCompanyNames(names);

                // Check which buildings already have applications
                const applied = new Set<string>();
                await Promise.all(
                    projects.map(async (b) => {
                        const existing = await getContractorApplicationForBuilding(user.uid, b.id);
                        if (existing) applied.add(b.id);
                    })
                );
                setAppliedIds(applied);
            } catch (e) {
                console.error("Failed to load projects:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const handleApplySuccess = () => {
        if (applyTarget) {
            setAppliedIds((prev) => new Set(prev).add(applyTarget.id));
        }
    };

    return (
        <RoleGuard allowedRole="contractor">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <main className="flex-1 p-6">
                        <div className="max-w-5xl">
                            <h1 className="text-2xl font-bold mb-1">{t("applications.browseProjectsTitle")}</h1>
                            <p className="text-foreground/50 mb-6">{t("applications.browseProjectsDesc")}</p>

                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <SkeletonBlock key={i} className="h-72 rounded-xl" />
                                    ))}
                                </div>
                            ) : buildings.length === 0 ? (
                                <div className="text-center py-12">
                                    <Building2 size={40} className="mx-auto text-foreground/20 mb-3" />
                                    <p className="text-foreground/50">{t("applications.noProjects")}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {buildings.map((b) => (
                                        <ProjectCard
                                            key={b.id}
                                            building={b}
                                            companyName={companyNames[b.companyId] || ""}
                                            alreadyApplied={appliedIds.has(b.id)}
                                            onApply={setApplyTarget}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>

            {contractorProfile && (
                <ApplicationModal
                    isOpen={!!applyTarget}
                    onClose={() => setApplyTarget(null)}
                    building={applyTarget}
                    contractor={contractorProfile}
                    onSuccess={handleApplySuccess}
                />
            )}
        </RoleGuard>
    );
}
