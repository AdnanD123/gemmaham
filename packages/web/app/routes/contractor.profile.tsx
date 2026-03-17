import { useState, useEffect, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Camera, Pencil, Trash2, Globe, Phone, Building2, UserCircle, FileText, Image, Upload, X, Shield, Award, ScrollText } from "lucide-react";
import RoleGuard from "../../components/RoleGuard";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import Select from "../../components/ui/Select";
import Badge from "../../components/ui/Badge";
import AvailabilityBadge from "../../components/AvailabilityBadge";
import { SkeletonLine, SkeletonBlock } from "../../components/ui/Skeleton";
import { ContentLoader } from "../../components/ui/ContentLoader";
import ConfirmDialog from "../../components/ui/ConfirmDialog";
import { getContractorProfile, updateContractorProfile, deleteContractorProfile } from "../../lib/firestore";
import { uploadContractorProfileLogo, uploadContractorDocument, uploadContractorPortfolio } from "../../lib/storage";
import { useToast } from "../../lib/contexts/ToastContext";
import CategorySubcategoryPicker, { deriveCategoryKeys, deriveSubcategoryKeys } from "../../components/CategorySubcategoryPicker";
import type { AuthContext, ContractorProfile, ContractorCategorySelection, ContractorAvailability, ContractorDocument, ContractorDocumentType, ContractorPortfolioItem } from "@gemmaham/shared";
import { PageTransition } from "../../components/ui/PageTransition";

