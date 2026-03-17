import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, X } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import type { PropertyFilters as PropertyFiltersType, PropertyType, HouseType, SortBy } from "@gemmaham/shared";

interface Props {
    onFilter: (filters: PropertyFiltersType) => void;
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}

const houseTypeOptions = [
    { value: "", label: "All types" },
    { value: "detached", label: "Detached" },
    { value: "semi_detached", label: "Semi-detached" },
    { value: "villa", label: "Villa" },
    { value: "townhouse", label: "Townhouse" },
    { value: "cottage", label: "Cottage" },
];

const PropertyFilters = ({ onFilter, searchQuery = "", onSearchChange }: Props) => {
    const { t } = useTranslation();
    const [propertyType, setPropertyType] = useState<PropertyType | "all">("all");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minBedrooms, setMinBedrooms] = useState("");
    const [houseType, setHouseType] = useState("");
    const [location, setLocation] = useState("");
    const [minArea, setMinArea] = useState("");
    const [maxArea, setMaxArea] = useState("");
    const [sortBy, setSortBy] = useState<SortBy>("newest");

    const buildFilters = (typeOverride?: PropertyType | "all"): PropertyFiltersType => ({
        propertyType: typeOverride ?? propertyType,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
        houseType: houseType ? (houseType as HouseType) : undefined,
        location: location || undefined,
        minArea: minArea ? Number(minArea) : undefined,
        maxArea: maxArea ? Number(maxArea) : undefined,
        sortBy,
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
        setLocation("");
        setMinArea("");
        setMaxArea("");
        setSortBy("newest");
        onFilter({});
    };

    return (
        <div className="p-4 bg-surface rounded-2xl border border-foreground/6 mb-6">
            {/* Search bar */}
            {onSearchChange && (
                <div className="relative mb-4">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t("search.placeholder")}
                        className="w-full pl-9 pr-9 py-2.5 bg-background border border-foreground/6 rounded-xl text-sm focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            )}

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
                    label={t("filters.location")}
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t("filters.locationPlaceholder")}
                />
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
                <Input
                    label={t("filters.minArea")}
                    type="number"
                    value={minArea}
                    onChange={(e) => setMinArea(e.target.value)}
                    placeholder="0"
                />
                <Input
                    label={t("filters.maxArea")}
                    type="number"
                    value={maxArea}
                    onChange={(e) => setMaxArea(e.target.value)}
                    placeholder={t("filters.any")}
                />
                <Select
                    label={t("filters.sortBy")}
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    options={[
                        { value: "newest", label: t("filters.newest") },
                        { value: "price_asc", label: t("filters.priceLowHigh") },
                        { value: "price_desc", label: t("filters.priceHighLow") },
                        { value: "size_desc", label: t("filters.sizeLargeSmall") },
                    ]}
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
