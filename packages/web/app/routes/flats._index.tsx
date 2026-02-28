import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Navbar from "../../components/Navbar";
import FlatCard from "../../components/FlatCard";
import FlatFilters from "../../components/FlatFilters";
import { FlatGridSkeleton } from "../../components/skeletons/FlatCardSkeleton";
import { listFlats } from "../../lib/firestore";
import { useToast } from "../../lib/contexts/ToastContext";
import type { Flat, FlatFilters as FlatFiltersType } from "@gemmaham/shared";

export default function BrowseFlats() {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [flats, setFlats] = useState<Flat[]>([]);
    const [loading, setLoading] = useState(true);

    const loadFlats = async (filters: FlatFiltersType = { status: "available" }) => {
        setLoading(true);
        try {
            const { items } = await listFlats(filters);
            setFlats(items);
        } catch (e) {
            console.error("Failed to load flats:", e);
            addToast("error", t("errors.loadFailed"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFlats();
    }, []);

    return (
        <div className="home">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 py-24">
                <h1 className="text-3xl font-bold mb-6">{t("flats.browseTitle")}</h1>

                <FlatFilters onFilter={loadFlats} />

                {loading ? (
                    <FlatGridSkeleton />
                ) : flats.length === 0 ? (
                    <div className="text-center py-12 text-foreground/40">{t("flats.noResults")}</div>
                ) : (
                    <div className="projects-grid mt-6">
                        {flats.map((flat) => (
                            <FlatCard key={flat.id} flat={flat} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
