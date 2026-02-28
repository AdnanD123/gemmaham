import { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import CompanySidebar from "../../components/CompanySidebar";
import RoleGuard from "../../components/RoleGuard";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Badge from "../../components/ui/Badge";
import ConstructionTimeline from "../../components/ConstructionTimeline";
import ContractorList from "../../components/ContractorList";
import CustomizationManager from "../../components/CustomizationManager";
import ApplicationList from "../../components/ApplicationList";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import { getBuilding, updateBuilding, listBuildingFlats } from "../../lib/firestore";
import { uploadBuildingCover } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, Building, Flat, BuildingStatus, ConstructionPhase } from "@gemmaham/shared";
import { Link } from "react-router";
import { Plus } from "lucide-react";

type Tab = "details" | "units" | "updates" | "contractors" | "customizations" | "applications";

export default function CompanyBuildingDetail() {
    const { t } = useTranslation();
    const { id } = useParams();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [building, setBuilding] = useState<Building | null>(null);
    const [flats, setFlats] = useState<Flat[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>("details");
    const { addToast } = useToast();

    const [form, setForm] = useState({
        title: "",
        description: "",
        address: "",
        totalUnits: "",
        availableUnits: "",
        floors: "",
        status: "planning" as BuildingStatus,
        currentPhase: "foundation" as ConstructionPhase,
        estimatedCompletion: "",
        startDate: "",
        featured: false,
    });

    const populateForm = (b: Building) => {
        setForm({
            title: b.title,
            description: b.description,
            address: b.address,
            totalUnits: String(b.totalUnits),
            availableUnits: String(b.availableUnits),
            floors: String(b.floors),
            status: b.status,
            currentPhase: b.currentPhase,
            estimatedCompletion: b.estimatedCompletion,
            startDate: b.startDate,
            featured: b.featured,
        });
    };

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const b = await getBuilding(id);
                if (b) {
                    setBuilding(b);
                    populateForm(b);
                }
                const f = await listBuildingFlats(id);
                setFlats(f);
            } catch (e) {
                console.error("Failed to load building:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const updateField = (field: string, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setSubmitting(true);
        try {
            await updateBuilding(id, {
                title: form.title,
                description: form.description,
                address: form.address,
                totalUnits: Number(form.totalUnits),
                availableUnits: Number(form.availableUnits),
                floors: Number(form.floors),
                status: form.status,
                currentPhase: form.currentPhase,
                estimatedCompletion: form.estimatedCompletion,
                startDate: form.startDate,
                featured: form.featured,
            });
            addToast("success", t("toast.buildingUpdated"));
        } catch (e) {
            console.error("Failed to update building:", e);
            addToast("error", t("toast.buildingUpdateFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id || !auth.companyId) return;
        try {
            const url = await uploadBuildingCover(auth.companyId, id, file);
            await updateBuilding(id, { coverImageUrl: url });
            setBuilding((prev) => prev ? { ...prev, coverImageUrl: url } : prev);
            addToast("success", t("toast.coverUpdated"));
        } catch (e) {
            console.error("Failed to upload cover:", e);
            addToast("error", t("toast.coverUpdateFailed"));
        }
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: "details", label: t("buildings.tabDetails") },
        { key: "units", label: t("buildings.tabUnits") },
        { key: "updates", label: t("buildings.tabUpdates") },
        { key: "contractors", label: t("buildings.tabContractors") },
        { key: "applications", label: t("buildings.tabApplications") },
        { key: "customizations", label: t("buildings.tabCustomizations") },
    ];

    const statusOptions = [
        { value: "planning", label: t("buildings.status.planning") },
        { value: "under_construction", label: t("buildings.status.under_construction") },
        { value: "near_completion", label: t("buildings.status.near_completion") },
        { value: "completed", label: t("buildings.status.completed") },
    ];

    const phaseOptions = [
        { value: "foundation", label: t("buildings.phase.foundation") },
        { value: "structure", label: t("buildings.phase.structure") },
        { value: "facade", label: t("buildings.phase.facade") },
        { value: "interior", label: t("buildings.phase.interior") },
        { value: "finishing", label: t("buildings.phase.finishing") },
        { value: "handover", label: t("buildings.phase.handover") },
    ];

    if (loading) {
        return (
            <RoleGuard allowedRole="company">
                <div className="home">
                    <Navbar />
                    <div className="flex">
                        <CompanySidebar />
                        <main className="flex-1 p-6 max-w-4xl space-y-4">
                            <SkeletonLine className="w-48 h-8" />
                            <SkeletonBlock className="h-48 rounded-lg" />
                            <SkeletonLine className="w-full h-10" />
                            <SkeletonLine className="w-full h-10" />
                        </main>
                    </div>
                </div>
            </RoleGuard>
        );
    }

    if (!building) {
        return (
            <RoleGuard allowedRole="company">
                <div className="home">
                    <Navbar />
                    <div className="flex">
                        <CompanySidebar />
                        <main className="flex-1 p-6 text-center">
                            <p className="text-foreground/50">{t("buildings.notFound")}</p>
                        </main>
                    </div>
                </div>
            </RoleGuard>
        );
    }

    return (
        <RoleGuard allowedRole="company">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <CompanySidebar />
                    <main className="flex-1 p-6 max-w-4xl">
                        <h1 className="text-2xl font-bold mb-6">{t("buildings.editBuilding")}</h1>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-6 border-b-2 border-foreground/10">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
                                        activeTab === tab.key
                                            ? "text-primary"
                                            : "text-foreground/50 hover:text-foreground"
                                    }`}
                                >
                                    {tab.label}
                                    {activeTab === tab.key && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Tab: Details */}
                        {activeTab === "details" && (
                            <div>
                                {/* Cover image */}
                                <div className="mb-6">
                                    <div className="relative rounded-lg overflow-hidden border-2 border-foreground/10">
                                        {building.coverImageUrl ? (
                                            <img src={building.coverImageUrl} alt={building.title} className="w-full h-48 object-cover" />
                                        ) : (
                                            <div className="w-full h-48 bg-foreground/5 flex items-center justify-center">
                                                <span className="text-foreground/30 text-4xl">🏗</span>
                                            </div>
                                        )}
                                        <label className="absolute bottom-2 right-2 px-3 py-1.5 bg-background/90 rounded-lg text-xs font-medium cursor-pointer hover:bg-background transition-colors border border-foreground/10">
                                            {t("buildings.changeCover")}
                                            <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                                        </label>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <Input label={t("buildings.title")} value={form.title} onChange={(e) => updateField("title", e.target.value)} required />
                                    <Textarea label={t("buildings.description")} value={form.description} onChange={(e) => updateField("description", e.target.value)} />
                                    <Input label={t("buildings.address")} value={form.address} onChange={(e) => updateField("address", e.target.value)} required />

                                    <div className="grid grid-cols-3 gap-4">
                                        <Input label={t("buildings.totalUnits")} type="number" value={form.totalUnits} onChange={(e) => updateField("totalUnits", e.target.value)} required min="1" />
                                        <Input label={t("buildings.availableUnits")} type="number" value={form.availableUnits} onChange={(e) => updateField("availableUnits", e.target.value)} required min="0" />
                                        <Input label={t("buildings.floors")} type="number" value={form.floors} onChange={(e) => updateField("floors", e.target.value)} required min="1" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Select label={t("buildings.statusLabel")} value={form.status} onChange={(e) => updateField("status", e.target.value)} options={statusOptions} />
                                        <Select label={t("buildings.currentPhase")} value={form.currentPhase} onChange={(e) => updateField("currentPhase", e.target.value)} options={phaseOptions} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium">{t("buildings.startDate")}</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Select
                                                    value={form.startDate.split("-")[0] || ""}
                                                    onChange={(e) => {
                                                        const month = form.startDate.split("-")[1] || "01";
                                                        updateField("startDate", `${e.target.value}-${month}`);
                                                    }}
                                                    options={[
                                                        { value: "", label: t("buildings.year") },
                                                        ...Array.from({ length: 10 }, (_, i) => {
                                                            const y = String(new Date().getFullYear() + i);
                                                            return { value: y, label: y };
                                                        }),
                                                    ]}
                                                    required
                                                />
                                                <Select
                                                    value={form.startDate.split("-")[1] || ""}
                                                    onChange={(e) => {
                                                        const year = form.startDate.split("-")[0] || String(new Date().getFullYear());
                                                        updateField("startDate", `${year}-${e.target.value}`);
                                                    }}
                                                    options={[
                                                        { value: "", label: t("buildings.month") },
                                                        ...Array.from({ length: 12 }, (_, i) => {
                                                            const m = String(i + 1).padStart(2, "0");
                                                            return { value: m, label: new Date(2000, i).toLocaleString(undefined, { month: "long" }) };
                                                        }),
                                                    ]}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="block text-sm font-medium">{t("buildings.estimatedCompletion")}</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Select
                                                    value={form.estimatedCompletion.split("-")[0] || ""}
                                                    onChange={(e) => {
                                                        const month = form.estimatedCompletion.split("-")[1] || "01";
                                                        updateField("estimatedCompletion", `${e.target.value}-${month}`);
                                                    }}
                                                    options={[
                                                        { value: "", label: t("buildings.year") },
                                                        ...Array.from({ length: 10 }, (_, i) => {
                                                            const y = String(new Date().getFullYear() + i);
                                                            return { value: y, label: y };
                                                        }),
                                                    ]}
                                                    required
                                                />
                                                <Select
                                                    value={form.estimatedCompletion.split("-")[1] || ""}
                                                    onChange={(e) => {
                                                        const year = form.estimatedCompletion.split("-")[0] || String(new Date().getFullYear());
                                                        updateField("estimatedCompletion", `${year}-${e.target.value}`);
                                                    }}
                                                    options={[
                                                        { value: "", label: t("buildings.month") },
                                                        ...Array.from({ length: 12 }, (_, i) => {
                                                            const m = String(i + 1).padStart(2, "0");
                                                            return { value: m, label: new Date(2000, i).toLocaleString(undefined, { month: "long" }) };
                                                        }),
                                                    ]}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={form.featured} onChange={(e) => updateField("featured", e.target.checked)} className="w-4 h-4" />
                                        <span className="text-sm">{t("buildings.featured")}</span>
                                    </label>

                                    <div className="flex gap-3 pt-4">
                                        <Button type="submit" disabled={submitting}>
                                            {submitting ? t("buildings.saving") : t("buildings.saveChanges")}
                                        </Button>
                                        <Button type="button" variant="ghost" onClick={() => navigate("/company/buildings")}>
                                            {t("common.cancel")}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Tab: Units */}
                        {activeTab === "units" && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm text-foreground/50">
                                        {flats.length} {t("buildings.unitsInBuilding")}
                                    </p>
                                    <Link to={`/company/flats/new?buildingId=${id}`}>
                                        <Button size="sm"><Plus size={16} className="mr-1" /> {t("buildings.addUnit")}</Button>
                                    </Link>
                                </div>
                                {flats.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-foreground/40 mb-3">{t("buildings.noUnits")}</p>
                                        <Link to={`/company/flats/new?buildingId=${id}`}>
                                            <Button size="sm">{t("buildings.addFirstUnit")}</Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {flats.map((flat) => {
                                            const statusColor = flat.status === "available"
                                                ? "bg-green-500" : flat.status === "reserved"
                                                ? "bg-yellow-500" : "bg-red-500";
                                            return (
                                                <Link
                                                    key={flat.id}
                                                    to={`/company/flats/${flat.id}`}
                                                    className="block bg-surface rounded-xl border-2 border-foreground/10 overflow-hidden hover:border-primary/30 transition-colors"
                                                >
                                                    {/* Status indicator bar */}
                                                    <div className={`h-1 ${statusColor}`} />
                                                    <div className="p-4">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2 min-w-0">
                                                                {flat.unitNumber && (
                                                                    <span className="text-xs font-mono bg-foreground/10 px-2 py-0.5 rounded shrink-0">{flat.unitNumber}</span>
                                                                )}
                                                                <h3 className="font-bold truncate">{flat.title}</h3>
                                                            </div>
                                                            <Badge variant={flat.status}>{t(`filters.${flat.status}`)}</Badge>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-sm text-foreground/50 mb-3">
                                                            <span>{flat.bedrooms} {t("flats.beds")}</span>
                                                            <span>·</span>
                                                            <span>{flat.bathrooms} {t("flats.baths")}</span>
                                                            <span>·</span>
                                                            <span>{flat.area} {flat.areaUnit}</span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-primary font-bold text-lg">
                                                                {flat.currency} {flat.price.toLocaleString()}
                                                            </span>
                                                            {flat.renderedImageUrl && (
                                                                <span className="text-xs text-green-600 font-medium">3D Ready</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tab: Updates */}
                        {activeTab === "updates" && id && (
                            <ConstructionTimeline buildingId={id} companyId={auth.companyId || ""} />
                        )}

                        {/* Tab: Contractors */}
                        {activeTab === "contractors" && id && (
                            <ContractorList buildingId={id} companyId={auth.companyId || ""} />
                        )}

                        {/* Tab: Applications */}
                        {activeTab === "applications" && id && (
                            <ApplicationList buildingId={id} />
                        )}

                        {/* Tab: Customizations */}
                        {activeTab === "customizations" && id && (
                            <CustomizationManager buildingId={id} flats={flats} />
                        )}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
