import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "./ui/Button";
import type { FlatFilters as FlatFiltersType, SortBy } from "@gemmaham/shared";

interface Props {
    onFilter: (filters: FlatFiltersType) => void;
}

const inputClass = "w-28 px-3 py-2 text-sm border border-foreground/6 rounded-xl bg-background focus:border-primary focus:outline-none";

const FlatFilters = ({ onFilter }: Props) => {
    const { t } = useTranslation();
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minBedrooms, setMinBedrooms] = useState("");
    const [location, setLocation] = useState("");
    const [minArea, setMinArea] = useState("");
    const [maxArea, setMaxArea] = useState("");
    const [sortBy, setSortBy] = useState<SortBy>("newest");

    const handleApply = () => {
        onFilter({
            status: "available",
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
            location: location || undefined,
            minArea: minArea ? Number(minArea) : undefined,
            maxArea: maxArea ? Number(maxArea) : undefined,
            sortBy,
        });
    };

    const handleReset = () => {
        setMinPrice("");
        setMaxPrice("");
        setMinBedrooms("");
        setLocation("");
        setMinArea("");
        setMaxArea("");
        setSortBy("newest");
        onFilter({ status: "available" });
    };

    return (
        <div className="p-4 bg-surface rounded-2xl border border-foreground/6">
            <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/60">{t("filters.location")}</label>
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder={t("filters.locationPlaceholder")}
                        className="w-40 px-3 py-2 text-sm border border-foreground/6 rounded-xl bg-background focus:border-primary focus:outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/60">{t("filters.minPrice")}</label>
                    <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="0"
                        className={inputClass}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/60">{t("filters.maxPrice")}</label>
                    <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder={t("filters.any")}
                        className={inputClass}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/60">{t("filters.minBedrooms")}</label>
                    <input
                        type="number"
                        value={minBedrooms}
                        onChange={(e) => setMinBedrooms(e.target.value)}
                        placeholder={t("filters.any")}
                        min="0"
                        className={inputClass}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/60">{t("filters.minArea")}</label>
                    <input
                        type="number"
                        value={minArea}
                        onChange={(e) => setMinArea(e.target.value)}
                        placeholder="0"
                        min="0"
                        className={inputClass}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/60">{t("filters.maxArea")}</label>
                    <input
                        type="number"
                        value={maxArea}
                        onChange={(e) => setMaxArea(e.target.value)}
                        placeholder={t("filters.any")}
                        min="0"
                        className={inputClass}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/60">{t("filters.sortBy")}</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                        className="w-40 px-3 py-2 text-sm border border-foreground/6 rounded-xl bg-background focus:border-primary focus:outline-none"
                    >
                        <option value="newest">{t("filters.newest")}</option>
                        <option value="price_asc">{t("filters.priceLowHigh")}</option>
                        <option value="price_desc">{t("filters.priceHighLow")}</option>
                        <option value="size_desc">{t("filters.sizeLargeSmall")}</option>
                    </select>
                </div>
                <Button size="sm" onClick={handleApply}>{t("filters.apply")}</Button>
                <Button size="sm" variant="ghost" onClick={handleReset}>{t("filters.reset")}</Button>
            </div>
        </div>
    );
};

export default FlatFilters;
