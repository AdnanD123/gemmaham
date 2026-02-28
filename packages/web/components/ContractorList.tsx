import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Plus, Pencil, Trash2, Globe, Phone, Mail, Search, UserCheck, Settings2 } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Select from "./ui/Select";
import Badge from "./ui/Badge";
import ConfirmDialog from "./ui/ConfirmDialog";
import ContractorSearch from "./ContractorSearch";
import ContractorScopeEditor from "./ContractorScopeEditor";
import {
    addContractor, getContractors, updateContractor, deleteContractor,
    lockCustomizationsByContractor, createNotification, updateContractorScope,
} from "../lib/firestore";
import { uploadContractorLogo } from "../lib/storage";
import { useToast } from "../lib/contexts/ToastContext";
import CategorySubcategoryPicker, { deriveCategoryKeys, deriveSubcategoryKeys } from "./CategorySubcategoryPicker";
import type {
    Contractor, ContractorStatus, CustomizationCategory, ContractorProfile,
    ContractorCategorySelection,
} from "@gemmaham/shared";

interface Props {
    buildingId: string;
    companyId: string;
}

const emptyForm = {
    name: "",
    trade: "",
    category: "other" as CustomizationCategory,
    description: "",
    phone: "",
    email: "",
    website: "",
    status: "upcoming" as ContractorStatus,
    progressPercent: "0",
    startDate: "",
    endDate: "",
};

