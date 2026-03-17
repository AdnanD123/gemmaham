import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Search, Users } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import ContractorProfileCard from "../../components/ContractorProfileCard";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { SkeletonBlock } from "../../components/ui/Skeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import { searchContractors } from "../../lib/firestore";
import { CONTRACTOR_CATEGORIES } from "@gemmaham/shared";
import type { ContractorProfile, ContractorCategory, ContractorSubcategory } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

export default function CompanyContractors() {
    const { t } = useTranslation();
    const [contractors, setContractors] = useState<ContractorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<ContractorCategory | "">("");
    const [selectedSubcategory, setSelectedSubcategory] = useState<ContractorSubcategory | "">("");
    const [nameSearch, setNameSearch] = useState("");

    const subcategoryOptions = selectedCategory
        ? CONTRACTOR_CATEGORIES.find((c) => c.key === selectedCategory)?.subcategories ?? []
        : [];

    const loadContractors = async (category?: ContractorCategory, subcategory?: ContractorSubcategory, search?: string) => {
        setLoading(true);
        try {
            const results = await searchContractors({
                category: category || undefined,
                subcategory: subcategory || undefined,
                search: search?.trim() || undefined,
            });
            setContractors(results);
        } catch (e) {
            console.error("Failed to load contractors:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContractors();
    }, []);

    const handleFilter = () => {
        loadContractors(
            selectedCategory || undefined,
            !selectedCategory ? undefined : (selectedSubcategory || undefined),
            nameSearch,
        );
    };

    return (
        <RoleGuard allowedRole="company">
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6">
                        <div className="max-w-5xl">
                            <h1 className="text-2xl font-bold mb-1">{t("contractors.directoryTitle")}</h1>
                            <p className="text-foreground/50 mb-6">{t("contractors.directoryDesc")}</p>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-3 mb-6">
                                <div className="w-52">
                                    <Select
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value as ContractorCategory | "");
                                            setSelectedSubcategory("");
                                        }}
                                        options={[
                                            { value: "", label: t("contractorCategories.allCategories") },
                                            ...CONTRACTOR_CATEGORIES.map((c) => ({
                                                value: c.key,
                                                label: t(`contractorCategories.categories.${c.key}`),
                                            })),
                                        ]}
                                    />
                                </div>
                                {selectedCategory && subcategoryOptions.length > 0 && (
                                    <div className="w-52">
                                        <Select
                                            value={selectedSubcategory}
                                            onChange={(e) => setSelectedSubcategory(e.target.value as ContractorSubcategory | "")}
                                            options={[
                                                { value: "", label: t("contractorCategories.allSubcategories") },
                                                ...subcategoryOptions.map((s) => ({
                                                    value: s,
                                                    label: t(`contractorCategories.subcategories.${s}`),
                                                })),
                                            ]}
                                        />
                                    </div>
                                )}
                                <div className="flex-1 min-w-[200px] max-w-xs">
                                    <Input
                                        placeholder={t("contractors.searchByName")}
                                        value={nameSearch}
                                        onChange={(e) => setNameSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleFilter()}
                                    />
                                </div>
                                <button
                                    onClick={handleFilter}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                    <Search size={16} />
                                    {t("common.search")}
                                </button>
                            </div>

                            {/* Results */}
                            <ContentLoader loading={loading} skeleton={
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <SkeletonBlock key={i} className="h-48 rounded-xl" />
                                    ))}
                                </div>
                            }>
                                {contractors.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Users size={40} className="mx-auto text-foreground/20 mb-3" />
                                        <p className="text-foreground/50">{t("contractors.noResults")}</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {contractors.map((c) => (
                                            <ContractorProfileCard key={c.id} contractor={c} />
                                        ))}
                                    </div>
                                )}
                            </ContentLoader>
                        </div>
                    </main>
                </div>
            </div>
            </PageTransition>
        </RoleGuard>
    );
}
