import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import BuildingCard from "../../components/BuildingCard";
import { FlatGridSkeleton } from "../../components/skeletons/FlatCardSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { PageTransition } from "../../components/ui/PageTransition";
import { listBuildings } from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { Building, BuildingStatus } from "@gemmaham/shared";

export default function BuildingsBrowse() {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<BuildingStatus | "">("");

    useEffect(() => {
        (async () => {
            try {
                const filters = statusFilter ? { status: statusFilter as BuildingStatus } : {};
                const { items } = await listBuildings(filters);
                setBuildings(items);
            } catch (e) {
                console.error("Failed to load buildings:", e);
                setBuildings([]);
                addToast("error", t("errors.loadFailed"));
            } finally {
                setLoading(false);
            }
        })();
    }, [statusFilter]);

    const statusOptions: { value: string; label: string }[] = [
        { value: "", label: t("filters.all") },
        { value: "planning", label: t("buildings.status.planning") },
        { value: "under_construction", label: t("buildings.status.under_construction") },
        { value: "near_completion", label: t("buildings.status.near_completion") },
        { value: "completed", label: t("buildings.status.completed") },
    ];

    return (
        <div className="home">
            <PageTransition className="max-w-7xl mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">{t("buildings.browseTitle")}</h1>
                    <div className="flex gap-2">
                        {statusOptions.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => { setLoading(true); setStatusFilter(opt.value as BuildingStatus | ""); }}
                                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    statusFilter === opt.value
                                        ? "bg-primary text-white"
                                        : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <ContentLoader loading={loading} skeleton={<FlatGridSkeleton />}>
                    {buildings.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-foreground/40">{t("buildings.noResults")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {buildings.map((b) => (
                                <BuildingCard key={b.id} building={b} />
                            ))}
                        </div>
                    )}
                </ContentLoader>
            </PageTransition>
        </div>
    );
}