const DOC_TYPE_ICONS: Record<ContractorDocumentType, React.ReactNode> = {
    certificate: <Award size={16} className="text-primary" />,
    insurance: <Shield size={16} className="text-secondary" />,
    license: <ScrollText size={16} className="text-amber-600" />,
    other: <FileText size={16} className="text-foreground/50" />,
};

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
    const [availability, setAvailability] = useState<ContractorAvailability | "">("");
    const [availableFrom, setAvailableFrom] = useState("");
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    // Documents state
    const [documents, setDocuments] = useState<ContractorDocument[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [docType, setDocType] = useState<ContractorDocumentType>("certificate");
    const docInputRef = useRef<HTMLInputElement>(null);

    // Portfolio state
    const [portfolio, setPortfolio] = useState<ContractorPortfolioItem[]>([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [editingPortfolioIdx, setEditingPortfolioIdx] = useState<number | null>(null);
    const [portfolioCaption, setPortfolioCaption] = useState("");
    const [portfolioProjectName, setPortfolioProjectName] = useState("");
    const portfolioInputRef = useRef<HTMLInputElement>(null);

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
                    setAvailability(p.availability || "");
                    setAvailableFrom(p.availableFrom || "");
                    if (p.logoUrl) setLogoPreview(p.logoUrl);
                    setDocuments(p.documents || []);
                    setPortfolio(p.portfolio || []);
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
                availability: availability || undefined,
                availableFrom: availability === "busy" && availableFrom ? availableFrom : undefined,
                logoUrl,
            });

            // Refetch so view mode always shows accurate saved data
            const fresh = await getContractorProfile(auth.user.uid);
            if (fresh) {
                setProfile(fresh);
                setDocuments(fresh.documents || []);
                setPortfolio(fresh.portfolio || []);
            }

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

    /* ── Document handlers ── */
    const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !auth.user) return;
        setUploadingDoc(true);
        try {
            const url = await uploadContractorDocument(auth.user.uid, file);
            const newDoc: ContractorDocument = {
                name: file.name,
                url,
                type: docType,
                uploadedAt: new Date().toISOString(),
            };
            const updated = [...documents, newDoc];
            await updateContractorProfile(auth.user.uid, { documents: updated });
            setDocuments(updated);
            addToast("success", t("toast.changesSaved"));
        } catch (err) {
            console.error("Failed to upload document:", err);
            addToast("error", t("toast.saveFailed"));
        } finally {
            setUploadingDoc(false);
            if (docInputRef.current) docInputRef.current.value = "";
        }
    };

    const handleDocDelete = async (idx: number) => {
        if (!auth.user) return;
        const updated = documents.filter((_, i) => i !== idx);
        try {
            await updateContractorProfile(auth.user.uid, { documents: updated });
            setDocuments(updated);
            addToast("success", t("toast.changesSaved"));
        } catch (err) {
            console.error("Failed to delete document:", err);
            addToast("error", t("toast.saveFailed"));
        }
    };

    /* ── Portfolio handlers ── */
    const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !auth.user) return;
        if (portfolio.length >= 8) {
            addToast("warning", "Maximum 8 portfolio photos.");
            return;
        }
        setUploadingPhoto(true);
        try {
            const url = await uploadContractorPortfolio(auth.user.uid, file);
            const newItem: ContractorPortfolioItem = { url };
            const updated = [...portfolio, newItem];
            await updateContractorProfile(auth.user.uid, { portfolio: updated });
            setPortfolio(updated);
            addToast("success", t("toast.changesSaved"));
        } catch (err) {
            console.error("Failed to upload portfolio photo:", err);
            addToast("error", t("toast.saveFailed"));
        } finally {
            setUploadingPhoto(false);
            if (portfolioInputRef.current) portfolioInputRef.current.value = "";
        }
    };

    const handlePortfolioDelete = async (idx: number) => {
        if (!auth.user) return;
        const updated = portfolio.filter((_, i) => i !== idx);
        try {
            await updateContractorProfile(auth.user.uid, { portfolio: updated });
            setPortfolio(updated);
            addToast("success", t("toast.changesSaved"));
        } catch (err) {
            console.error("Failed to delete portfolio photo:", err);
            addToast("error", t("toast.saveFailed"));
        }
    };

    const handlePortfolioMeta = async (idx: number) => {
        if (!auth.user) return;
        const updated = portfolio.map((item, i) =>
            i === idx
                ? { ...item, caption: portfolioCaption.trim() || undefined, projectName: portfolioProjectName.trim() || undefined }
                : item,
        );
        try {
            await updateContractorProfile(auth.user.uid, { portfolio: updated });
            setPortfolio(updated);
            setEditingPortfolioIdx(null);
            addToast("success", t("toast.changesSaved"));
        } catch (err) {
            console.error("Failed to update portfolio item:", err);
            addToast("error", t("toast.saveFailed"));
        }
    };

    const docTypeLabel = (type: ContractorDocumentType) => {
        const labels: Record<ContractorDocumentType, string> = {
            certificate: t("contractor.certificate"),
            insurance: t("contractor.insurance"),
            license: t("contractor.license"),
            other: t("contractor.other"),
        };
        return labels[type];
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

                                {/* Availability */}
                                <Select
                                    label={t("contractor.availability")}
                                    value={availability}
                                    onChange={(e) => setAvailability(e.target.value as ContractorAvailability | "")}
                                    options={[
                                        { value: "", label: t("contractor.notSpecified") },
                                        { value: "available", label: t("contractor.available") },
                                        { value: "busy", label: t("contractor.busy") },
                                        { value: "unavailable", label: t("contractor.unavailable") },
                                    ]}
                                />
                                {availability === "busy" && (
                                    <Input
                                        label={t("contractor.availableFrom")}
                                        type="date"
                                        value={availableFrom}
                                        onChange={(e) => setAvailableFrom(e.target.value)}
                                    />
                                )}

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
                                        <h2 className="text-xl font-bold">{profile?.displayName || "\u2014"}</h2>
                                        <p className="text-foreground/60 flex items-center gap-1 mt-0.5">
                                            <Building2 size={14} />
                                            {profile?.companyName || "\u2014"}
                                        </p>
                                        <div className="mt-1">
                                            <AvailabilityBadge availability={profile?.availability} availableFrom={profile?.availableFrom} />
                                        </div>
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

                        {/* ── Documents Section ── */}
                        {profile && (
                            <div className="mt-6 bg-surface rounded-2xl border border-foreground/6 p-6 space-y-4">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <FileText size={20} />
                                    {t("contractor.documents")}
                                </h2>

                                {documents.length === 0 ? (
                                    <p className="text-sm text-foreground/40 text-center py-4">
                                        {t("contractor.noDocuments")}
                                    </p>
                                ) : (
                                    <div className="space-y-2">
                                        {documents.map((doc, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center gap-3 p-3 bg-background rounded-xl border border-foreground/6"
                                            >
                                                <div className="p-2 rounded-lg bg-foreground/4">
                                                    {DOC_TYPE_ICONS[doc.type]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <a
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-medium text-sm truncate block hover:text-primary transition-colors"
                                                    >
                                                        {doc.name}
                                                    </a>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="default">{docTypeLabel(doc.type)}</Badge>
                                                        <span className="text-xs text-foreground/40">
                                                            {new Date(doc.uploadedAt).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDocDelete(idx)}
                                                    className="p-1.5 rounded-lg hover:bg-foreground/6 transition-colors text-foreground/40 hover:text-red-500"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload document */}
                                <div className="flex items-center gap-3 pt-2">
                                    <select
                                        value={docType}
                                        onChange={(e) => setDocType(e.target.value as ContractorDocumentType)}
                                        className="text-sm border border-foreground/6 rounded-lg px-3 py-2 bg-background"
                                    >
                                        <option value="certificate">{t("contractor.certificate")}</option>
                                        <option value="insurance">{t("contractor.insurance")}</option>
                                        <option value="license">{t("contractor.license")}</option>
                                        <option value="other">{t("contractor.other")}</option>
                                    </select>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-foreground/6 rounded-lg cursor-pointer hover:border-foreground/20 transition-colors text-sm">
                                        <Upload size={14} />
                                        {uploadingDoc ? "..." : t("contractor.uploadDocument")}
                                        <input
                                            ref={docInputRef}
                                            type="file"
                                            accept=".pdf,.doc,.docx,image/*"
                                            onChange={handleDocUpload}
                                            disabled={uploadingDoc}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* ── Portfolio Section ── */}
                        {profile && (
                            <div className="mt-6 bg-surface rounded-2xl border border-foreground/6 p-6 space-y-4">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Image size={20} />
                                    {t("contractor.portfolio")}
                                </h2>

                                {portfolio.length === 0 ? (
                                    <p className="text-sm text-foreground/40 text-center py-4">
                                        {t("contractor.noPortfolio")}
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {portfolio.map((item, idx) => (
                                            <div key={idx} className="relative group rounded-xl overflow-hidden border border-foreground/6">
                                                <img
                                                    loading="lazy"
                                                    src={item.url}
                                                    alt={item.caption || `Portfolio ${idx + 1}`}
                                                    className="w-full aspect-square object-cover"
                                                />
                                                {/* Hover overlay with caption/project name */}
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                                    {item.projectName && (
                                                        <p className="text-white text-xs font-bold truncate">{item.projectName}</p>
                                                    )}
                                                    {item.caption && (
                                                        <p className="text-white/80 text-xs truncate">{item.caption}</p>
                                                    )}
                                                    <div className="flex gap-1 mt-1">
                                                        <button
                                                            onClick={() => {
                                                                setEditingPortfolioIdx(idx);
                                                                setPortfolioCaption(item.caption || "");
                                                                setPortfolioProjectName(item.projectName || "");
                                                            }}
                                                            className="p-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                                                        >
                                                            <Pencil size={12} className="text-white" />
                                                        </button>
                                                        <button
                                                            onClick={() => handlePortfolioDelete(idx)}
                                                            className="p-1 rounded bg-white/20 hover:bg-red-500/80 transition-colors"
                                                        >
                                                            <Trash2 size={12} className="text-white" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Edit portfolio item meta */}
                                {editingPortfolioIdx !== null && (
                                    <div className="p-4 bg-background rounded-xl border border-foreground/6 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">{t("contractor.portfolio")} #{editingPortfolioIdx + 1}</p>
                                            <button onClick={() => setEditingPortfolioIdx(null)} className="p-1 hover:bg-foreground/6 rounded">
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <Input
                                            label={t("contractor.projectName")}
                                            value={portfolioProjectName}
                                            onChange={(e) => setPortfolioProjectName(e.target.value)}
                                        />
                                        <Input
                                            label={t("contractor.caption")}
                                            value={portfolioCaption}
                                            onChange={(e) => setPortfolioCaption(e.target.value)}
                                        />
                                        <Button size="sm" onClick={() => handlePortfolioMeta(editingPortfolioIdx)}>
                                            {t("common.save")}
                                        </Button>
                                    </div>
                                )}

                                {/* Upload portfolio photo */}
                                {portfolio.length < 8 && (
                                    <label className="inline-flex items-center gap-2 px-4 py-2 border border-foreground/6 rounded-lg cursor-pointer hover:border-foreground/20 transition-colors text-sm">
                                        <Upload size={14} />
                                        {uploadingPhoto ? "..." : t("contractor.uploadPortfolio")}
                                        <input
                                            ref={portfolioInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePortfolioUpload}
                                            disabled={uploadingPhoto}
                                            className="hidden"
                                        />
                                    </label>
                                )}
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