export default function ContractorList({ buildingId, companyId }: Props) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [showSearch, setShowSearch] = useState(false);
    const [scopeTarget, setScopeTarget] = useState<Contractor | null>(null);

    const handleSaveScope = async (scope: import("@gemmaham/shared").SubcategoryScope[]) => {
        if (!scopeTarget) return;
        await updateContractorScope(buildingId, scopeTarget.id, scope);
        const refreshed = await getContractors(buildingId);
        setContractors(refreshed);
        setScopeTarget(null);
        addToast("success", t("scopeConfig.scopeSaved"));
    };

    useEffect(() => {
        (async () => {
            try {
                const result = await getContractors(buildingId);
                setContractors(result);
            } catch (e) {
                console.error("Failed to load contractors:", e);
                setContractors([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [buildingId]);

    const resetForm = () => {
        setForm({ ...emptyForm });
        setLogoFile(null);
        setEditing(null);
        setShowForm(false);
    };

    const startEdit = (c: Contractor) => {
        setForm({
            name: c.name,
            trade: c.trade,
            category: c.category,
            description: c.description,
            phone: c.phone || "",
            email: c.email || "",
            website: c.website || "",
            status: c.status,
            progressPercent: String(c.progressPercent),
            startDate: c.startDate || "",
            endDate: c.endDate || "",
        });
        setEditing(c.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let logoUrl: string | null = null;
            if (logoFile) {
                logoUrl = await uploadContractorLogo(companyId, buildingId, logoFile);
            }

            const data = {
                companyId,
                contractorUserId: null as string | null,
                name: form.name,
                trade: form.trade,
                category: form.category,
                assignedCategory: null,
                assignedSubcategories: [] as string[],
                description: form.description,
                phone: form.phone || null,
                email: form.email || null,
                website: form.website || null,
                status: form.status,
                progressPercent: Number(form.progressPercent),
                startDate: form.startDate || null,
                endDate: form.endDate || null,
                ...(logoUrl ? { logoUrl } : {}),
            };

            if (editing) {
                const prev = contractors.find((c) => c.id === editing);
                await updateContractor(buildingId, editing, data);

                // Auto-lock if status changed to completed
                if (prev && prev.status !== "completed" && form.status === "completed") {
                    const locked = await lockCustomizationsByContractor(buildingId, editing);
                    if (locked > 0) {
                        addToast("info", t("contractors.lockedOptions", { count: locked }));
                    }
                }
            } else {
                await addContractor(buildingId, {
                    ...data,
                    logoUrl: logoUrl || null,
                });
            }

            const refreshed = await getContractors(buildingId);
            setContractors(refreshed);
            resetForm();
            addToast("success", editing ? t("toast.contractorUpdated") : t("toast.contractorAdded"));
        } catch (e) {
            console.error("Failed to save contractor:", e);
            addToast("error", t("toast.contractorFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteContractor(buildingId, deleteTarget);
            setContractors((prev) => prev.filter((c) => c.id !== deleteTarget));
            addToast("success", t("toast.contractorDeleted"));
        } catch (e) {
            console.error("Failed to delete contractor:", e);
        } finally {
            setDeleteTarget(null);
        }
    };

    const categoryOptions = [
        { value: "flooring", label: t("customizations.cat.flooring") },
        { value: "kitchen", label: t("customizations.cat.kitchen") },
        { value: "bathroom", label: t("customizations.cat.bathroom") },
        { value: "walls", label: t("customizations.cat.walls") },
        { value: "electrical", label: t("customizations.cat.electrical") },
        { value: "other", label: t("customizations.cat.other") },
    ];

    const statusOptions = [
        { value: "upcoming", label: t("contractors.status.upcoming") },
        { value: "in_progress", label: t("contractors.status.in_progress") },
        { value: "completed", label: t("contractors.status.completed") },
    ];

    const handleAssignRegistered = async (profile: ContractorProfile) => {
        try {
            await addContractor(buildingId, {
                companyId,
                contractorUserId: profile.id,
                name: profile.displayName,
                trade: profile.companyName,
                category: profile.specialty,
                assignedCategory: profile.categories?.[0]?.category ?? null,
                assignedSubcategories: profile.categories
                    ? profile.categories.flatMap((c) => c.subcategories)
                    : [],
                description: profile.description || "",
                phone: profile.phone,
                email: profile.email,
                website: profile.website,
                logoUrl: profile.logoUrl,
                status: "upcoming",
                progressPercent: 0,
                startDate: null,
                endDate: null,
            });

            // Send notification to contractor
            await createNotification(profile.id, {
                userId: profile.id,
                type: "contractor_assigned",
                title: t("notifications.contractorAssigned"),
                message: t("notifications.contractorAssignedMsg"),
                linkTo: `/contractor/buildings/${buildingId}`,
                read: false,
            });

            const refreshed = await getContractors(buildingId);
            setContractors(refreshed);
            setShowSearch(false);
            addToast("success", t("toast.contractorAssigned"));
        } catch (e) {
            console.error("Failed to assign contractor:", e);
            addToast("error", t("toast.contractorFailed"));
        }
    };

    if (loading) {
        return <div className="animate-pulse space-y-4"><div className="h-32 bg-foreground/5 rounded-lg" /><div className="h-32 bg-foreground/5 rounded-lg" /></div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-foreground/50">{contractors.length} {t("contractors.total")}</p>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setShowSearch(true)}>
                        <Search size={16} className="mr-1" /> {t("contractors.searchAssign")}
                    </Button>
                    <Button size="sm" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                        <Plus size={16} className="mr-1" /> {t("contractors.manualEntry")}
                    </Button>
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-surface rounded-xl border-2 border-foreground/10 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Input label={t("contractors.name")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                        <Input label={t("contractors.trade")} placeholder={t("contractors.tradePlaceholder")} value={form.trade} onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value }))} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select label={t("contractors.category")} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as CustomizationCategory }))} options={categoryOptions} />
                        <Select label={t("contractors.statusLabel")} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ContractorStatus }))} options={statusOptions} />
                    </div>
                    <Textarea label={t("contractors.description")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                    <div className="grid grid-cols-3 gap-4">
                        <Input label={t("contractors.phone")} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                        <Input label={t("contractors.email")} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                        <Input label={t("contractors.website")} value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label={t("construction.progress") + " %"} type="number" min="0" max="100" value={form.progressPercent} onChange={(e) => setForm((f) => ({ ...f, progressPercent: e.target.value }))} />
                        <Input label={t("contractors.startDate")} type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
                        <Input label={t("contractors.endDate")} type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("contractors.logo")}</label>
                        <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="text-sm" />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <Button type="submit" size="sm" disabled={submitting}>
                            {submitting ? t("common.processing") : editing ? t("common.save") : t("contractors.addContractor")}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
                            {t("common.cancel")}
                        </Button>
                    </div>
                </form>
            )}

            {/* Contractor Cards */}
            {contractors.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-foreground/40">{t("contractors.noContractors")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contractors.map((c) => {
                        const isCompleted = c.status === "completed";
                        return (
                            <div
                                key={c.id}
                                className={`p-4 bg-surface rounded-xl border-2 border-foreground/10 transition-opacity ${isCompleted ? "opacity-50" : ""}`}
                            >
                                <div className="flex items-start gap-3">
                                    {c.logoUrl ? (
                                        <img src={c.logoUrl} alt={c.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-foreground/10 flex items-center justify-center shrink-0 text-lg">
                                            🔧
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {c.contractorUserId ? (
                                                <Link to={`/contractors/${c.contractorUserId}`} className="font-medium truncate text-primary hover:underline">{c.name}</Link>
                                            ) : (
                                                <h3 className="font-medium truncate">{c.name}</h3>
                                            )}
                                            <Badge variant={c.status}>{t(`contractors.status.${c.status}`)}</Badge>
                                            {c.contractorUserId && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600 font-medium">
                                                    <UserCheck size={10} /> {t("contractors.registered")}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-foreground/50">{c.trade}</p>
                                        {c.description && <p className="text-sm text-foreground/60 mt-1 line-clamp-2">{c.description}</p>}
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-xs text-foreground/50 mb-1">
                                        <span>{t("construction.progress")}</span>
                                        <span>{c.progressPercent}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-foreground/10 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${isCompleted ? "bg-green-500" : "bg-primary"}`}
                                            style={{ width: `${c.progressPercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Contact info */}
                                <div className="flex gap-3 mt-3 text-xs text-foreground/50">
                                    {c.phone && <span className="flex items-center gap-1"><Phone size={12} /> {c.phone}</span>}
                                    {c.email && <span className="flex items-center gap-1"><Mail size={12} /> {c.email}</span>}
                                    {c.website && <span className="flex items-center gap-1"><Globe size={12} /> {c.website}</span>}
                                </div>

                                {/* Scope badge */}
                                {c.assignedSubcategories && c.assignedSubcategories.length > 0 && (
                                    <div className="mt-2">
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                            c.scopeConfig && c.scopeConfig.length > 0
                                                ? "bg-green-500/10 text-green-600"
                                                : "bg-foreground/5 text-foreground/40"
                                        }`}>
                                            <Settings2 size={10} />
                                            {c.scopeConfig && c.scopeConfig.length > 0
                                                ? t("scopeConfig.scopeConfigured")
                                                : t("scopeConfig.noScope")}
                                        </span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 mt-3">
                                    {c.assignedSubcategories && c.assignedSubcategories.length > 0 && (
                                        <Button size="sm" variant="outline" onClick={() => setScopeTarget(c)}>
                                            <Settings2 size={14} className="mr-1" /> {t("scopeConfig.configureScope")}
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>
                                        <Pencil size={14} />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(c.id)}>
                                        <Trash2 size={14} />
                                    </Button>
                                </div>

                                {isCompleted && (
                                    <p className="text-xs text-green-600 font-medium mt-2">{t("contractors.workComplete")}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title={t("contractors.deleteTitle")}
                message={t("contractors.deleteMsg")}
                confirmLabel={t("common.delete")}
            />

            <ContractorSearch
                isOpen={showSearch}
                onClose={() => setShowSearch(false)}
                onAssign={handleAssignRegistered}
                existingContractorIds={contractors.filter((c) => c.contractorUserId).map((c) => c.contractorUserId!)}
            />

            {scopeTarget && (
                <ContractorScopeEditor
                    isOpen={!!scopeTarget}
                    onClose={() => setScopeTarget(null)}
                    assignedSubcategories={scopeTarget.assignedSubcategories}
                    initialScope={scopeTarget.scopeConfig}
                    onSave={handleSaveScope}
                />
            )}
        </div>
    );
}
