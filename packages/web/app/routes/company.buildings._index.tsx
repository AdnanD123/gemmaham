import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Navbar from "../../components/Navbar";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import ReservationListSkeleton from "../../components/skeletons/ReservationSkeleton";
import { listCompanyBuildings, deleteBuilding } from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, Building } from "@gemmaham/shared";

export default function CompanyBuildingsList() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (!auth.companyId) {
            setLoading(false);
            return;
        }
        (async () => {
            try {
                const results = await listCompanyBuildings(auth.companyId!);
                setBuildings(results);
            } catch (e) {
                console.error("Failed to load buildings:", e);
                setBuildings([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.companyId]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteBuilding(deleteTarget);
            setBuildings((prev) => prev.filter((b) => b.id !== deleteTarget));
            addToast("success", t("toast.buildingDeleted"));
        } catch (e) {
            console.error("Failed to delete building:", e);
            addToast("error", t("toast.buildingDeleteFailed"));
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const getProgressWidth = (status: string) => {
        switch (status) {
            case "completed": return "100%";
            case "near_completion": return "85%";
            case "under_construction": return "50%";
            default: return "10%";
        }
    };

    return (
        <RoleGuard allowedRole="company">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <main className="flex-1 p-6 max-w-6xl">
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-2xl font-bold">{t("buildings.myBuildings")}</h1>
                            <Link to="/company/buildings/new">
                                <Button size="sm"><Plus size={16} className="mr-1" /> {t("buildings.addBuilding")}</Button>
                            </Link>
                        </div>

                        {loading ? (
                            <ReservationListSkeleton />
                        ) : buildings.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-foreground/40 mb-4">{t("buildings.noBuildings")}</p>
                                <Link to="/company/buildings/new">
                                    <Button>{t("buildings.addFirstBuilding")}</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {buildings.map((building) => (
                                    <div
                                        key={building.id}
                                        className="bg-surface rounded-xl border-2 border-foreground/10 overflow-hidden hover:border-primary/30 transition-colors"
                                    >
                                        <Link to={`/company/buildings/${building.id}`}>
                                            {building.coverImageUrl ? (
                                                <img
                                                    src={building.coverImageUrl}
                                                    alt={building.title}
                                                    className="w-full h-48 object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-48 bg-foreground/5 flex items-center justify-center">
                                                    <span className="text-4xl">🏗</span>
                                                </div>
                                            )}
                                        </Link>
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Link
                                                    to={`/company/buildings/${building.id}`}
                                                    className="font-bold truncate hover:text-primary transition-colors"
                                                >
                                                    {building.title}
                                                </Link>
                                                <Badge variant={building.status}>
                                                    {t(`buildings.status.${building.status}`)}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-foreground/50 truncate">{building.address}</p>

                                            {/* Progress bar */}
                                            <div className="mt-3">
                                                <div className="flex items-center justify-between text-xs text-foreground/50 mb-1">
                                                    <span>{t(`buildings.phase.${building.currentPhase}`)}</span>
                                                    <span>
                                                        {building.availableUnits}/{building.totalUnits}{" "}
                                                        {t("buildings.unitsAvailable")}
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all"
                                                        style={{ width: getProgressWidth(building.status) }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between mt-3">
                                                <div className="flex items-center gap-3 text-xs text-foreground/40">
                                                    <span>{building.floors} {t("buildings.floorsLabel")}</span>
                                                    <span>·</span>
                                                    <span>{t("buildings.est")}: {building.estimatedCompletion}</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Link to={`/company/buildings/${building.id}`}>
                                                        <Button size="sm" variant="ghost">
                                                            <Pencil size={14} />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => setDeleteTarget(building.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title={t("buildings.deleteBuildingTitle")}
                message={t("buildings.deleteBuildingMsg")}
                confirmLabel={t("common.delete")}
                loading={deleting}
            />
        </RoleGuard>
    );
}
