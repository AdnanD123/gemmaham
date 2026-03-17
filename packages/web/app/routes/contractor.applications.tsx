import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ClipboardList, Building2, Calendar, MessageSquare } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { getContractorApplications, getBuilding, getCompany } from "../../lib/firestore";
import { toMillis } from "@gemmaham/shared";
import type { AuthContext, ContractorApplication, Building, Company, ApplicationStatus } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

type FilterTab = "all" | "pending" | "accepted" | "rejected";

export default function ContractorApplications() {
    const { t } = useTranslation();
    const { user } = useOutletContext<AuthContext>();
    const [applications, setApplications] = useState<ContractorApplication[]>([]);
    const [buildings, setBuildings] = useState<Record<string, Building>>({});
    const [companies, setCompanies] = useState<Record<string, Company>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>("all");

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const apps = await getContractorApplications(user.uid);
                setApplications(apps);

                // Fetch building and company data
                const uniqueBuildingIds = [...new Set(apps.map((a) => a.buildingId))];
                const uniqueCompanyIds = [...new Set(apps.map((a) => a.companyId))];

                const buildingMap: Record<string, Building> = {};
                const companyMap: Record<string, Company> = {};

                await Promise.all([
                    ...uniqueBuildingIds.map(async (bid) => {
                        try {
                            const building = await getBuilding(bid);
                            if (building) buildingMap[bid] = building;
                        } catch {
                            // ignore
                        }
                    }),
                    ...uniqueCompanyIds.map(async (cid) => {
                        try {
                            const company = await getCompany(cid);
                            if (company) companyMap[cid] = company;
                        } catch {
                            // ignore
                        }
                    }),
                ]);

                setBuildings(buildingMap);
                setCompanies(companyMap);
            } catch (e) {
                console.error("Failed to load applications:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [user]);

    const tabs: { key: FilterTab; label: string }[] = [
        { key: "all", label: t("applications.filterAll") },
        { key: "pending", label: t("applications.filterPending") },
        { key: "accepted", label: t("applications.filterAccepted") },
        { key: "rejected", label: t("applications.filterRejected") },
    ];

    const filtered = activeTab === "all"
        ? applications
        : applications.filter((a) => a.status === activeTab);

    const getStatusVariant = (status: ApplicationStatus): "pending" | "accepted" | "rejected" | "withdrawn" => {
        return status;
    };

    const formatDate = (ts: ContractorApplication["createdAt"]) => {
        const ms = toMillis(ts);
        if (!ms) return "";
        const date = new Date(ms);
        return format(date, "MMM d, yyyy");
    };

    const formatRelative = (ts: ContractorApplication["createdAt"]) => {
        const ms = toMillis(ts);
        if (!ms) return "";
        return formatDistanceToNow(new Date(ms), { addSuffix: true });
    };

    const truncateMessage = (msg: string, maxLen = 120) => {
        if (msg.length <= maxLen) return msg;
        return msg.slice(0, maxLen) + "...";
    };

    const getLink = (app: ContractorApplication) => {
        if (app.status === "accepted") {
            return `/contractor/projects`;
        }
        return `/buildings/${app.buildingId}`;
    };

    const renderEmptyState = () => {
        const emptyKey = activeTab === "all"
            ? t("contractor.applications.noApplicationsAll")
            : t("contractor.applications.noApplicationsFiltered", { status: t(`applications.status.${activeTab}`) });

        return (
            <div className="text-center py-12">
                <ClipboardList size={40} className="mx-auto text-foreground/20 mb-3" />
                <p className="text-foreground/50">{emptyKey}</p>
                {activeTab === "all" && (
                    <Link
                        to="/contractor/browse"
                        className="inline-block mt-4 text-primary hover:underline text-sm font-medium"
                    >
                        {t("contractor.applications.browseProjects")}
                    </Link>
                )}
            </div>
        );
    };

    const renderCard = (app: ContractorApplication) => {
        const building = buildings[app.buildingId];
        const company = companies[app.companyId];

        return (
            <Link
                key={app.id}
                to={getLink(app)}
                className="block bg-surface rounded-2xl border border-foreground/6 hover:border-primary/20 transition-colors overflow-hidden"
            >
                <div className="flex">
                    {/* Building image */}
                    <div className="w-32 h-full min-h-[140px] flex-shrink-0 bg-foreground/5">
                        {building?.coverImageUrl ? (
                            <img loading="lazy"
                                src={building.coverImageUrl}
                                alt={building.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Building2 size={32} className="text-foreground/20" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <h3 className="font-medium truncate">
                                    {building?.title || t("contractor.applications.unknownBuilding")}
                                </h3>
                                {building?.address && (
                                    <p className="text-sm text-foreground/50 truncate">{building.address}</p>
                                )}
                            </div>
                            <Badge variant={getStatusVariant(app.status)}>
                                {t(`applications.status.${app.status}`)}
                            </Badge>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/60">
                            {company && (
                                <span>{company.name}</span>
                            )}
                            <span className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span title={formatDate(app.createdAt)}>
                                    {formatRelative(app.createdAt)}
                                </span>
                            </span>
                            {app.proposedRate != null && (
                                <span className="font-medium text-foreground">
                                    {app.proposedRate.toLocaleString()} {app.currency}
                                </span>
                            )}
                        </div>

                        {app.message && (
                            <div className="mt-2 flex items-start gap-1.5 text-sm text-foreground/50">
                                <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                                <span>{truncateMessage(app.message)}</span>
                            </div>
                        )}

                        {app.companyNotes && (app.status === "accepted" || app.status === "rejected") && (
                            <div className="mt-2 text-sm bg-foreground/5 rounded-lg px-3 py-2">
                                <span className="font-medium text-foreground/70">{t("applications.companyNotes")}:</span>{" "}
                                <span className="text-foreground/60">{app.companyNotes}</span>
                            </div>
                        )}
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <RoleGuard allowedRole="contractor">
            <PageTransition>
            <div className="flex">
                <main className="flex-1 p-6 max-w-4xl">
                    <h1 className="font-serif text-2xl font-bold mb-1">
                        {t("contractor.applications.title")}
                    </h1>
                    <p className="text-foreground/50 mb-6">
                        {t("contractor.applications.description")}
                    </p>

                    {/* Filter tabs */}
                    <div className="flex gap-1 mb-6 bg-foreground/5 rounded-lg p-1 w-fit">
                        {tabs.map((tab) => {
                            const count = tab.key === "all"
                                ? applications.length
                                : applications.filter((a) => a.status === tab.key).length;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        activeTab === tab.key
                                            ? "bg-primary text-white font-medium"
                                            : "text-foreground/50 hover:text-foreground"
                                    }`}
                                >
                                    {tab.label} ({count})
                                </button>
                            );
                        })}
                    </div>

                    <ContentLoader loading={loading} skeleton={
                        <div className="space-y-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <SkeletonBlock key={i} className="h-36 rounded-xl" />
                            ))}
                        </div>
                    }>
                        {filtered.length === 0 ? (
                            renderEmptyState()
                        ) : (
                            <div className="space-y-4">
                                {filtered.map(renderCard)}
                            </div>
                        )}
                    </ContentLoader>
                </main>
            </div>
            </PageTransition>
        </RoleGuard>
    );
}
