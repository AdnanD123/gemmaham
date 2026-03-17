import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import RoleGuard from "../../components/RoleGuard";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { createBuilding, updateBuilding } from "../../lib/firestore";
import { uploadBuildingCover } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import type { AuthContext, BuildingStatus, ConstructionPhase } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

export default function CompanyAddBuilding() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const { addToast } = useToast();

    const [form, setForm] = useState({
        title: "",
        description: "",
        address: "",
        totalUnits: "",
        floors: "",
        status: "planning" as BuildingStatus,
        currentPhase: "foundation" as ConstructionPhase,
        estimatedCompletion: "",
        startDate: "",
        featured: false,
    });

    const updateField = (field: string, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverFile(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.companyId) return;

        setSubmitting(true);
        try {
            const buildingId = await createBuilding({
                companyId: auth.companyId,
                title: form.title,
                description: form.description,
                address: form.address,
                coverImageUrl: null,
                totalUnits: Number(form.totalUnits),
                availableUnits: Number(form.totalUnits),
                floors: Number(form.floors),
                status: form.status,
                currentPhase: form.currentPhase,
                estimatedCompletion: form.estimatedCompletion,
                startDate: form.startDate,
                featured: form.featured,
            });

            if (coverFile) {
                const coverUrl = await uploadBuildingCover(auth.companyId, buildingId, coverFile);
                await updateBuilding(buildingId, { coverImageUrl: coverUrl });
            }

            navigate(`/company/buildings/${buildingId}`);
        } catch (e) {
            console.error("Failed to create building:", e);
            addToast("error", t("toast.buildingCreateFailed"));
        } finally {
            setSubmitting(false);
        }
    };

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

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6 max-w-3xl">
                        <h1 className="text-2xl font-bold mb-6">{t("buildings.addNewBuilding")}</h1>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label={t("buildings.title")}
                                placeholder={t("buildings.titlePlaceholder")}
                                value={form.title}
                                onChange={(e) => updateField("title", e.target.value)}
                                required
                            />

                            <Textarea
                                label={t("buildings.description")}
                                placeholder={t("buildings.descPlaceholder")}
                                value={form.description}
                                onChange={(e) => updateField("description", e.target.value)}
                            />

                            <Input
                                label={t("buildings.address")}
                                placeholder={t("buildings.addressPlaceholder")}
                                value={form.address}
                                onChange={(e) => updateField("address", e.target.value)}
                                required
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label={t("buildings.totalUnits")}
                                    type="number"
                                    placeholder="24"
                                    value={form.totalUnits}
                                    onChange={(e) => updateField("totalUnits", e.target.value)}
                                    required
                                    min="1"
                                />
                                <Input
                                    label={t("buildings.floors")}
                                    type="number"
                                    placeholder="8"
                                    value={form.floors}
                                    onChange={(e) => updateField("floors", e.target.value)}
                                    required
                                    min="1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Select
                                    label={t("buildings.statusLabel")}
                                    value={form.status}
                                    onChange={(e) => updateField("status", e.target.value)}
                                    options={statusOptions}
                                />
                                <Select
                                    label={t("buildings.currentPhase")}
                                    value={form.currentPhase}
                                    onChange={(e) => updateField("currentPhase", e.target.value)}
                                    options={phaseOptions}
                                />
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
                                <input
                                    type="checkbox"
                                    checked={form.featured}
                                    onChange={(e) => updateField("featured", e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-sm">{t("buildings.featured")}</span>
                            </label>

                            {/* Cover Image Upload */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium">{t("buildings.coverImage")}</label>
                                <div className="border-2 border-dashed border-foreground/20 rounded-xl p-6 text-center">
                                    {preview ? (
                                        <div className="space-y-2">
                                            <img loading="lazy" src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                                            <p className="text-sm text-foreground/50">{coverFile?.name}</p>
                                        </div>
                                    ) : (
                                        <p className="text-foreground/40">{t("buildings.coverImagePlaceholder")}</p>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        style={{ position: "relative" }}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? t("buildings.creating") : t("buildings.createBuilding")}
                                </Button>
                                <Button type="button" variant="ghost" onClick={() => navigate("/company/buildings")}>
                                    {t("common.cancel")}
                                </Button>
                            </div>
                        </form>
                    </main>
                </div>
            </div>
            </PageTransition>
        </RoleGuard>
    );
}
