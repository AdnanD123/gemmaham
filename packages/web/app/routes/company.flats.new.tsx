import { useState, useEffect } from "react";
import { useOutletContext, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import RoleGuard from "../../components/RoleGuard";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { createFlat, updateFlat, listCompanyBuildings, initFlatCustomizationConfig } from "../../lib/firestore";
import { uploadFloorPlan } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, FlatStatus, AreaUnit, Building } from "@gemmaham/shared";

export default function CompanyAddFlat() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [submitting, setSubmitting] = useState(false);
    const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const { addToast } = useToast();

    const preselectedBuildingId = searchParams.get("buildingId") || "";

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
        buildingId: preselectedBuildingId,
        unitNumber: "",
    });

    useEffect(() => {
        if (!auth.companyId) return;
        (async () => {
            try {
                const b = await listCompanyBuildings(auth.companyId!);
                setBuildings(b);
            } catch (e) {
                console.error("Failed to load buildings:", e);
            }
        })();
    }, [auth.companyId]);

    const updateField = (field: string, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFloorPlanFile(file);
        const url = URL.createObjectURL(file);
        setPreview(url);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.companyId || !floorPlanFile) return;

        setSubmitting(true);
        try {
            // Create flat doc first to get ID
            const flatId = await createFlat({
                companyId: auth.companyId,
                buildingId: form.buildingId || null,
                unitNumber: form.unitNumber || null,
                title: form.title,
                description: form.description,
                address: form.address,
                price: Number(form.price),
                currency: form.currency,
                bedrooms: Number(form.bedrooms),
                bathrooms: Number(form.bathrooms),
                area: Number(form.area),
                areaUnit: form.areaUnit,
                floorPlanUrl: "", // Placeholder, will be updated
                renderedImageUrl: null,
                status: form.status,
                featured: form.featured,
            });

            // Upload floor plan
            const floorPlanUrl = await uploadFloorPlan(auth.companyId, flatId, floorPlanFile);

            // Update flat with the URL
            await updateFlat(flatId, { floorPlanUrl });

            // Auto-inherit building's contractor scope config
            if (form.buildingId) {
                try {
                    await initFlatCustomizationConfig(flatId, form.buildingId);
                } catch (e) {
                    console.error("Failed to init flat scope config:", e);
                }
            }

            navigate(form.buildingId ? `/company/buildings/${form.buildingId}` : "/company/buildings");
        } catch (e) {
            console.error("Failed to create flat:", e);
            addToast("error", t("toast.flatCreatedFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <RoleGuard allowedRole="company">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <main className="flex-1 p-6 max-w-3xl">
                        <h1 className="text-2xl font-bold mb-6">{t("company.addNewFlat")}</h1>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label={t("company.title")}
                                placeholder={t("company.titlePlaceholder")}
                                value={form.title}
                                onChange={(e) => updateField("title", e.target.value)}
                                required
                            />

                            <Textarea
                                label={t("company.descLabel")}
                                placeholder={t("company.descPlaceholder")}
                                value={form.description}
                                onChange={(e) => updateField("description", e.target.value)}
                            />

                            <Input
                                label={t("company.address")}
                                placeholder={t("company.addressPlaceholder")}
                                value={form.address}
                                onChange={(e) => updateField("address", e.target.value)}
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label={t("company.price")}
                                    type="number"
                                    placeholder="250000"
                                    value={form.price}
                                    onChange={(e) => updateField("price", e.target.value)}
                                    required
                                />
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
                                <Input
                                    label={t("company.bedrooms")}
                                    type="number"
                                    placeholder="2"
                                    value={form.bedrooms}
                                    onChange={(e) => updateField("bedrooms", e.target.value)}
                                    required
                                    min="0"
                                />
                                <Input
                                    label={t("company.bathrooms")}
                                    type="number"
                                    placeholder="1"
                                    value={form.bathrooms}
                                    onChange={(e) => updateField("bathrooms", e.target.value)}
                                    required
                                    min="0"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <Input
                                        label={t("company.area")}
                                        type="number"
                                        placeholder="75"
                                        value={form.area}
                                        onChange={(e) => updateField("area", e.target.value)}
                                        required
                                        min="0"
                                    />
                                    <Select
                                        label={t("company.unit")}
                                        value={form.areaUnit}
                                        onChange={(e) => updateField("areaUnit", e.target.value)}
                                        options={[
                                            { value: "sqm", label: "sqm" },
                                            { value: "sqft", label: "sqft" },
                                        ]}
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

                            {/* Building Association */}
                            {buildings.length > 0 && (
                                <div className="grid grid-cols-2 gap-4">
                                    <Select
                                        label={t("buildings.building")}
                                        value={form.buildingId}
                                        onChange={(e) => updateField("buildingId", e.target.value)}
                                        options={[
                                            { value: "", label: t("buildings.standalone") },
                                            ...buildings.map((b) => ({ value: b.id, label: b.title })),
                                        ]}
                                    />
                                    {form.buildingId && (
                                        <Input
                                            label={t("buildings.unitNumber")}
                                            placeholder="A-301"
                                            value={form.unitNumber}
                                            onChange={(e) => updateField("unitNumber", e.target.value)}
                                        />
                                    )}
                                </div>
                            )}

                            {/* Floor Plan Upload */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">{t("company.floorPlanImage")} *</label>
                                <div className="border-2 border-dashed border-foreground/20 rounded-xl p-6 text-center">
                                    {preview ? (
                                        <div className="space-y-2">
                                            <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                                            <p className="text-sm text-foreground/50">{floorPlanFile?.name}</p>
                                        </div>
                                    ) : (
                                        <p className="text-foreground/40">{t("company.clickOrDrag")}</p>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        style={{ position: "relative" }}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={submitting || !floorPlanFile}>
                                    {submitting ? t("company.creating") : t("company.createFlat")}
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
