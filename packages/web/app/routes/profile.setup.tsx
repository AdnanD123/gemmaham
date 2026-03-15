import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Box, Camera, Lock } from "lucide-react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { updateUserProfile, updateContractorProfile } from "../../lib/firestore";
import { uploadProfilePhoto, uploadContractorProfileLogo } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import CategorySubcategoryPicker, { deriveCategoryKeys, deriveSubcategoryKeys } from "../../components/CategorySubcategoryPicker";
import type { AuthContext, ContractorCategorySelection } from "@gemmaham/shared";

export default function ProfileSetup() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const isContractor = auth.role === "contractor";

    const [displayName, setDisplayName] = useState(auth.user?.displayName || "");
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Contractor-specific fields
    const [companyName, setCompanyName] = useState("");
    const [categories, setCategories] = useState<ContractorCategorySelection[]>([]);
    const [description, setDescription] = useState("");
    const [website, setWebsite] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!auth.user) return;

        if (isContractor) {
            if (!displayName.trim() || !phone.trim() || !companyName.trim() || categories.length === 0) {
                addToast("warning", t("toast.fillRequired"));
                return;
            }
        } else {
            const TEST_MODE = import.meta.env.VITE_EMAIL_VERIFICATION !== "true";
            if (!displayName.trim() || !phone.trim() || !address.trim() || (!TEST_MODE && !photoFile)) {
                addToast("warning", t("toast.fillRequired"));
                return;
            }
        }

        setSubmitting(true);
        try {
            const TEST_MODE = import.meta.env.VITE_EMAIL_VERIFICATION !== "true";
            if (isContractor) {
                // Upload logo if provided (skipped in test mode)
                let logoUrl: string | null = null;
                if (logoFile && !TEST_MODE) {
                    logoUrl = await uploadContractorProfileLogo(auth.user.uid, logoFile);
                }

                // Upload profile photo if provided (skipped in test mode)
                let photoURL: string | null = null;
                if (photoFile && !TEST_MODE) {
                    photoURL = await uploadProfilePhoto(auth.user.uid, photoFile);
                }

                // Update contractor profile
                await updateContractorProfile(auth.user.uid, {
                    displayName: displayName.trim(),
                    companyName: companyName.trim(),
                    specialty: "other",
                    categories,
                    categoryKeys: deriveCategoryKeys(categories),
                    subcategoryKeys: deriveSubcategoryKeys(categories),
                    phone: phone.trim(),
                    description: description.trim() || null,
                    website: website.trim() || null,
                    logoUrl,
                    profileCompleted: true,
                });

                // Update user profile
                await updateUserProfile(auth.user.uid, {
                    displayName: displayName.trim(),
                    phone: phone.trim(),
                    address: address.trim() || null,
                    photoURL,
                    profileCompleted: true,
                });

                await auth.refreshProfile();
                addToast("success", t("toast.profileComplete"));
                navigate("/contractor/dashboard");
            } else {
                const photoURL = (photoFile && !TEST_MODE)
                    ? await uploadProfilePhoto(auth.user.uid, photoFile)
                    : null;

                await updateUserProfile(auth.user.uid, {
                    displayName: displayName.trim(),
                    phone: phone.trim(),
                    address: address.trim(),
                    photoURL,
                    profileCompleted: true,
                });

                await auth.refreshProfile();
                addToast("success", t("toast.profileComplete"));

                if (auth.role === "company") {
                    navigate("/company/dashboard");
                } else {
                    navigate("/user/dashboard");
                }
            }
        } catch (err) {
            console.error("Profile setup error:", err);
            addToast("error", t("toast.profileFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    if (!auth.user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 mb-4">
                        <Box className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold">Gemmaham</span>
                    </div>
                    <h1 className="text-3xl font-bold mb-2">{t("profile.completeTitle")}</h1>
                    <p className="text-foreground/60">
                        {t("profile.completeDesc")}
                    </p>
                </div>

                <div className="bg-surface border-2 border-foreground/10 rounded-xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Photo Upload */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full bg-foreground/10 overflow-hidden flex items-center justify-center">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <Camera size={32} className="text-foreground/30" />
                                    )}
                                </div>
                                <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/80 transition-colors">
                                    <Camera size={14} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-foreground/40">
                                {t("profile.profilePhoto")} {isContractor ? "" : "*"}
                            </p>
                        </div>

                        <Input
                            label={t("profile.fullName") + " *"}
                            placeholder={t("profile.namePlaceholder")}
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />

                        <Input
                            label={t("profile.phone") + " *"}
                            type="tel"
                            placeholder={t("profile.phonePlaceholder")}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />

                        {isContractor ? (
                            <>
                                <Input
                                    label={t("contractor.businessName") + " *"}
                                    placeholder={t("contractor.businessNamePlaceholder")}
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                />

                                <CategorySubcategoryPicker
                                    value={categories}
                                    onChange={setCategories}
                                />

                                <Textarea
                                    label={t("contractor.description")}
                                    placeholder={t("contractor.descriptionPlaceholder")}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                />

                                <Input
                                    label={t("contractor.website")}
                                    placeholder="https://..."
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />

                                {/* Logo Upload */}
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
                                    label={t("profile.address")}
                                    placeholder={t("profile.addressPlaceholder")}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                            </>
                        ) : (
                            <>
                                <Input
                                    label={t("profile.address") + " *"}
                                    placeholder={t("profile.addressPlaceholder")}
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    required
                                />

                                {/* Future-ready fields (disabled) */}
                                <div className="border-t border-foreground/10 pt-5 mt-5">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Lock size={14} className="text-foreground/30" />
                                        <span className="text-xs font-medium text-foreground/40 uppercase tracking-wide">{t("profile.comingSoon")}</span>
                                    </div>

                                    <div className="space-y-3 opacity-50 pointer-events-none">
                                        <Input
                                            label={t("profile.ssn")}
                                            placeholder="1234567890123"
                                            value=""
                                            onChange={() => {}}
                                            disabled
                                        />

                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-foreground/50">
                                                {t("profile.documents")}
                                            </label>
                                            <div className="border-2 border-dashed border-foreground/10 rounded-lg p-4 text-center">
                                                <p className="text-xs text-foreground/30">{t("profile.documentsPlaceholder")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <Button fullWidth disabled={submitting}>
                            {submitting ? t("profile.saving") : t("profile.completeBtn")}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
