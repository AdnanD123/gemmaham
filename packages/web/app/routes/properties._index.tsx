import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import PropertyCard from "../../components/PropertyCard";
import PropertyFilters from "../../components/PropertyFilters";
import { FlatGridSkeleton } from "../../components/skeletons/FlatCardSkeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { PageTransition } from "../../components/ui/PageTransition";
import { listAllProperties, type PropertyItem } from "../../lib/firestore";
import { usePropertySearch } from "../../lib/hooks/usePropertySearch";
import type { PropertyFilters as PropertyFiltersType } from "@gemmaham/shared";

export default function PropertiesBrowse() {
    const { t } = useTranslation();
    const [properties, setProperties] = useState<PropertyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const { search } = usePropertySearch(properties);

    const displayProperties = useMemo(
        () => (searchQuery.trim() ? search(searchQuery) : properties),
        [searchQuery, properties, search],
    );

    const fetchProperties = async (filters: PropertyFiltersType = {}) => {
        setLoading(true);
        try {
            const results = await listAllProperties(filters);
            setProperties(results);
        } catch (err) {
            console.error("Failed to load properties:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProperties();
    }, []);

    return (
        <div className="home">
            <PageTransition className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="font-serif text-3xl font-bold mb-6">{t("properties.browseTitle")}</h1>

                <PropertyFilters
                    onFilter={fetchProperties}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                />

                <ContentLoader loading={loading} skeleton={<FlatGridSkeleton />}>
                    {displayProperties.length === 0 ? (
                        <p className="text-center text-foreground/50 py-12">
                            {searchQuery.trim() ? t("search.noResults") : t("properties.noResults")}
                        </p>
                    ) : (
                        <div className="projects-grid">
                            {displayProperties.map((p) => (
                                <PropertyCard key={p.id} property={p} />
                            ))}
                        </div>
                    )}
                </ContentLoader>
            </PageTransition>
        </div>
    );
}
