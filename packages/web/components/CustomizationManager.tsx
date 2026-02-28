import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Lock, Unlock, Copy } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Select from "./ui/Select";
import Badge from "./ui/Badge";
import ConfirmDialog from "./ui/ConfirmDialog";
import {
    getCustomizationOptions, addCustomizationOption, updateCustomizationOption,
    deleteCustomizationOption, getContractors, getFlat,
} from "../lib/firestore";
import { useToast } from "../lib/contexts/ToastContext";
import FlatScopeManager from "./FlatScopeManager";
import type { Flat, CustomizationOption, Contractor, CustomizationCategory } from "@gemmaham/shared";

interface Props {
    buildingId: string;
    flats: Flat[];
}

const emptyForm = {
    category: "other" as CustomizationCategory,
    title: "",
    description: "",
    optionsText: "",
    defaultOption: "",
    priceImpact: "",
    deadline: "",
    contractorId: "",
};

export default function CustomizationManager({ buildingId, flats }: Props) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [selectedFlat, setSelectedFlat] = useState<string>(flats[0]?.id || "");
    const [currentFlat, setCurrentFlat] = useState<Flat | null>(flats[0] || null);
    const [flatRefreshKey, setFlatRefreshKey] = useState(0);
    const [options, setOptions] = useState<CustomizationOption[]>([]);
    const [contractors, setContractors] = useState<Contractor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [copyTarget, setCopyTarget] = useState<string | null>(null);
    const [form, setForm] = useState({ ...emptyForm });

    useEffect(() => {
        (async () => {
            try {
                const c = await getContractors(buildingId);
                setContractors(c);
            } catch (e) {
                console.error("Failed to load contractors:", e);
                setContractors([]);
            }
        })();
    }, [buildingId]);

    useEffect(() => {
        if (!selectedFlat) { setLoading(false); return; }
        setLoading(true);
        (async () => {
            try {
                const [opts, flat] = await Promise.all([
                    getCustomizationOptions(selectedFlat),
                    getFlat(selectedFlat),
                ]);
                setOptions(opts);
                setCurrentFlat(flat);
            } catch (e) {
                console.error("Failed to load options:", e);
                setOptions([]);
                setCurrentFlat(null);
            } finally {
                setLoading(false);
            }
        })();
    }, [selectedFlat, flatRefreshKey]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFlat) return;
        setSubmitting(true);
        try {
            await addCustomizationOption(selectedFlat, {
                buildingId,
                contractorId: form.contractorId || null,
                category: form.category,
                title: form.title,
                description: form.description,
                options: form.optionsText.split(",").map((s) => s.trim()).filter(Boolean),
                defaultOption: form.defaultOption,
                priceImpact: form.priceImpact || null,
                deadline: form.deadline || null,
                locked: false,
            });

            const refreshed = await getCustomizationOptions(selectedFlat);
            setOptions(refreshed);
            setForm({ ...emptyForm });
            setShowForm(false);
            addToast("success", t("toast.optionAdded"));
        } catch (e) {
            console.error("Failed to add option:", e);
            addToast("error", t("toast.optionFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget || !selectedFlat) return;
        try {
            await deleteCustomizationOption(selectedFlat, deleteTarget);
            setOptions((prev) => prev.filter((o) => o.id !== deleteTarget));
        } catch (e) {
            console.error("Failed to delete option:", e);
        } finally {
            setDeleteTarget(null);
        }
    };

    const toggleLock = async (opt: CustomizationOption) => {
        try {
            await updateCustomizationOption(selectedFlat, opt.id, { locked: !opt.locked });
            setOptions((prev) => prev.map((o) => o.id === opt.id ? { ...o, locked: !o.locked } : o));
        } catch (e) {
            console.error("Failed to toggle lock:", e);
        }
    };

    const handleCopyToFlat = async () => {
        if (!copyTarget || !selectedFlat) return;
        try {
            for (const opt of options) {
                await addCustomizationOption(copyTarget, {
                    buildingId,
                    contractorId: opt.contractorId,
                    category: opt.category,
                    title: opt.title,
                    description: opt.description,
                    options: opt.options,
                    defaultOption: opt.defaultOption,
                    priceImpact: opt.priceImpact,
                    deadline: opt.deadline,
                    locked: opt.locked,
                });
            }
            addToast("success", t("customizations.copiedToUnit"));
        } catch (e) {
            console.error("Failed to copy options:", e);
            addToast("error", t("customizations.copyFailed"));
        } finally {
            setCopyTarget(null);
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

    const contractorOptions = [
        { value: "", label: t("customizations.noContractor") },
        ...contractors.map((c) => ({ value: c.id, label: `${c.name} (${c.trade})` })),
    ];

    const flatOptions = flats.map((f) => ({
        value: f.id,
        label: f.unitNumber ? `${f.unitNumber} — ${f.title}` : f.title,
    }));

    const otherFlatOptions = flats
        .filter((f) => f.id !== selectedFlat)
        .map((f) => ({
            value: f.id,
            label: f.unitNumber ? `${f.unitNumber} — ${f.title}` : f.title,
        }));

    return (
        <div>
            {/* Flat Selector */}
            {flats.length > 0 ? (
                <div className="mb-4">
                    <Select
                        label={t("customizations.selectUnit")}
                        value={selectedFlat}
                        onChange={(e) => setSelectedFlat(e.target.value)}
                        options={flatOptions}
                    />
                </div>
            ) : (
                <div className="text-center py-8">
                    <p className="text-foreground/40">{t("customizations.noUnitsYet")}</p>
                </div>
            )}

            {selectedFlat && currentFlat?.customizationConfig && (
                <FlatScopeManager
                    flat={currentFlat}
                    buildingId={buildingId}
                    onRefresh={() => setFlatRefreshKey((k) => k + 1)}
                />
            )}

            {selectedFlat && !currentFlat?.customizationConfig && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-foreground/50">{options.length} {t("customizations.options")}</p>
                        <div className="flex gap-2">
                            {options.length > 0 && otherFlatOptions.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <select
                                        value={copyTarget || ""}
                                        onChange={(e) => setCopyTarget(e.target.value || null)}
                                        className="text-xs border border-foreground/10 rounded px-2 py-1 bg-background"
                                    >
                                        <option value="">{t("customizations.copyTo")}</option>
                                        {otherFlatOptions.map((f) => (
                                            <option key={f.value} value={f.value}>{f.label}</option>
                                        ))}
                                    </select>
                                    {copyTarget && (
                                        <Button size="sm" variant="ghost" onClick={handleCopyToFlat}>
                                            <Copy size={14} className="mr-1" /> {t("customizations.copy")}
                                        </Button>
                                    )}
                                </div>
                            )}
                            <Button size="sm" onClick={() => setShowForm(!showForm)}>
                                <Plus size={16} className="mr-1" /> {t("customizations.addOption")}
                            </Button>
                        </div>
                    </div>

                    {/* Add Form */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-surface rounded-xl border-2 border-foreground/10 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <Select label={t("customizations.category")} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as CustomizationCategory }))} options={categoryOptions} />
                                <Select label={t("customizations.linkedContractor")} value={form.contractorId} onChange={(e) => setForm((f) => ({ ...f, contractorId: e.target.value }))} options={contractorOptions} />
                            </div>
                            <Input label={t("customizations.optionTitle")} placeholder={t("customizations.optionTitlePlaceholder")} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
                            <Textarea label={t("customizations.optionDesc")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                            <Input label={t("customizations.choices")} placeholder={t("customizations.choicesPlaceholder")} value={form.optionsText} onChange={(e) => setForm((f) => ({ ...f, optionsText: e.target.value }))} required />
                            <div className="grid grid-cols-3 gap-4">
                                <Input label={t("customizations.default")} placeholder={t("customizations.defaultPlaceholder")} value={form.defaultOption} onChange={(e) => setForm((f) => ({ ...f, defaultOption: e.target.value }))} required />
                                <Input label={t("customizations.priceImpact")} placeholder="+€2,000" value={form.priceImpact} onChange={(e) => setForm((f) => ({ ...f, priceImpact: e.target.value }))} />
                                <Input label={t("customizations.deadline")} type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Button type="submit" size="sm" disabled={submitting}>
                                    {submitting ? t("common.processing") : t("customizations.addOption")}
                                </Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                                    {t("common.cancel")}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Options List */}
                    {loading ? (
                        <div className="animate-pulse space-y-3"><div className="h-20 bg-foreground/5 rounded-lg" /><div className="h-20 bg-foreground/5 rounded-lg" /></div>
                    ) : options.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-foreground/40">{t("customizations.noOptions")}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {options.map((opt) => {
                                const contractor = contractors.find((c) => c.id === opt.contractorId);
                                return (
                                    <div
                                        key={opt.id}
                                        className={`p-4 bg-surface rounded-xl border-2 border-foreground/10 ${opt.locked ? "opacity-50" : ""}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {opt.locked && <Lock size={14} className="text-foreground/40" />}
                                                    <h4 className="font-medium">{opt.title}</h4>
                                                    <Badge variant="default">{t(`customizations.cat.${opt.category}`)}</Badge>
                                                    {contractor && (
                                                        <span className="text-xs text-foreground/40">→ {contractor.name}</span>
                                                    )}
                                                </div>
                                                {opt.description && <p className="text-sm text-foreground/60">{opt.description}</p>}
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {opt.options.map((choice) => (
                                                        <span
                                                            key={choice}
                                                            className={`text-xs px-2 py-1 rounded-full border ${
                                                                choice === opt.defaultOption
                                                                    ? "bg-primary/10 text-primary border-primary/30"
                                                                    : "bg-foreground/5 text-foreground/60 border-foreground/10"
                                                            }`}
                                                        >
                                                            {choice}
                                                            {choice === opt.defaultOption && " ✓"}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="flex gap-4 mt-2 text-xs text-foreground/40">
                                                    {opt.priceImpact && <span>{t("customizations.priceImpact")}: {opt.priceImpact}</span>}
                                                    {opt.deadline && <span>{t("customizations.deadline")}: {opt.deadline}</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <Button size="sm" variant="ghost" onClick={() => toggleLock(opt)} title={opt.locked ? "Unlock" : "Lock"}>
                                                    {opt.locked ? <Unlock size={14} /> : <Lock size={14} />}
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(opt.id)}>
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        </div>
                                        {opt.locked && (
                                            <p className="text-xs text-foreground/40 mt-2 flex items-center gap-1">
                                                <Lock size={12} /> {t("customizations.lockedLabel")}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title={t("customizations.deleteTitle")}
                message={t("customizations.deleteMsg")}
                confirmLabel={t("common.delete")}
            />
        </div>
    );
}
