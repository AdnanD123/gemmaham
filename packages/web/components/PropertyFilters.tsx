import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import type { PropertyFilters as PropertyFiltersType, PropertyType, HouseType } from "@gemmaham/shared";

interface Props {
    onFilter: (filters: PropertyFiltersType) => void;
}

const houseTypeOptions = [
    { value: "", label: "All types" },
    { value: "detached", label: "Detached" },
    { value: "semi_detached", label: "Semi-detached" },
    { value: "villa", label: "Villa" },
    { value: "townhouse", label: "Townhouse" },
    { value: "cottage", label: "Cottage" },
];

const PropertyFilters = ({ onFilter }: Props) => {
    const { t } = useTranslation();
    const [propertyType, setPropertyType] = useState<PropertyType | "all">("all");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minBedrooms, setMinBedrooms] = useState("");
    const [houseType, setHouseType] = useState("");

    const buildFilters = (typeOverride?: PropertyType | "all") => ({
        propertyType: typeOverride ?? propertyType,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
        houseType: houseType ? (houseType as HouseType) : undefined,
    });

    const apply = () => {
        onFilter(buildFilters());
    };

    const handleTypeChange = (type: PropertyType | "all") => {
        setPropertyType(type);
        onFilter(buildFilters(type));
    };

    const reset = () => {
        setPropertyType("all");
        setMinPrice("");
        setMaxPrice("");
        setMinBedrooms("");
        setHouseType("");
        onFilter({});
    };

    return (
        <div className="p-4 bg-surface rounded-xl border-2 border-foreground/10 mb-6">
            {/* Type toggle */}
            <div className="flex gap-2 mb-4">
                {(["all", "building", "house"] as const).map((type) => (
                    <button
                        key={type}
                        onClick={() => handleTypeChange(type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            propertyType === type
                                ? "bg-primary text-white"
                                : "bg-foreground/5 text-foreground/60 hover:bg-foreground/10"
                        }`}
                    >
                        {type === "all" ? t("properties.all") : type === "building" ? t("properties.buildings") : t("properties.houses")}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Input
                    label={t("filters.minPrice")}
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                />
                <Input
                    label={t("filters.maxPrice")}
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="999999"
                />
                <Input
                    label={t("filters.minBedrooms")}
                    type="number"
                    value={minBedrooms}
                    onChange={(e) => setMinBedrooms(e.target.value)}
                    placeholder="1"
                />
                {propertyType === "house" && (
                    <Select
                        label={t("properties.houseType")}
                        value={houseType}
                        onChange={(e) => setHouseType(e.target.value)}
                        options={houseTypeOptions}
                    />
                )}
            </div>

            <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={apply}>{t("common.apply")}</Button>
                <Button size="sm" variant="ghost" onClick={reset}>{t("common.reset")}</Button>
            </div>
        </div>
    );
};

export default PropertyFilters;
