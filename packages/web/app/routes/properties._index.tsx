import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import PropertyCard from "../../components/PropertyCard";
import PropertyFilters from "../../components/PropertyFilters";
import { FlatGridSkeleton } from "../../components/skeletons/FlatCardSkeleton";
import { listAllProperties, type PropertyItem } from "../../lib/firestore";
import type { PropertyFilters as PropertyFiltersType } from "@gemmaham/shared";

export default function PropertiesBrowse() {
    const { t } = useTranslation();
    const [properties, setProperties] = useState<PropertyItem[]>([]);
    const [loading, setLoading] = useState(true);

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
        <>
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-8 mt-20">
                <h1 className="font-serif text-3xl font-bold mb-6">{t("properties.browseTitle")}</h1>

                <PropertyFilters onFilter={fetchProperties} />

                {loading ? (
                    <FlatGridSkeleton />
                ) : properties.length === 0 ? (
                    <p className="text-center text-foreground/50 py-12">{t("properties.noResults")}</p>
                ) : (
                    <div className="projects-grid">
                        {properties.map((p) => (
                            <PropertyCard key={p.id} property={p} />
                        ))}
                    </div>
                )}
            </main>
        </>
    );
}
