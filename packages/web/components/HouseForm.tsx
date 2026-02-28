import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Select from "./ui/Select";
import Button from "./ui/Button";
import type { House, HouseType, AreaUnit } from "@gemmaham/shared";

interface HouseFormData {
    title: string;
    description: string;
    address: string;
    price: string;
    currency: string;
    bedrooms: string;
    bathrooms: string;
    area: string;
    areaUnit: AreaUnit;
    lotSize: string;
    lotSizeUnit: AreaUnit;
    stories: string;
    garage: boolean;
    garageSpaces: string;
    hasYard: boolean;
    hasPool: boolean;
    houseType: HouseType;
    yearBuilt: string;
    featured: boolean;
}

interface Props {
    house?: House;
    onSubmit: (data: HouseFormData, coverFile: File | null, floorPlanFile: File | null) => Promise<void>;
    submitting: boolean;
}

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

const HouseForm = ({ house, onSubmit, submitting }: Props) => {
    const { t } = useTranslation();
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(null);

    const [form, setForm] = useState<HouseFormData>({
        title: "",
        description: "",
        address: "",
        price: "",
        currency: "EUR",
        bedrooms: "3",
        bathrooms: "2",
        area: "",
        areaUnit: "sqm",
        lotSize: "",
        lotSizeUnit: "sqm",
        stories: "1",
        garage: false,
        garageSpaces: "0",
        hasYard: false,
        hasPool: false,
        houseType: "detached",
        yearBuilt: "",
        featured: false,
    });

    useEffect(() => {
        if (house) {
            setForm({
                title: house.title,
                description: house.description,
                address: house.address,
                price: String(house.price),
                currency: house.currency,
                bedrooms: String(house.bedrooms),
                bathrooms: String(house.bathrooms),
                area: String(house.area),
                areaUnit: house.areaUnit,
                lotSize: String(house.lotSize),
                lotSizeUnit: house.lotSizeUnit,
                stories: String(house.stories),
                garage: house.garage,
                garageSpaces: String(house.garageSpaces),
                hasYard: house.hasYard,
                hasPool: house.hasPool,
                houseType: house.houseType,
                yearBuilt: house.yearBuilt || "",
                featured: house.featured,
            });
            if (house.coverImageUrl) setCoverPreview(house.coverImageUrl);
            if (house.floorPlanUrl) setFloorPlanPreview(house.floorPlanUrl);
        }
    }, [house]);

    const update = (field: string, value: string | boolean) => {
        setForm((prev) => ({ ...prev, [field]: value }));
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(form, coverFile, floorPlanFile);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label={t("houses.title")} required value={form.title} onChange={(e) => update("title", e.target.value)} />
                <Input label={t("houses.address")} required value={form.address} onChange={(e) => update("address", e.target.value)} />
            </div>

            <Textarea label={t("houses.description")} required value={form.description} onChange={(e) => update("description", e.target.value)} />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label={t("houses.price")} type="number" required value={form.price} onChange={(e) => update("price", e.target.value)} />
                <Select label={t("houses.currency")} value={form.currency} onChange={(e) => update("currency", e.target.value)} options={currencyOptions} />
                <Select label={t("properties.houseType")} value={form.houseType} onChange={(e) => update("houseType", e.target.value)} options={houseTypeOptions} />
                <Input label={t("houses.yearBuilt")} value={form.yearBuilt} onChange={(e) => update("yearBuilt", e.target.value)} placeholder="2024" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label={t("houses.bedrooms")} type="number" required value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
                <Input label={t("houses.bathrooms")} type="number" required value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
                <Input label={t("houses.stories")} type="number" required value={form.stories} onChange={(e) => update("stories", e.target.value)} />
                <Input label={t("houses.garageSpaces")} type="number" value={form.garageSpaces} onChange={(e) => update("garageSpaces", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Input label={t("houses.area")} type="number" required value={form.area} onChange={(e) => update("area", e.target.value)} />
                <Select label={t("houses.areaUnit")} value={form.areaUnit} onChange={(e) => update("areaUnit", e.target.value)} options={areaUnitOptions} />
                <Input label={t("houses.lotSize")} type="number" required value={form.lotSize} onChange={(e) => update("lotSize", e.target.value)} />
                <Select label={t("houses.lotSizeUnit")} value={form.lotSizeUnit} onChange={(e) => update("lotSizeUnit", e.target.value)} options={areaUnitOptions} />
            </div>

            <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.garage} onChange={(e) => update("garage", e.target.checked)} className="rounded" />
                    <span className="text-sm">{t("houses.garage")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.hasYard} onChange={(e) => update("hasYard", e.target.checked)} className="rounded" />
                    <span className="text-sm">{t("houses.yard")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.hasPool} onChange={(e) => update("hasPool", e.target.checked)} className="rounded" />
                    <span className="text-sm">{t("houses.pool")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} className="rounded" />
                    <span className="text-sm">{t("houses.featured")}</span>
                </label>
            </div>

            {/* Cover image */}
            <div>
                <label className="block text-sm font-medium mb-1">{t("houses.coverImage")}</label>
                <input type="file" accept="image/*" onChange={handleCover} className="text-sm" />
                {coverPreview && (
                    <img src={coverPreview} alt="Cover preview" className="mt-2 h-32 object-cover rounded-lg" />
                )}
            </div>

            {/* Floor plan */}
            <div>
                <label className="block text-sm font-medium mb-1">{t("houses.floorPlan")}</label>
                <input type="file" accept="image/*" onChange={handleFloorPlan} className="text-sm" />
                {floorPlanPreview && (
                    <img src={floorPlanPreview} alt="Floor plan preview" className="mt-2 h-32 object-cover rounded-lg" />
                )}
            </div>

            <Button type="submit" disabled={submitting}>
                {submitting ? t("common.saving") : house ? t("common.save") : t("houses.create")}
            </Button>
        </form>
    );
};

export default HouseForm;
