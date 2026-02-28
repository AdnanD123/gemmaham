import { useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "./ui/Button";
import type { FlatFilters as FlatFiltersType } from "@gemmaham/shared";

interface Props {
    onFilter: (filters: FlatFiltersType) => void;
}

const FlatFilters = ({ onFilter }: Props) => {
    const { t } = useTranslation();
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [minBedrooms, setMinBedrooms] = useState("");

    const handleApply = () => {
        onFilter({
            status: "available",
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            minBedrooms: minBedrooms ? Number(minBedrooms) : undefined,
        });
    };

    const handleReset = () => {
        setMinPrice("");
        setMaxPrice("");
        setMinBedrooms("");
        onFilter({ status: "available" });
    };

    return (
        <div className="flex flex-wrap items-end gap-3 p-4 bg-surface rounded-xl border-2 border-foreground/10">
            <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/60">{t("filters.minPrice")}</label>
                <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="0"
                    className="w-28 px-3 py-2 text-sm border-2 border-foreground/10 rounded-lg bg-background focus:border-primary focus:outline-none"
                />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/60">{t("filters.maxPrice")}</label>
                <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder={t("filters.any")}
                    className="w-28 px-3 py-2 text-sm border-2 border-foreground/10 rounded-lg bg-background focus:border-primary focus:outline-none"
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
                    className="w-28 px-3 py-2 text-sm border-2 border-foreground/10 rounded-lg bg-background focus:border-primary focus:outline-none"
                />
            </div>
            <Button size="sm" onClick={handleApply}>{t("filters.apply")}</Button>
            <Button size="sm" variant="ghost" onClick={handleReset}>{t("filters.reset")}</Button>
        </div>
    );
};

export default FlatFilters;
