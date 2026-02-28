import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, UserCheck, Wrench } from "lucide-react";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import { searchContractors } from "../lib/firestore";
import { CONTRACTOR_CATEGORIES } from "@gemmaham/shared";
import type { ContractorProfile, ContractorCategory, ContractorSubcategory } from "@gemmaham/shared";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onAssign: (profile: ContractorProfile) => void;
    existingContractorIds: string[];
}

export default function ContractorSearch({ isOpen, onClose, onAssign, existingContractorIds }: Props) {
    const { t } = useTranslation();
    const [tab, setTab] = useState<"email" | "directory">("email");
    const [email, setEmail] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<ContractorCategory | "">("");
    const [selectedSubcategory, setSelectedSubcategory] = useState<ContractorSubcategory | "">("");
    const [nameSearch, setNameSearch] = useState("");
    const [results, setResults] = useState<ContractorProfile[]>([]);
    const [searching, setSearching] = useState(false);
    const [searched, setSearched] = useState(false);

    const handleEmailSearch = async () => {
        if (!email.trim()) return;
        setSearching(true);
        setSearched(false);
        try {
            const found = await searchContractors({ email: email.trim() });
            setResults(found);
            setSearched(true);
        } catch (e) {
            console.error("Search failed:", e);
        } finally {
            setSearching(false);
        }
    };

    const subcategoryOptions = selectedCategory
        ? CONTRACTOR_CATEGORIES.find((c) => c.key === selectedCategory)?.subcategories ?? []
        : [];

    const handleDirectorySearch = async () => {
        setSearching(true);
        setSearched(false);
        try {
            const found = await searchContractors({
                category: selectedCategory || undefined,
                subcategory: selectedSubcategory || undefined,
                search: nameSearch.trim() || undefined,
            });
            setResults(found);
            setSearched(true);
        } catch (e) {
            console.error("Search failed:", e);
        } finally {
            setSearching(false);
        }
    };

    const handleClose = () => {
        setResults([]);
        setSearched(false);
        setEmail("");
        setNameSearch("");
        setSelectedCategory("");
        setSelectedSubcategory("");
        onClose();
    };

    const isAlreadyAssigned = (id: string) => existingContractorIds.includes(id);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title={t("contractors.searchAssign")}>
            {/* Tabs */}
            <div className="flex border-b border-foreground/10 mb-4">
                <button
                    onClick={() => { setTab("email"); setResults([]); setSearched(false); }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        tab === "email" ? "border-primary text-primary" : "border-transparent text-foreground/50 hover:text-foreground"
                    }`}
                >
                    {t("contractors.searchByEmail")}
                </button>
                <button
                    onClick={() => { setTab("directory"); setResults([]); setSearched(false); }}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                        tab === "directory" ? "border-primary text-primary" : "border-transparent text-foreground/50 hover:text-foreground"
                    }`}
                >
                    {t("contractors.browseDirectory")}
                </button>
            </div>

            {/* Email search tab */}
            {tab === "email" && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder={t("contractors.emailPlaceholder")}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleEmailSearch()}
                            />
                        </div>
                        <Button onClick={handleEmailSearch} disabled={searching || !email.trim()}>
                            <Search size={16} />
                        </Button>
                    </div>
                </div>
            )}

            {/* Directory tab */}
            {tab === "directory" && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
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
                        {selectedCategory && subcategoryOptions.length > 0 ? (
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
                        ) : (
                            <Input
                                placeholder={t("contractors.searchByName")}
                                value={nameSearch}
                                onChange={(e) => setNameSearch(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleDirectorySearch()}
                            />
                        )}
                    </div>
                    {selectedCategory && subcategoryOptions.length > 0 && (
                        <Input
                            placeholder={t("contractors.searchByName")}
                            value={nameSearch}
                            onChange={(e) => setNameSearch(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleDirectorySearch()}
                        />
                    )}
                    <Button size="sm" onClick={handleDirectorySearch} disabled={searching}>
                        <Search size={16} className="mr-1" /> {t("common.search")}
                    </Button>
                </div>
            )}

            {/* Results */}
            {searching && (
                <div className="text-center py-6 text-foreground/50 text-sm">{t("common.searching")}...</div>
            )}

            {searched && !searching && results.length === 0 && (
                <div className="text-center py-6">
                    <Wrench size={24} className="mx-auto text-foreground/20 mb-2" />
                    <p className="text-sm text-foreground/50">{t("contractors.noResults")}</p>
                </div>
            )}

            {results.length > 0 && (
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                    {results.map((c) => {
                        const assigned = isAlreadyAssigned(c.id);
                        return (
                            <div key={c.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-foreground/10">
                                {c.logoUrl ? (
                                    <img src={c.logoUrl} alt={c.displayName} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Wrench size={16} className="text-primary" />
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{c.displayName}</p>
                                    <p className="text-xs text-foreground/50">
                                        {c.companyName}
                                        {c.categories && c.categories.length > 0
                                            ? ` · ${c.categories.slice(0, 2).map((cat) => t(`contractorCategories.categories.${cat.category}`)).join(", ")}${c.categories.length > 2 ? ` +${c.categories.length - 2}` : ""}`
                                            : ` · ${t(`contractor.specialties.${c.specialty}`)}`}
                                    </p>
                                </div>
                                {assigned ? (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                        <UserCheck size={12} /> {t("contractors.alreadyAssigned")}
                                    </span>
                                ) : (
                                    <Button size="sm" onClick={() => onAssign(c)}>
                                        {t("contractors.assign")}
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </Modal>
    );
}
