import { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
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
import DocumentManager from "../../components/DocumentManager";
import MilestoneTimeline from "../../components/MilestoneTimeline";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import { getBuilding, updateBuilding, listBuildingFlats, createFlat, updateFlat, initFlatCustomizationConfig, getBuildingDocuments } from "../../lib/firestore";
import { uploadBuildingCover, uploadFloorPlan } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, Building, Flat, BuildingStatus, ConstructionPhase, FlatStatus, AreaUnit } from "@gemmaham/shared";
import { Link } from "react-router";
import { Plus, X } from "lucide-react";
import { PageTransition } from "../../components/ui/PageTransition";

type Tab = "details" | "units" | "updates" | "contractors" | "customizations" | "applications" | "documents";

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
    const [docCount, setDocCount] = useState(0);

    const [showAddUnit, setShowAddUnit] = useState(false);
    const [addingUnit, setAddingUnit] = useState(false);
    const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
    const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(null);
    const [unitForm, setUnitForm] = useState({
        title: "", description: "", address: "", price: "", currency: "EUR",
        bedrooms: "", bathrooms: "", area: "", areaUnit: "sqm" as AreaUnit,
        status: "available" as FlatStatus, featured: false, unitNumber: "",
    });
    const updateUnitField = (field: string, value: string | boolean) =>
        setUnitForm((prev) => ({ ...prev, [field]: value }));

    const handleAddUnit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.companyId || !id || !floorPlanFile) return;
        setAddingUnit(true);
        try {
            const flatId = await createFlat({
                companyId: auth.companyId,
                buildingId: id,
                unitNumber: unitForm.unitNumber || null,
                title: unitForm.title,
                description: unitForm.description,
                address: unitForm.address || building?.address || "",
                price: Number(unitForm.price),
                currency: unitForm.currency,
                bedrooms: Number(unitForm.bedrooms),
                bathrooms: Number(unitForm.bathrooms),
                area: Number(unitForm.area),
                areaUnit: unitForm.areaUnit,
                floorPlanUrl: "",
                renderedImageUrl: null,
                status: unitForm.status,
                featured: unitForm.featured,
            });
            const floorPlanUrl = await uploadFloorPlan(auth.companyId, flatId, floorPlanFile);
            await updateFlat(flatId, { floorPlanUrl });
            try { await initFlatCustomizationConfig(flatId, id); } catch {}
            const updated = await listBuildingFlats(id);
            setFlats(updated);
            setShowAddUnit(false);
            setUnitForm({ title: "", description: "", address: "", price: "", currency: "EUR", bedrooms: "", bathrooms: "", area: "", areaUnit: "sqm", status: "available", featured: false, unitNumber: "" });
            setFloorPlanFile(null);
            setFloorPlanPreview(null);
            addToast("success", t("toast.flatCreated"));
        } catch (e) {
            console.error("Failed to create unit:", e);
            addToast("error", t("toast.flatCreatedFailed"));
        } finally {
            setAddingUnit(false);
        }
    };

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
                const docs = await getBuildingDocuments(id);
                setDocCount(docs.length);
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
        { key: "documents", label: `${t("documents.title")}${docCount > 0 ? ` (${docCount})` : ""}` },
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
                <PageTransition>
                <div className="home">
                    <div className="flex">
                        <main className="flex-1 p-6 max-w-4xl space-y-4">
                            <SkeletonLine className="w-48 h-8" />
                            <SkeletonBlock className="h-48 rounded-lg" />
                            <SkeletonLine className="w-full h-10" />
                            <SkeletonLine className="w-full h-10" />
                        </main>
                    </div>
                </div>
            </PageTransition>
            </RoleGuard>
        );
    }

    if (!building) {
        return (
            <RoleGuard allowedRole="company">
                <div className="home">
                    <div className="flex">
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
                <div className="flex">
                    <main className="flex-1 p-6 max-w-4xl">
                        <h1 className="text-2xl font-bold mb-6">{t("buildings.editBuilding")}</h1>

                        {/* Tabs */}
                        <div className="flex gap-1 mb-6 border-b-2 border-foreground/6">
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
                                    <div className="relative rounded-lg overflow-hidden border border-foreground/6">
                                        {building.coverImageUrl ? (
                                            <img loading="lazy" src={building.coverImageUrl} alt={building.title} className="w-full h-48 object-cover" />
                                        ) : (
                                            <div className="w-full h-48 bg-foreground/5 flex items-center justify-center">
                                                <span className="text-foreground/30 text-4xl">🏗</span>
                                            </div>
                                        )}
                                        <label className="absolute bottom-2 right-2 px-3 py-1.5 bg-background/90 rounded-lg text-xs font-medium cursor-pointer hover:bg-background transition-colors border border-foreground/6">
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
                                    {!showAddUnit && (
                                        <Button size="sm" onClick={() => setShowAddUnit(true)}>
                                            <Plus size={16} className="mr-1" /> {t("buildings.addUnit")}
                                        </Button>
                                    )}
                                </div>

                                {/* Inline Add Unit Form */}
                                {showAddUnit && (
                                    <div className="mb-6 bg-surface border border-foreground/6 rounded-2xl p-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-semibold text-base">{t("buildings.addUnit")}</h3>
                                            <button onClick={() => { setShowAddUnit(false); setFloorPlanFile(null); setFloorPlanPreview(null); }} className="text-foreground/40 hover:text-foreground transition-colors">
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <form onSubmit={handleAddUnit} className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input label={t("company.title")} value={unitForm.title} onChange={(e) => updateUnitField("title", e.target.value)} required />
                                                <Input label={t("buildings.unitNumber")} placeholder="A-301" value={unitForm.unitNumber} onChange={(e) => updateUnitField("unitNumber", e.target.value)} />
                                            </div>
                                            <Textarea label={t("company.descLabel")} value={unitForm.description} onChange={(e) => updateUnitField("description", e.target.value)} />
                                            <Input label={t("company.address")} value={unitForm.address} placeholder={building?.address} onChange={(e) => updateUnitField("address", e.target.value)} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <Input label={t("company.price")} type="number" placeholder="250000" value={unitForm.price} onChange={(e) => updateUnitField("price", e.target.value)} required />
                                                <Select label={t("company.currency")} value={unitForm.currency} onChange={(e) => updateUnitField("currency", e.target.value)} options={[{ value: "USD", label: "USD" }, { value: "EUR", label: "EUR" }, { value: "GBP", label: "GBP" }, { value: "BAM", label: "BAM" }]} />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <Input label={t("company.bedrooms")} type="number" placeholder="2" value={unitForm.bedrooms} onChange={(e) => updateUnitField("bedrooms", e.target.value)} required min="0" />
                                                <Input label={t("company.bathrooms")} type="number" placeholder="1" value={unitForm.bathrooms} onChange={(e) => updateUnitField("bathrooms", e.target.value)} required min="0" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Input label={t("company.area")} type="number" placeholder="75" value={unitForm.area} onChange={(e) => updateUnitField("area", e.target.value)} required min="0" />
                                                    <Select label={t("company.unit")} value={unitForm.areaUnit} onChange={(e) => updateUnitField("areaUnit", e.target.value)} options={[{ value: "sqm", label: "sqm" }, { value: "sqft", label: "sqft" }]} />
                                                </div>
                                            </div>
                                            <Select label={t("company.statusLabel")} value={unitForm.status} onChange={(e) => updateUnitField("status", e.target.value)} options={[{ value: "available", label: t("filters.available") }, { value: "reserved", label: t("filters.reserved") }, { value: "sold", label: t("filters.sold") }]} />
                                            <div>
                                                <label className="block text-sm font-medium mb-1">{t("company.floorPlanImage")} *</label>
                                                <div className="border-2 border-dashed border-foreground/20 rounded-xl p-4 text-center relative">
                                                    {floorPlanPreview ? (
                                                        <div className="space-y-2">
                                                            <img loading="lazy" src={floorPlanPreview} alt="Preview" className="max-h-36 mx-auto rounded-lg" />
                                                            <p className="text-xs text-foreground/50">{floorPlanFile?.name}</p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-foreground/40 text-sm">{t("company.clickOrDrag")}</p>
                                                    )}
                                                    <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setFloorPlanFile(f); setFloorPlanPreview(URL.createObjectURL(f)); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                                                </div>
                                            </div>
                                            <div className="flex gap-3 pt-2">
                                                <Button type="submit" disabled={addingUnit || !floorPlanFile}>
                                                    {addingUnit ? t("company.creating") : t("company.createFlat")}
                                                </Button>
                                                <Button type="button" variant="ghost" onClick={() => { setShowAddUnit(false); setFloorPlanFile(null); setFloorPlanPreview(null); }}>
                                                    {t("common.cancel")}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {flats.length === 0 && !showAddUnit ? (
                                    <div className="text-center py-8">
                                        <p className="text-foreground/40 mb-3">{t("buildings.noUnits")}</p>
                                        <Button size="sm" onClick={() => setShowAddUnit(true)}>{t("buildings.addFirstUnit")}</Button>
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
                                                    className="block bg-surface rounded-2xl border border-foreground/6 overflow-hidden hover:border-primary/30 transition-colors"
                                                >
                                                    {/* Image */}
                                                    {flat.renderedImageUrl || flat.floorPlanUrl ? (
                                                        <div className="relative">
                                                            <img loading="lazy"
                                                                src={flat.renderedImageUrl || flat.floorPlanUrl}
                                                                alt={flat.title}
                                                                className="w-full h-40 object-cover"
                                                            />
                                                            <div className="absolute top-2 left-2 flex gap-1">
                                                                {flat.unitNumber && (
                                                                    <span className="text-xs font-mono bg-black/60 text-white px-2 py-0.5 rounded">{flat.unitNumber}</span>
                                                                )}
                                                                {flat.renderedImageUrl && (
                                                                    <span className="text-xs bg-green-500/90 text-white px-2 py-0.5 rounded font-medium">3D</span>
                                                                )}
                                                            </div>
                                                            <div className="absolute top-2 right-2">
                                                                <Badge variant={flat.status}>{t(`filters.${flat.status}`)}</Badge>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-40 bg-foreground/5 flex items-center justify-center relative">
                                                            <span className="text-4xl">🏠</span>
                                                            <div className="absolute top-2 right-2">
                                                                <Badge variant={flat.status}>{t(`filters.${flat.status}`)}</Badge>
                                                            </div>
                                                            {flat.unitNumber && (
                                                                <span className="absolute top-2 left-2 text-xs font-mono bg-foreground/10 px-2 py-0.5 rounded">{flat.unitNumber}</span>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="p-4">
                                                        <h3 className="font-bold truncate mb-2">{flat.title}</h3>

                                                        <div className="flex items-center gap-4 text-sm text-foreground/50 mb-3">
                                                            <span>{flat.bedrooms} {t("flats.beds")}</span>
                                                            <span>·</span>
                                                            <span>{flat.bathrooms} {t("flats.baths")}</span>
                                                            <span>·</span>
                                                            <span>{flat.area} {flat.areaUnit}</span>
                                                        </div>

                                                        <span className="text-primary font-bold text-lg">
                                                            {flat.currency} {flat.price.toLocaleString()}
                                                        </span>
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
                            <div className="space-y-8">
                                <MilestoneTimeline buildingId={id} currentPhase={building.currentPhase} />
                                <div className="border-t border-foreground/6 pt-6">
                                    <ConstructionTimeline buildingId={id} companyId={auth.companyId || ""} />
                                </div>
                            </div>
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

                        {/* Tab: Documents */}
                        {activeTab === "documents" && id && (
                            <DocumentManager buildingId={id} companyId={auth.companyId || ""} />
                        )}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
