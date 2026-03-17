import { useState, useCallback } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Info, SlidersHorizontal, Camera, ClipboardCheck } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import { FormWizard } from "../../components/ui/FormWizard";
import { PhotoUploader } from "../../components/PhotoUploader";
import { createHouse, updateHouse } from "../../lib/firestore";
import { uploadHouseCover, uploadHouseFloorPlan } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import { houseSchema } from "../../lib/validation";
import { useFormValidation } from "../../lib/hooks/useFormValidation";
import type { AuthContext, HouseType, AreaUnit } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

const houseTypeOptions = [
    { value: "detached", label: "Detached" },
    { value: "semi_detached", label: "Semi-detached" },
    { value: "villa", label: "Villa" },
    { value: "townhouse", label: "Townhouse" },
    { value: "cottage", label: "Cottage" },
];

const areaUnitOptions = [
    { value: "sqm", label: "m\u00B2" },
    { value: "sqft", label: "ft\u00B2" },
];

const currencyOptions = [
    { value: "EUR", label: "EUR" },
    { value: "USD", label: "USD" },
    { value: "BAM", label: "BAM" },
];

export default function CompanyAddHouse() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [submitting, setSubmitting] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(null);
    const [photos, setPhotos] = useState<string[]>([]);
    const { errors: fieldErrors, validate, clearError } = useFormValidation(houseSchema);

    const [form, setForm] = useState({
        title: "",
        description: "",
        address: "",
        price: "",
        currency: "EUR",
        bedrooms: "3",
        bathrooms: "2",
        area: "",
        areaUnit: "sqm" as AreaUnit,
        lotSize: "",
        lotSizeUnit: "sqm" as AreaUnit,
        stories: "1",
        garage: false,
        garageSpaces: "0",
        hasYard: false,
        hasPool: false,
        houseType: "detached" as HouseType,
        yearBuilt: "",
        featured: false,
    });

    const updateField = (field: string, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        clearError(field);
        setStepErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const handleFloorPlan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFloorPlanFile(file);
        setFloorPlanPreview(URL.createObjectURL(file));
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
            if (!form.description.trim()) errors.description = t("validation.required");
        } else if (step === 1) {
            if (!form.price || Number(form.price) <= 0) errors.price = t("validation.pricePositive");
            if (!form.bedrooms || Number(form.bedrooms) < 0) errors.bedrooms = t("validation.minZero");
            if (!form.bathrooms || Number(form.bathrooms) < 0) errors.bathrooms = t("validation.minZero");
            if (!form.area || Number(form.area) <= 0) errors.area = t("validation.areaPositive");
            if (!form.lotSize || Number(form.lotSize) <= 0) errors.lotSize = t("validation.lotSizePositive");
            if (!form.stories || Number(form.stories) < 1) errors.stories = t("validation.storiesMin");
        }

        setStepErrors(errors);
        return Object.keys(errors).length === 0;
    }, [form, t]);

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
        if (!auth.companyId) return;

        const parsed = {
            title: form.title,
            description: form.description,
            address: form.address,
            price: Number(form.price),
            bedrooms: Number(form.bedrooms),
            bathrooms: Number(form.bathrooms),
            area: Number(form.area),
            lotSize: Number(form.lotSize),
            stories: Number(form.stories),
        };

        if (!validate(parsed)) return;

        setSubmitting(true);
        try {
            const houseId = await createHouse({
                companyId: auth.companyId,
                title: form.title,
                description: form.description,
                address: form.address,
                price: Number(form.price),
                currency: form.currency,
                bedrooms: Number(form.bedrooms),
                bathrooms: Number(form.bathrooms),
                area: Number(form.area),
                areaUnit: form.areaUnit,
                lotSize: Number(form.lotSize),
                lotSizeUnit: form.lotSizeUnit,
                stories: Number(form.stories),
                garage: form.garage,
                garageSpaces: Number(form.garageSpaces),
                hasYard: form.hasYard,
                hasPool: form.hasPool,
                houseType: form.houseType,
                yearBuilt: form.yearBuilt || null,
                coverImageUrl: null,
                floorPlanUrl: "",
                renderedImageUrl: null,
                photos: photos,
                status: "available",
                featured: form.featured,
            });

            if (coverFile) {
                const url = await uploadHouseCover(auth.companyId, houseId, coverFile);
                await updateHouse(houseId, { coverImageUrl: url });
            }
            if (floorPlanFile) {
                const url = await uploadHouseFloorPlan(auth.companyId, houseId, floorPlanFile);
                await updateHouse(houseId, { floorPlanUrl: url });
            }

            addToast("success", t("toast.changesSaved"));
            navigate("/company/properties");
        } catch (err) {
            addToast("error", t("toast.saveFailed"));
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t("houses.title")}
                                required
                                value={form.title}
                                onChange={(e) => updateField("title", e.target.value)}
                                error={stepErrors.title || (fieldErrors.title ? t(fieldErrors.title) : undefined)}
                            />
                            <Input
                                label={t("houses.address")}
                                required
                                value={form.address}
                                onChange={(e) => updateField("address", e.target.value)}
                                error={stepErrors.address || (fieldErrors.address ? t(fieldErrors.address) : undefined)}
                            />
                        </div>

                        <Textarea
                            label={t("houses.description")}
                            required
                            value={form.description}
                            onChange={(e) => updateField("description", e.target.value)}
                            error={stepErrors.description || (fieldErrors.description ? t(fieldErrors.description) : undefined)}
                        />
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Input
                                label={t("houses.price")}
                                type="number"
                                required
                                value={form.price}
                                onChange={(e) => updateField("price", e.target.value)}
                                error={stepErrors.price || (fieldErrors.price ? t(fieldErrors.price) : undefined)}
                            />
                            <Select
                                label={t("houses.currency")}
                                value={form.currency}
                                onChange={(e) => updateField("currency", e.target.value)}
                                options={currencyOptions}
                            />
                            <Select
                                label={t("properties.houseType")}
                                value={form.houseType}
                                onChange={(e) => updateField("houseType", e.target.value)}
                                options={houseTypeOptions}
                            />
                            <Input
                                label={t("houses.yearBuilt")}
                                value={form.yearBuilt}
                                onChange={(e) => updateField("yearBuilt", e.target.value)}
                                placeholder="2024"
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Input
                                label={t("houses.bedrooms")}
                                type="number"
                                required
                                value={form.bedrooms}
                                onChange={(e) => updateField("bedrooms", e.target.value)}
                                error={stepErrors.bedrooms || (fieldErrors.bedrooms ? t(fieldErrors.bedrooms) : undefined)}
                            />
                            <Input
                                label={t("houses.bathrooms")}
                                type="number"
                                required
                                value={form.bathrooms}
                                onChange={(e) => updateField("bathrooms", e.target.value)}
                                error={stepErrors.bathrooms || (fieldErrors.bathrooms ? t(fieldErrors.bathrooms) : undefined)}
                            />
                            <Input
                                label={t("houses.stories")}
                                type="number"
                                required
                                value={form.stories}
                                onChange={(e) => updateField("stories", e.target.value)}
                                error={stepErrors.stories || (fieldErrors.stories ? t(fieldErrors.stories) : undefined)}
                            />
                            <Input
                                label={t("houses.garageSpaces")}
                                type="number"
                                value={form.garageSpaces}
                                onChange={(e) => updateField("garageSpaces", e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Input
                                label={t("houses.area")}
                                type="number"
                                required
                                value={form.area}
                                onChange={(e) => updateField("area", e.target.value)}
                                error={stepErrors.area || (fieldErrors.area ? t(fieldErrors.area) : undefined)}
                            />
                            <Select
                                label={t("houses.areaUnit")}
                                value={form.areaUnit}
                                onChange={(e) => updateField("areaUnit", e.target.value)}
                                options={areaUnitOptions}
                            />
                            <Input
                                label={t("houses.lotSize")}
                                type="number"
                                required
                                value={form.lotSize}
                                onChange={(e) => updateField("lotSize", e.target.value)}
                                error={stepErrors.lotSize || (fieldErrors.lotSize ? t(fieldErrors.lotSize) : undefined)}
                            />
                            <Select
                                label={t("houses.lotSizeUnit")}
                                value={form.lotSizeUnit}
                                onChange={(e) => updateField("lotSizeUnit", e.target.value)}
                                options={areaUnitOptions}
                            />
                        </div>

                        <div className="flex flex-wrap gap-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.garage} onChange={(e) => updateField("garage", e.target.checked)} className="rounded" />
                                <span className="text-sm">{t("houses.garage")}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.hasYard} onChange={(e) => updateField("hasYard", e.target.checked)} className="rounded" />
                                <span className="text-sm">{t("houses.yard")}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.hasPool} onChange={(e) => updateField("hasPool", e.target.checked)} className="rounded" />
                                <span className="text-sm">{t("houses.pool")}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={form.featured} onChange={(e) => updateField("featured", e.target.checked)} className="rounded" />
                                <span className="text-sm">{t("houses.featured")}</span>
                            </label>
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        {/* Cover image */}
                        <div>
                            <label className="block text-sm font-medium mb-1">{t("houses.coverImage")}</label>
                            <div className="border-2 border-dashed border-foreground/20 rounded-xl p-6 text-center">
                                {coverPreview ? (
                                    <div className="space-y-2">
                                        <img src={coverPreview} alt="Cover preview" className="max-h-48 mx-auto rounded-lg object-cover" />
                                        <p className="text-sm text-foreground/50">{coverFile?.name}</p>
                                    </div>
                                ) : (
                                    <p className="text-foreground/40">{t("company.clickOrDrag")}</p>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleCover}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    style={{ position: "relative" }}
                                />
                            </div>
                        </div>

                        {/* Floor plan */}
                        <div>
                            <label className="block text-sm font-medium mb-1">{t("houses.floorPlan")}</label>
                            <div className="border-2 border-dashed border-foreground/20 rounded-xl p-6 text-center">
                                {floorPlanPreview ? (
                                    <div className="space-y-2">
                                        <img src={floorPlanPreview} alt="Floor plan preview" className="max-h-48 mx-auto rounded-lg object-cover" />
                                        <p className="text-sm text-foreground/50">{floorPlanFile?.name}</p>
                                    </div>
                                ) : (
                                    <p className="text-foreground/40">{t("company.clickOrDrag")}</p>
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFloorPlan}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    style={{ position: "relative" }}
                                />
                            </div>
                        </div>

                        {/* Property Photos */}
                        <PhotoUploader
                            photos={photos}
                            onChange={setPhotos}
                            storagePath={`properties/houses/new/photos`}
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
                            <ReviewRow label={t("houses.title")} value={form.title} />
                            <ReviewRow label={t("houses.address")} value={form.address} />
                            {form.description && <ReviewRow label={t("houses.description")} value={form.description} />}
                        </ReviewSection>

                        {/* Specifications Review */}
                        <ReviewSection
                            title={t("wizard.specifications")}
                            onEdit={() => goToStep(1)}
                            editLabel={t("common.edit")}
                        >
                            <ReviewRow label={t("houses.price")} value={`${form.price} ${form.currency}`} />
                            <ReviewRow label={t("properties.houseType")} value={form.houseType} />
                            <ReviewRow label={t("houses.bedrooms")} value={form.bedrooms} />
                            <ReviewRow label={t("houses.bathrooms")} value={form.bathrooms} />
                            <ReviewRow label={t("houses.stories")} value={form.stories} />
                            <ReviewRow label={t("houses.area")} value={`${form.area} ${form.areaUnit}`} />
                            <ReviewRow label={t("houses.lotSize")} value={`${form.lotSize} ${form.lotSizeUnit}`} />
                            {form.yearBuilt && <ReviewRow label={t("houses.yearBuilt")} value={form.yearBuilt} />}
                            <ReviewRow label={t("houses.garage")} value={form.garage ? `${t("common.yes")} (${form.garageSpaces})` : t("common.no")} />
                            <ReviewRow label={t("houses.yard")} value={form.hasYard ? t("common.yes") : t("common.no")} />
                            <ReviewRow label={t("houses.pool")} value={form.hasPool ? t("common.yes") : t("common.no")} />
                            <ReviewRow label={t("houses.featured")} value={form.featured ? t("common.yes") : t("common.no")} />
                        </ReviewSection>

                        {/* Photos Review */}
                        <ReviewSection
                            title={t("wizard.photos")}
                            onEdit={() => goToStep(2)}
                            editLabel={t("common.edit")}
                        >
                            <div className="flex gap-4 flex-wrap">
                                {coverPreview && (
                                    <div>
                                        <p className="text-sm text-foreground/60 mb-2">{t("houses.coverImage")}</p>
                                        <img src={coverPreview} alt="Cover" className="h-32 rounded-lg object-cover" />
                                    </div>
                                )}
                                {floorPlanPreview && (
                                    <div>
                                        <p className="text-sm text-foreground/60 mb-2">{t("houses.floorPlan")}</p>
                                        <img src={floorPlanPreview} alt="Floor plan" className="h-32 rounded-lg object-cover" />
                                    </div>
                                )}
                            </div>
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
                                disabled={submitting}
                            >
                                {submitting ? t("common.saving") : t("wizard.publish")}
                            </Button>
                            <Button type="button" variant="ghost" onClick={() => navigate("/company/properties")}>
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
                <div className="flex">
                    <main className="flex-1 p-6 max-w-3xl">
                        <h1 className="font-serif text-2xl font-bold mb-6">{t("houses.create")}</h1>

                        <FormWizard
                            steps={wizardSteps}
                            currentStep={currentStep}
                            onNext={handleNext}
                            onBack={handleBack}
                            isLastStep={currentStep === 3}
                        >
                            {renderStep()}
                        </FormWizard>
                    </main>
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
