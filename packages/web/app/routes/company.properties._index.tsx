import { useState, useEffect } from "react";
import { useOutletContext, Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Edit, Building2 } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { listCompanyBuildings, listCompanyHouses, deleteBuilding, deleteHouse } from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, Building, House } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

export default function CompanyProperties() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { addToast } = useToast();
    const [tab, setTab] = useState<"buildings" | "houses">("buildings");
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [houses, setHouses] = useState<House[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<{ type: "building" | "house"; id: string } | null>(null);

    useEffect(() => {
        if (!auth.companyId) return;
        (async () => {
            try {
                const [b, h] = await Promise.all([
                    listCompanyBuildings(auth.companyId!),
                    listCompanyHouses(auth.companyId!),
                ]);
                setBuildings(b);
                setHouses(h);
            } catch (err) {
                console.error("Failed to load properties:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.companyId]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            if (deleteTarget.type === "building") {
                await deleteBuilding(deleteTarget.id);
                setBuildings((prev) => prev.filter((b) => b.id !== deleteTarget.id));
            } else {
                await deleteHouse(deleteTarget.id);
                setHouses((prev) => prev.filter((h) => h.id !== deleteTarget.id));
            }
            addToast("success", t("toast.propertyDeleted"));
        } catch (err) {
            addToast("error", t("toast.propertyDeleteFailed"));
        }
        setDeleteTarget(null);
    };

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
            <div className="home">
            <div className="flex">
                <main className="flex-1 p-6 max-w-5xl">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="font-serif text-2xl font-bold">{t("nav.properties")}</h1>
                        <div className="flex gap-2">
                            <Link to="/company/buildings/new">
                                <Button size="sm"><Plus size={16} className="mr-1" /> {t("buildings.building")}</Button>
                            </Link>
                            <Link to="/company/properties/houses/new">
                                <Button size="sm" variant="secondary"><Plus size={16} className="mr-1" /> {t("properties.houses")}</Button>
                            </Link>
                        </div>
                    </div>

                    {/* Tab toggle */}
                    <div className="flex gap-2 mb-6">
                        <button
                            onClick={() => setTab("buildings")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "buildings" ? "bg-primary text-white" : "bg-foreground/5 text-foreground/60"}`}
                        >
                            {t("buildings.title")} ({buildings.length})
                        </button>
                        <button
                            onClick={() => setTab("houses")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "houses" ? "bg-primary text-white" : "bg-foreground/5 text-foreground/60"}`}
                        >
                            {t("properties.houses")} ({houses.length})
                        </button>
                    </div>

                    <ContentLoader loading={loading} skeleton={
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-foreground/5 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    }>
                    {tab === "buildings" ? (
                        buildings.length === 0 ? (
                            <div className="text-center py-12">
                                <Building2 size={32} className="mx-auto text-foreground/20 mb-3" />
                                <p className="text-foreground/50">{t("buildings.noBuildings")}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {buildings.map((building) => (
                                    <div key={building.id} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-foreground/6">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="min-w-0">
                                                <h3 className="font-medium truncate">{building.title}</h3>
                                                <p className="text-sm text-foreground/50">
                                                    {building.totalUnits} {t("buildings.units")} · {t(`buildings.phase.${building.currentPhase}`)}
                                                </p>
                                            </div>
                                            <Badge variant={building.status}>{t(`buildings.status.${building.status}`)}</Badge>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Link to={`/company/buildings/${building.id}`}>
                                                <Button size="sm" variant="ghost"><Edit size={14} /></Button>
                                            </Link>
                                            <Button size="sm" variant="ghost" onClick={() => setDeleteTarget({ type: "building", id: building.id })}>
                                                <Trash2 size={14} className="text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        houses.length === 0 ? (
                            <p className="text-foreground/50 text-center py-8">{t("houses.noResults")}</p>
                        ) : (
                            <div className="space-y-3">
                                {houses.map((house) => (
                                    <div key={house.id} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-foreground/6">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="min-w-0">
                                                <h3 className="font-medium truncate">{house.title}</h3>
                                                <p className="text-sm text-foreground/50">{house.currency} {house.price.toLocaleString()}</p>
                                            </div>
                                            <Badge variant={house.status}>{house.status}</Badge>
                                            <Badge variant={house.houseType as any}>{house.houseType.replace("_", " ")}</Badge>
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            <Link to={`/company/properties/houses/${house.id}`}>
                                                <Button size="sm" variant="ghost"><Edit size={14} /></Button>
                                            </Link>
                                            <Button size="sm" variant="ghost" onClick={() => setDeleteTarget({ type: "house", id: house.id })}>
                                                <Trash2 size={14} className="text-red-500" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                    </ContentLoader>
                </main>
            </div>

            </div>

            {deleteTarget && (
                <ConfirmDialog
                    title={t("common.delete")}
                    message={t("common.deleteConfirm")}
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}
            </PageTransition>
        </RoleGuard>
    );
}
