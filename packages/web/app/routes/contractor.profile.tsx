import { useState, useEffect } from "react";
import { useOutletContext } from "react-router";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react";
import Navbar from "../../components/Navbar";
import ContractorSidebar from "../../components/ContractorSidebar";
import RoleGuard from "../../components/RoleGuard";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import { getContractorProfile, updateContractorProfile } from "../../lib/firestore";
import { uploadContractorProfileLogo } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import CategorySubcategoryPicker, { deriveCategoryKeys, deriveSubcategoryKeys } from "../../components/CategorySubcategoryPicker";
import type { AuthContext, ContractorProfile, ContractorCategorySelection } from "@gemmaham/shared";

export default function ContractorProfilePage() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { addToast } = useToast();
    const [profile, setProfile] = useState<ContractorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [displayName, setDisplayName] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [categories, setCategories] = useState<ContractorCategorySelection[]>([]);
    const [phone, setPhone] = useState("");
    const [description, setDescription] = useState("");
    const [website, setWebsite] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        if (!auth.user) return;
        (async () => {
            try {
                const p = await getContractorProfile(auth.user!.uid);
                if (p) {
                    setProfile(p);
                    setDisplayName(p.displayName);
                    setCompanyName(p.companyName);
                    // Initialize categories from profile or migrate from legacy specialty
                    if (p.categories && p.categories.length > 0) {
                        setCategories(p.categories);
                    }
                    setPhone(p.phone || "");
                    setDescription(p.description || "");
                    setWebsite(p.website || "");
                    if (p.logoUrl) setLogoPreview(p.logoUrl);
                }
            } catch (e) {
                console.error("Failed to load contractor profile:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [auth.user]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.user) return;

        if (!displayName.trim() || !companyName.trim()) {
            addToast("warning", t("toast.fillRequired"));
            return;
        }

        setSaving(true);
        try {
            let logoUrl = profile?.logoUrl || null;
            if (logoFile) {
                logoUrl = await uploadContractorProfileLogo(auth.user.uid, logoFile);
            }

            await updateContractorProfile(auth.user.uid, {
                displayName: displayName.trim(),
                companyName: companyName.trim(),
                specialty: "other",
                categories,
                categoryKeys: deriveCategoryKeys(categories),
                subcategoryKeys: deriveSubcategoryKeys(categories),
                phone: phone.trim() || null,
                description: description.trim() || null,
                website: website.trim() || null,
                logoUrl,
            });

            addToast("success", t("toast.changesSaved"));
        } catch (err) {
            console.error("Failed to save contractor profile:", err);
            addToast("error", t("toast.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <RoleGuard allowedRole="contractor">
            <div className="home">
                <Navbar />
                <div className="flex">
                    <ContractorSidebar />
                    <main className="flex-1 p-6 max-w-2xl">
                        <h1 className="text-2xl font-bold mb-6">{t("contractor.editProfile")}</h1>

                        {loading ? (
                            <div className="space-y-4">
                                <SkeletonLine className="h-10 w-full" />
                                <SkeletonLine className="h-10 w-full" />
                                <SkeletonLine className="h-10 w-full" />
                                <SkeletonBlock className="h-24 w-full" />
                            </div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-5 bg-surface rounded-xl border-2 border-foreground/10 p-6">
                                {/* Logo */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">{t("contractor.logo")}</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-lg bg-foreground/10 overflow-hidden flex items-center justify-center">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera size={20} className="text-foreground/30" />
                                            )}
                                        </div>
                                        <label className="px-4 py-2 border-2 border-foreground/10 rounded-lg cursor-pointer hover:border-foreground/20 transition-colors text-sm">
                                            {t("contractor.uploadLogo")}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <Input
                                    label={t("profile.fullName") + " *"}
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    required
                                />

                                <Input
                                    label={t("contractor.businessName") + " *"}
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                />

                                <CategorySubcategoryPicker
                                    value={categories}
                                    onChange={setCategories}
                                />

                                <Input
                                    label={t("profile.phone")}
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />

                                <Textarea
                                    label={t("contractor.description")}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                />

                                <Input
                                    label={t("contractor.website")}
                                    placeholder="https://..."
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />

                                <Button fullWidth disabled={saving}>
                                    {saving ? t("profile.saving") : t("common.save")}
                                </Button>
                            </form>
                        )}
                    </main>
                </div>
            </div>
        </RoleGuard>
    );
}
