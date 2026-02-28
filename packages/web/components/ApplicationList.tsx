import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";
import ApplicationCard from "./ApplicationCard";
import { SkeletonBlock } from "./ui/Skeleton";
import { getApplicationsForBuilding, acceptApplicationAndAssign, updateApplicationStatus } from "../lib/firestore";
import { useToast } from "../lib/contexts/ToastContext";
import type { ContractorApplication, ApplicationStatus } from "@gemmaham/shared";

interface Props {
    buildingId: string;
}

type FilterTab = "all" | "pending" | "accepted" | "rejected";

export default function ApplicationList({ buildingId }: Props) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [applications, setApplications] = useState<ContractorApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterTab>("all");

    const load = async () => {
        try {
            const statusFilter: ApplicationStatus | undefined = filter === "all" ? undefined : filter as ApplicationStatus;
            const result = await getApplicationsForBuilding(buildingId, statusFilter);
            setApplications(result);
        } catch (e) {
            console.error("Failed to load applications:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        load();
    }, [buildingId, filter]);

    const handleAccept = async (application: ContractorApplication) => {
        try {
            await acceptApplicationAndAssign(application);
            addToast("success", t("applications.acceptSuccess"));
            load();
        } catch (e) {
            console.error("Failed to accept application:", e);
            addToast("error", t("applications.acceptFailed"));
        }
    };

    const handleReject = async (application: ContractorApplication, notes: string) => {
        try {
            await updateApplicationStatus(application.id, "rejected", notes);
            addToast("success", t("applications.rejectSuccess"));
            load();
        } catch (e) {
            console.error("Failed to reject application:", e);
            addToast("error", t("applications.rejectFailed"));
        }
    };

    const filterTabs: { key: FilterTab; label: string }[] = [
        { key: "all", label: t("applications.filterAll") },
        { key: "pending", label: t("applications.filterPending") },
        { key: "accepted", label: t("applications.filterAccepted") },
        { key: "rejected", label: t("applications.filterRejected") },
    ];

    const pendingCount = applications.filter((a) => a.status === "pending").length;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-foreground/50">
                    {applications.length} {t("applications.total")}
                    {pendingCount > 0 && filter === "all" && (
                        <span className="ml-2 text-primary font-medium">({pendingCount} {t("applications.pendingCount")})</span>
                    )}
                </p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 mb-4 border-b border-foreground/10">
                {filterTabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-3 py-2 text-sm font-medium transition-colors relative ${
                            filter === tab.key
                                ? "text-primary"
                                : "text-foreground/50 hover:text-foreground"
                        }`}
                    >
                        {tab.label}
                        {filter === tab.key && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <SkeletonBlock key={i} className="h-40 rounded-xl" />
                    ))}
                </div>
            ) : applications.length === 0 ? (
                <div className="text-center py-8">
                    <FileText size={32} className="mx-auto text-foreground/20 mb-2" />
                    <p className="text-foreground/40">{t("applications.noApplications")}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => (
                        <ApplicationCard
                            key={app.id}
                            application={app}
                            onAccept={handleAccept}
                            onReject={handleReject}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
