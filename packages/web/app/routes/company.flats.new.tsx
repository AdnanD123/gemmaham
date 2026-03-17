import { useState, useEffect, useCallback } from "react";
import { useOutletContext, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Info, SlidersHorizontal, Camera, ClipboardCheck } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { FormWizard } from "../../components/ui/FormWizard";
import { createFlat, updateFlat, listCompanyBuildings, initFlatCustomizationConfig } from "../../lib/firestore";
import { uploadFloorPlan } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import { flatSchema } from "../../lib/validation";
import { useFormValidation } from "../../lib/hooks/useFormValidation";
import { useFormDraft } from "../../lib/hooks/useFormDraft";
import { DraftIndicator } from "../../components/ui/DraftIndicator";
import type { AuthContext, FlatStatus, AreaUnit, Building } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";
import { PhotoUploader } from "../../components/PhotoUploader";

export default function CompanyAddFlat() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [submitting, setSubmitting] = useState(false);
    const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [photos, setPhotos] = useState<string[]>([]);
    const [photoUploading, setPhotoUploading] = useState(false);
    const [buildings, setBuildings] = useState<Building[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const { addToast } = useToast();
    const { errors: fieldErrors, validate, clearError } = useFormValidation(flatSchema);

    const preselectedBuildingId = searchParams.get("buildingId") || "";

    const { values: form, setValue: setDraftField, hasDraft, draftSavedAt, clearDraft, discardDraft, setAllValues: setForm } = useFormDraft("draft-flat-new", {
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

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        if (hasDraft) window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [hasDraft]);

    const updateField = (field: string, value: string | boolean) => {
        setDraftField(field, value);
        clearError(field);
        setStepErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFloorPlanFile(file);
        const url = URL.createObjectURL(file);
        setPreview(url);
    };

    const wizardSteps = [
        { label: t("wizard.basicInfo"), icon: Info },
        { label: t("wizard.specifications"), icon: SlidersHorizontal },
        { label: t("wizard.photos"), icon: Camera },
        { label: t("wizard.reviewPublish"), icon: ClipboardCheck },
    ];

    const validateStep = useCallback((step: number): boolean => {
        const errors: Record<string, string> = {};

        if (step === 0) {
            if (!form.title.trim()) errors.title = t("validation.titleMin");
            if (!form.address.trim()) errors.address = t("validation.required");
        } else if (step === 1) {
            if (!form.price || Number(form.price) <= 0) errors.price = t("validation.pricePositive");
            if (!form.bedrooms || Number(form.bedrooms) < 0) errors.bedrooms = t("validation.minZero");
            if (!form.bathrooms || Number(form.bathrooms) < 0) errors.bathrooms = t("validation.minZero");
            if (!form.area || Number(form.area) <= 0) errors.area = t("validation.areaPositive");
        } else if (step === 2) {
            if (!floorPlanFile) errors.floorPlan = t("validation.required");
        }

        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    }, [form, floorPlanFile, t]);

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length - 1));
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
    };

    const goToStep = (step: number) => {
        setCurrentStep(step);
    };

    const handleSubmit = async () => {
        if (!auth.companyId || !floorPlanFile) return;

        const parsed = {
            title: form.title,
            description: form.description || undefined,
            address: form.address,
            price: Number(form.price),
            bedrooms: Number(form.bedrooms),
            bathrooms: Number(form.bathrooms),
            area: Number(form.area),
        };

        if (!validate(parsed)) return;

        setSubmitting(true);
        try {
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
                floorPlanUrl: "",
                renderedImageUrl: null,
                photos,
                status: form.status,
                featured: form.featured,
            });

            const floorPlanUrl = await uploadFloorPlan(auth.companyId, flatId, floorPlanFile);
            await updateFlat(flatId, { floorPlanUrl });

            if (form.buildingId) {
                try {
                    await initFlatCustomizationConfig(flatId, form.buildingId);
                } catch (e) {
                    console.error("Failed to init flat scope config:", e);
                }
            }

            clearDraft();
            navigate(form.buildingId ? `/company/buildings/${form.buildingId}` : "/company/buildings");
        } catch (e) {
            console.error("Failed to create flat:", e);
            addToast("error", t("toast.flatCreatedFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-4">
                        <Input
                            label={t("company.title")}
                            placeholder={t("company.titlePlaceholder")}
                            value={form.title}
                            onChange={(e) => updateField("title", e.target.value)}
                            error={stepErrors.title || (fieldErrors.title ? t(fieldErrors.title) : undefined)}
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
                            error={stepErrors.address || (fieldErrors.address ? t(fieldErrors.address) : undefined)}
                            required
                        />

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
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label={t("company.price")}
                                type="number"
                                placeholder="250000"
                                value={form.price}
                                onChange={(e) => updateField("price", e.target.value)}
                                error={stepErrors.price || (fieldErrors.price ? t(fieldErrors.price) : undefined)}
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
                                error={stepErrors.bedrooms || (fieldErrors.bedrooms ? t(fieldErrors.bedrooms) : undefined)}
                                required
                                min="0"
                            />
                            <Input
                                label={t("company.bathrooms")}
                                type="number"
                                placeholder="1"
                                value={form.bathrooms}
                                onChange={(e) => updateField("bathrooms", e.target.value)}
                                error={stepErrors.bathrooms || (fieldErrors.bathrooms ? t(fieldErrors.bathrooms) : undefined)}
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
                                    error={stepErrors.area || (fieldErrors.area ? t(fieldErrors.area) : undefined)}
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
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        {/* Floor Plan Upload */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium">{t("company.floorPlanImage")} *</label>
                            <div className={`border-2 border-dashed rounded-xl p-6 text-center ${stepErrors.floorPlan ? "border-red-400" : "border-foreground/20"}`}>
                                {preview ? (
                                    <div className="space-y-2">
                                        <img loading="lazy" src={preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
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
                                />
                            </div>
                            {stepErrors.floorPlan && <p className="text-sm text-red-500">{stepErrors.floorPlan}</p>}
                        </div>

                        {/* Property Photos */}
                        <PhotoUploader
                            photos={photos}
                            onChange={setPhotos}
                            storagePath={`properties/flats/photos`}
                            onUploadingChange={setPhotoUploading}
                        />
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        {/* Basic Info Review */}
                        <ReviewSection
                            title={t("wizard.basicInfo")}
                            onEdit={() => goToStep(0)}
                            editLabel={t("common.edit")}
                        >
                            <ReviewRow label={t("company.title")} value={form.title} />
                            {form.description && <ReviewRow label={t("company.descLabel")} value={form.description} />}
                            <ReviewRow label={t("company.address")} value={form.address} />
                            {form.buildingId && (
                                <>
                                    <ReviewRow
                                        label={t("buildings.building")}
                                        value={buildings.find((b) => b.id === form.buildingId)?.title || form.buildingId}
                                    />
                                    {form.unitNumber && <ReviewRow label={t("buildings.unitNumber")} value={form.unitNumber} />}
                                </>
                            )}
                        </ReviewSection>

                        {/* Specifications Review */}
                        <ReviewSection
                            title={t("wizard.specifications")}
                            onEdit={() => goToStep(1)}
                            editLabel={t("common.edit")}
                        >
                            <ReviewRow label={t("company.price")} value={`${form.price} ${form.currency}`} />
                            <ReviewRow label={t("company.bedrooms")} value={form.bedrooms} />
                            <ReviewRow label={t("company.bathrooms")} value={form.bathrooms} />
                            <ReviewRow label={t("company.area")} value={`${form.area} ${form.areaUnit}`} />
                            <ReviewRow label={t("company.statusLabel")} value={form.status} />
                            <ReviewRow label={t("company.featured")} value={form.featured ? t("common.yes") : t("common.no")} />
                        </ReviewSection>

                        {/* Photos Review */}
                        <ReviewSection
                            title={t("wizard.photos")}
                            onEdit={() => goToStep(2)}
                            editLabel={t("common.edit")}
                        >
                            {preview && (
                                <div>
                                    <p className="text-sm text-foreground/60 mb-2">{t("company.floorPlanImage")}</p>
                                    <img loading="lazy" src={preview} alt="Floor plan" className="h-32 rounded-lg object-cover" />
                                </div>
                            )}
                            {photos.length > 0 && (
                                <div>
                                    <p className="text-sm text-foreground/60 mb-2">{t("photos.upload")} ({photos.length})</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {photos.map((url, i) => (
                                            <img key={url} loading="lazy" src={url} alt={`Photo ${i + 1}`} className="h-20 w-20 rounded-lg object-cover" />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </ReviewSection>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={submitting || !floorPlanFile || photoUploading}
                            >
                                {submitting ? t("company.creating") : t("wizard.publish")}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => navigate(form.buildingId ? `/company/buildings/${form.buildingId}` : "/company/buildings")}>
                                {t("common.cancel")}
                            </Button>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
                <div className="home">
                    <div className="flex">
                        <main className="flex-1 p-6 max-w-3xl">
                            <h1 className="text-2xl font-bold mb-6">{t("company.addNewFlat")}</h1>

                            <DraftIndicator show={hasDraft} savedAt={draftSavedAt} onDiscard={discardDraft} />

                            <FormWizard
                                steps={wizardSteps}
                                currentStep={currentStep}
                                onNext={handleNext}
                                onBack={handleBack}
                                isLastStep={currentStep === 3}
                                nextDisabled={currentStep === 2 && photoUploading}
                            >
                                {renderStep()}
                            </FormWizard>
                        </main>
                    </div>
                </div>
            </PageTransition>
        </RoleGuard>
    );
}

/* Review helper components */

function ReviewSection({
    title,
    onEdit,
    editLabel,
    children,
}: {
    title: string;
    onEdit: () => void;
    editLabel: string;
    children: React.ReactNode;
}) {
    return (
        <div className="border border-foreground/6 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{title}</h3>
                <button
                    type="button"
                    onClick={onEdit}
                    className="text-sm text-primary hover:underline font-medium"
                >
                    {editLabel}
                </button>
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm">
            <span className="text-foreground/60">{label}</span>
            <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
        </div>
    );
}
