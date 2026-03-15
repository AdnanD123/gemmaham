import { useState, useEffect } from "react";
import { useParams, useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import RoleGuard from "../../components/RoleGuard";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { getFlat, updateFlat } from "../../lib/firestore";
import { generate3DView } from "../../lib/ai.action";
import { useToast } from "../../lib/contexts/ToastContext";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import type { AuthContext, Flat, FlatStatus, AreaUnit } from "@gemmaham/shared";

export default function CompanyEditFlat() {
    const { t } = useTranslation();
    const { id } = useParams();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [flat, setFlat] = useState<Flat | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [generating, setGenerating] = useState(false);
    const { addToast } = useToast();

    const [form, setForm] = useState({
        title: "",
        description: "",
        address: "",
        price: "",
        currency: "USD",
        bedrooms: "",
        bathrooms: "",
        area: "",
        areaUnit: "sqm" as AreaUnit,
        status: "available" as FlatStatus,
        featured: false,
        buildingId: "" as string,
        unitNumber: "" as string,
    });

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                const f = await getFlat(id);
                if (f) {
                    setFlat(f);
                    setForm({
                        title: f.title,
                        description: f.description,
                        address: f.address,
                        price: String(f.price),
                        currency: f.currency,
                        bedrooms: String(f.bedrooms),
                        bathrooms: String(f.bathrooms),
                        area: String(f.area),
                        areaUnit: f.areaUnit,
                        status: f.status,
                        featured: f.featured,
                        buildingId: f.buildingId || "",
                        unitNumber: f.unitNumber || "",
                    });
                }
            } catch (e) {
                console.error("Failed to load flat:", e);
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
            await updateFlat(id, {
                title: form.title,
                description: form.description,
                address: form.address,
                price: Number(form.price),
                currency: form.currency,
                bedrooms: Number(form.bedrooms),
                bathrooms: Number(form.bathrooms),
                area: Number(form.area),
                areaUnit: form.areaUnit,
                status: form.status,
                featured: form.featured,
            });
            navigate(form.buildingId ? `/company/buildings/${form.buildingId}` : "/company/buildings");
        } catch (e) {
            console.error("Failed to update flat:", e);
            addToast("error", t("toast.flatUpdatedFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGenerate3D = async () => {
        if (!flat?.floorPlanUrl || !id) return;
        setGenerating(true);
        try {
            const result = await generate3DView({ flatId: id, imageUrl: flat.floorPlanUrl });
            if (result.renderedImageUrl) {
                setFlat((prev) => prev ? { ...prev, renderedImageUrl: result.renderedImageUrl } : prev);
                addToast("success", t("toast.3dSuccess"));
            }
        } catch (e) {
            console.error("Failed to generate 3D:", e);
            addToast("error", t("toast.3dFailed"));
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <RoleGuard allowedRole="company">
                <div className="home">
                    <Navbar />
                    <div className="flex">
                        <main className="flex-1 p-6 max-w-3xl space-y-4">
                            <SkeletonLine className="w-48 h-8" />
                            <div className="grid grid-cols-2 gap-4">
                                <SkeletonBlock className="h-48 rounded-lg" />
                                <SkeletonBlock className="h-48 rounded-lg" />
                            </div>
                            <SkeletonLine className="w-full h-10" />
                            <SkeletonLine className="w-full h-10" />
                            <SkeletonLine className="w-full h-10" />
                        </main>
                    </div>
                </div>
            </RoleGuard>
        );
    }

    if (!flat) {
        return (
            <RoleGuard allowedRole="company">
                <div className="home">
                    <Navbar />
                    <div className="flex">
                        <main className="flex-1 p-6 text-center">
                            <p className="text-foreground/50">{t("company.flatNotFound")}</p>
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
                    <main className="flex-1 p-6 max-w-3xl">
                        <h1 className="text-2xl font-bold mb-6">{t("company.editFlat")}</h1>

                        {/* Floor Plan & 3D Preview */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {flat.floorPlanUrl && (
                                <div className="rounded-lg overflow-hidden border-2 border-foreground/10">
                                    <p className="text-xs font-medium text-foreground/50 p-2 bg-surface">{t("flats.floorPlan")}</p>
                                    <img src={flat.floorPlanUrl} alt="Floor plan" className="w-full h-auto" />
                                </div>
                            )}
                            {flat.renderedImageUrl ? (
                                <div className="rounded-lg overflow-hidden border-2 border-foreground/10">
                                    <p className="text-xs font-medium text-foreground/50 p-2 bg-surface">{t("flats.render3d")}</p>
                                    <img src={flat.renderedImageUrl} alt="3D render" className="w-full h-auto" />
                                </div>
                            ) : flat.floorPlanUrl ? (
                                <div className="flex items-center justify-center border-2 border-dashed border-foreground/20 rounded-lg p-4">
                                    <Button onClick={handleGenerate3D} disabled={generating}>
                                        {generating ? t("company.generating") : t("company.generate3d")}
                                    </Button>
                                </div>
                            ) : null}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input label={t("company.title")} value={form.title} onChange={(e) => updateField("title", e.target.value)} required />
                            <Textarea label={t("company.descLabel")} value={form.description} onChange={(e) => updateField("description", e.target.value)} />
                            <Input label={t("company.address")} value={form.address} onChange={(e) => updateField("address", e.target.value)} required />

                            <div className="grid grid-cols-2 gap-4">
                                <Input label={t("company.price")} type="number" value={form.price} onChange={(e) => updateField("price", e.target.value)} required />
                                <Select
                                    label={t("company.currency")}
                                    value={form.currency}
                                    onChange={(e) => updateField("currency", e.target.value)}
                                    options={[
                                        { value: "USD", label: "USD" },
                                        { value: "EUR", label: "EUR" },
                                        { value: "GBP", label: "GBP" },
                                        { value: "BAM", label: "BAM" },
                                    ]}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <Input label={t("company.bedrooms")} type="number" value={form.bedrooms} onChange={(e) => updateField("bedrooms", e.target.value)} required min="0" />
                                <Input label={t("company.bathrooms")} type="number" value={form.bathrooms} onChange={(e) => updateField("bathrooms", e.target.value)} required min="0" />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input label={t("company.area")} type="number" value={form.area} onChange={(e) => updateField("area", e.target.value)} required min="0" />
                                    <Select
                                        label={t("company.unit")}
                                        value={form.areaUnit}
                                        onChange={(e) => updateField("areaUnit", e.target.value)}
                                        options={[{ value: "sqm", label: "sqm" }, { value: "sqft", label: "sqft" }]}
                                    />
                                </div>
                            </div>

                            <Select
                                label={t("company.statusLabel")}
                                value={form.status}
                                onChange={(e) => updateField("status", e.target.value)}
                                options={[
                                    { value: "available", label: t("filters.available") },
                                    { value: "reserved", label: t("filters.reserved") },
                                    { value: "sold", label: t("filters.sold") },
                                ]}
                            />

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.featured}
                                    onChange={(e) => updateField("featured", e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">{t("company.featured")}</span>
                            </label>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? t("company.saving") : t("company.saveChanges")}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => navigate(form.buildingId ? `/company/buildings/${form.buildingId}` : "/company/buildings")}>
                                    {t("common.cancel")}
                                </Button>
                            </div>
                        </form>
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
