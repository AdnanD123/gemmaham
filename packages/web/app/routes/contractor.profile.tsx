import { useState, useEffect } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Camera, Pencil, Trash2, Globe, Phone, Building2, UserCircle } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Badge from "../../components/ui/Badge";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { getContractorProfile, updateContractorProfile, deleteContractorProfile } from "../../lib/firestore";
import { uploadContractorProfileLogo } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import CategorySubcategoryPicker, { deriveCategoryKeys, deriveSubcategoryKeys } from "../../components/CategorySubcategoryPicker";
import type { AuthContext, ContractorProfile, ContractorCategorySelection } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

export default function ContractorProfilePage() {
    const { t } = useTranslation();
    const auth = useOutletContext<AuthContext>();
    const { addToast } = useToast();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<ContractorProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);

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
                    if (p.categories && p.categories.length > 0) {
                        setCategories(p.categories);
                    }
                    setPhone(p.phone || "");
                    setDescription(p.description || "");
                    setWebsite(p.website || "");
                    if (p.logoUrl) setLogoPreview(p.logoUrl);
                } else {
                    setEditing(true);
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
        let savedWithoutLogo = false;
        try {
            let logoUrl = profile?.logoUrl || null;
            if (logoFile) {
                try {
                    logoUrl = await uploadContractorProfileLogo(auth.user.uid, logoFile);
                } catch {
                    savedWithoutLogo = true;
                }
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

            // Refetch so view mode always shows accurate saved data
            const fresh = await getContractorProfile(auth.user.uid);
            if (fresh) setProfile(fresh);

            setLogoFile(null);
            setEditing(false);
            addToast("success", savedWithoutLogo ? t("toast.savedWithoutLogo") : t("toast.changesSaved"));
        } catch (err) {
            console.error("Failed to save contractor profile:", err);
            addToast("error", t("toast.saveFailed"));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!auth.user) return;
        setDeleting(true);
        try {
            await deleteContractorProfile(auth.user.uid);
            addToast("success", t("toast.profileDeleted"));
            navigate("/contractor/dashboard");
        } catch (err) {
            console.error("Failed to delete contractor profile:", err);
            addToast("error", t("toast.deleteFailed"));
        } finally {
            setDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    return (
        <RoleGuard allowedRole="contractor">
            <PageTransition>
            <div className="home">
                <div className="flex">
                    <main className="flex-1 p-6 max-w-2xl">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold">{t("contractor.editProfile")}</h1>
                        </div>

                        <ContentLoader loading={loading} skeleton={
                            <div className="space-y-4">
                                <SkeletonLine className="h-10 w-full" />
                                <SkeletonLine className="h-10 w-full" />
                                <SkeletonLine className="h-10 w-full" />
                                <SkeletonBlock className="h-24 w-full" />
                            </div>
                        }>
                        {editing ? (
                            <form onSubmit={handleSave} className="space-y-5 bg-surface rounded-2xl border border-foreground/6 p-6">
                                {/* Logo */}
                                <div>
                                    <label className="block text-sm font-medium mb-2">{t("contractor.logo")}</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-lg bg-foreground/10 overflow-hidden flex items-center justify-center">
                                            {logoPreview ? (
                                                <img loading="lazy" src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <Camera size={20} className="text-foreground/30" />
                                            )}
                                        </div>
                                        <label className="px-4 py-2 border border-foreground/6 rounded-lg cursor-pointer hover:border-foreground/20 transition-colors text-sm">
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

                                <div className="flex gap-3">
                                    <Button fullWidth disabled={saving}>
                                        {saving ? t("profile.saving") : t("common.save")}
                                    </Button>
                                    {profile && (
                                        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                                            {t("common.cancel")}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        ) : (
                            /* ── View mode ── */
                            <div className="relative bg-surface rounded-2xl border border-foreground/6 p-6 space-y-6">
                                {/* Header: logo + name */}
                                <div className="flex items-center gap-4">
                                    <div className="w-20 h-20 rounded-xl bg-foreground/10 overflow-hidden flex items-center justify-center shrink-0">
                                        {logoPreview ? (
                                            <img loading="lazy" src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera size={28} className="text-foreground/30" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">{profile?.displayName || "—"}</h2>
                                        <p className="text-foreground/60 flex items-center gap-1 mt-0.5">
                                            <Building2 size={14} />
                                            {profile?.companyName || "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-foreground/6" />

                                {/* Details */}
                                <div className="space-y-4">
                                    {profile?.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone size={16} className="text-foreground/40 shrink-0" />
                                            <span>{profile.phone}</span>
                                        </div>
                                    )}

                                    {profile?.website && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Globe size={16} className="text-foreground/40 shrink-0" />
                                            <a href={profile.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                                {profile.website}
                                            </a>
                                        </div>
                                    )}

                                    {profile?.description && (
                                        <div className="flex gap-3 text-sm">
                                            <UserCircle size={16} className="text-foreground/40 shrink-0 mt-0.5" />
                                            <p className="text-foreground/80">{profile.description}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Categories */}
                                {profile?.categories && profile.categories.length > 0 && (
                                    <>
                                        <div className="border-t border-foreground/6" />
                                        <div>
                                            <p className="text-xs font-medium text-foreground/50 uppercase tracking-wide mb-2">
                                                {t("contractorCategories.label")}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {profile.categories.map((cat) => (
                                                    <Badge key={cat.category} variant="default">
                                                        {t(`contractorCategories.categories.${cat.category}`)}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                )}

                                {!profile?.phone && !profile?.website && !profile?.description && !profile?.categories?.length && (
                                    <p className="text-sm text-foreground/40 text-center py-4">
                                        {t("contractor.noProfileData")}
                                    </p>
                                )}

                                {/* Bottom-right action buttons */}
                                <div className="flex justify-end gap-1 pt-2">
                                    <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                                        <Pencil size={15} />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                                        <Trash2 size={15} />
                                    </Button>
                                </div>
                            </div>
                        )}
                        </ContentLoader>
                    </main>
                </div>
            </div>
            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title={t("contractor.deleteProfileTitle")}
                message={t("contractor.deleteProfileMsg")}
                confirmLabel={t("common.delete")}
                loading={deleting}
            />
            </PageTransition>
        </RoleGuard>
    );
}
