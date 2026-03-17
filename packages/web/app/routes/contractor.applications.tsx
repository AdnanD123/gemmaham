import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ClipboardList, Building2, Calendar, MessageSquare, Mail } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import {
    getContractorApplications,
    getContractorInvitations,
    updateContractorInvitationStatus,
    createApplication,
    getBuilding,
    getCompany,
} from "../../lib/firestore";
import { toMillis } from "@gemmaham/shared";
import type {
    AuthContext,
    ContractorApplication,
    ContractorInvitation,
    Building,
    Company,
    ApplicationStatus,
    ContractorInvitationStatus,
} from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";
import { useToast } from "../../lib/contexts/ToastContext";

type FilterTab = "all" | "pending" | "accepted" | "rejected" | "invitations";

export default function ContractorApplications() {
    const { t } = useTranslation();
    const { user } = useOutletContext<AuthContext>();
    const { addToast } = useToast();
    const [applications, setApplications] = useState<ContractorApplication[]>([]);
    const [invitations, setInvitations] = useState<ContractorInvitation[]>([]);
    const [buildings, setBuildings] = useState<Record<string, Building>>({});
    const [companies, setCompanies] = useState<Record<string, Company>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<FilterTab>("all");
    const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const [apps, invites] = await Promise.all([
                    getContractorApplications(user.uid),
                    getContractorInvitations(user.uid),
                ]);
                setApplications(apps);
                setInvitations(invites);

                // Fetch building and company data
                const allBuildingIds = [
                    ...apps.map((a) => a.buildingId),
                    ...invites.map((i) => i.buildingId),
                ];
                const allCompanyIds = [
                    ...apps.map((a) => a.companyId),
                    ...invites.map((i) => i.companyId),
                ];
                const uniqueBuildingIds = [...new Set(allBuildingIds)];
                const uniqueCompanyIds = [...new Set(allCompanyIds)];

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
        { key: "invitations", label: t("invitations.title") },
    ];

    const filtered = activeTab === "all"
        ? applications
        : activeTab === "invitations"
        ? []
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

    const handleAcceptInvitation = async (invitation: ContractorInvitation) => {
        if (!user) return;
        setProcessingInvitation(invitation.id);
        try {
            await updateContractorInvitationStatus(invitation.id, "accepted");

            // Create an application for the building
            await createApplication({
                buildingId: invitation.buildingId,
                companyId: invitation.companyId,
                contractorUserId: user.uid,
                contractorName: invitation.contractorName,
                contractorCompanyName: "",
                contractorSpecialty: "other",
                contractorCategories: [],
                contractorLogoUrl: null,
                message: invitation.message || "Accepted invitation",
                proposedRate: null,
                currency: "EUR",
            });

            setInvitations((prev) =>
                prev.map((inv) =>
                    inv.id === invitation.id ? { ...inv, status: "accepted" as ContractorInvitationStatus } : inv,
                ),
            );
            addToast("success", t("toast.invitationAccepted"));
        } catch (e) {
            console.error("Failed to accept invitation:", e);
            addToast("error", t("toast.invitationAcceptFailed"));
        } finally {
            setProcessingInvitation(null);
        }
    };

    const handleDeclineInvitation = async (invitation: ContractorInvitation) => {
        setProcessingInvitation(invitation.id);
        try {
            await updateContractorInvitationStatus(invitation.id, "declined");
            setInvitations((prev) =>
                prev.map((inv) =>
                    inv.id === invitation.id ? { ...inv, status: "declined" as ContractorInvitationStatus } : inv,
                ),
            );
            addToast("success", t("toast.invitationDeclined"));
        } catch (e) {
            console.error("Failed to decline invitation:", e);
            addToast("error", t("toast.invitationDeclineFailed"));
        } finally {
            setProcessingInvitation(null);
        }
    };

    const renderEmptyState = () => {
        if (activeTab === "invitations") {
            return (
                <div className="text-center py-12">
                    <Mail size={40} className="mx-auto text-foreground/20 mb-3" />
                    <p className="text-foreground/50">{t("invitations.noInvitations")}</p>
                </div>
            );
        }

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

    const renderInvitationCard = (invitation: ContractorInvitation) => {
        const statusBadgeVariant = invitation.status === "accepted"
            ? "accepted"
            : invitation.status === "declined"
            ? "rejected"
            : "pending";

        return (
            <div
                key={invitation.id}
                className="bg-surface rounded-2xl border border-foreground/6 overflow-hidden"
            >
                <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                            <h3 className="font-medium">{invitation.buildingTitle}</h3>
                            <p className="text-sm text-foreground/50">
                                {t("invitations.fromCompany")}: {invitation.companyName}
                            </p>
                        </div>
                        <Badge variant={statusBadgeVariant}>
                            {invitation.status === "accepted"
                                ? t("invitations.accept")
                                : invitation.status === "declined"
                                ? t("invitations.decline")
                                : t("applications.filterPending")}
                        </Badge>
                    </div>

                    {invitation.message && (
                        <div className="mt-2 flex items-start gap-1.5 text-sm text-foreground/50">
                            <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                            <span>{truncateMessage(invitation.message)}</span>
                        </div>
                    )}

                    <div className="mt-2 flex items-center gap-1 text-sm text-foreground/60">
                        <Calendar size={14} />
                        <span title={formatDate(invitation.createdAt)}>
                            {t("invitations.invitedOn")} {formatRelative(invitation.createdAt)}
                        </span>
                    </div>

                    {invitation.status === "pending" && (
                        <div className="flex gap-2 mt-3">
                            <Button
                                size="sm"
                                onClick={() => handleAcceptInvitation(invitation)}
                                disabled={processingInvitation === invitation.id}
                            >
                                {t("invitations.accept")}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeclineInvitation(invitation)}
                                disabled={processingInvitation === invitation.id}
                            >
                                {t("invitations.decline")}
                            </Button>
                        </div>
                    )}
                </div>
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
                                : tab.key === "invitations"
                                ? invitations.length
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
                        {activeTab === "invitations" ? (
                            invitations.length === 0 ? (
                                renderEmptyState()
                            ) : (
                                <div className="space-y-4">
                                    {invitations.map(renderInvitationCard)}
                                </div>
                            )
                        ) : filtered.length === 0 ? (
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
