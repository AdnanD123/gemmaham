import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight, Save } from "lucide-react";
import Button from "./ui/Button";
import Modal from "./ui/Modal";
import { OPTION_TYPES, getOptionTypesForSubcategory } from "@gemmaham/shared";
import type { ContractorSubcategory, SubcategoryScope, OptionTypeConfig, PricingTier } from "@gemmaham/shared";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    assignedSubcategories: ContractorSubcategory[];
    initialScope: SubcategoryScope[] | null;
    onSave: (scope: SubcategoryScope[]) => Promise<void>;
    readOnly?: boolean;
}

function buildInitialState(
    assignedSubcategories: ContractorSubcategory[],
    initialScope: SubcategoryScope[] | null,
): SubcategoryScope[] {
    return assignedSubcategories.map((sub) => {
        const existing = initialScope?.find((s) => s.subcategory === sub);
        if (existing) return existing;
        const optionKeys = getOptionTypesForSubcategory(sub);
        return {
            subcategory: sub,
            optionTypes: optionKeys.map((key) => ({
                optionType: key,
                tier: "base" as PricingTier,
                priceDelta: null,
            })),
        };
    });
}

export default function ContractorScopeEditor({
    isOpen, onClose, assignedSubcategories, initialScope, onSave, readOnly,
}: Props) {
    const { t } = useTranslation();
    const [scopes, setScopes] = useState<SubcategoryScope[]>(() =>
        buildInitialState(assignedSubcategories, initialScope),
    );
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);

    const toggleExpand = (sub: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(sub)) next.delete(sub); else next.add(sub);
            return next;
        });
    };

    const updateTier = (subIdx: number, optIdx: number, tier: PricingTier) => {
        setScopes((prev) => prev.map((s, si) => {
            if (si !== subIdx) return s;
            return {
                ...s,
                optionTypes: s.optionTypes.map((ot, oi) => {
                    if (oi !== optIdx) return ot;
                    return { ...ot, tier, priceDelta: tier === "upgrade" ? ot.priceDelta ?? 0 : null };
                }),
            };
        }));
    };

    const updatePriceDelta = (subIdx: number, optIdx: number, value: number) => {
        setScopes((prev) => prev.map((s, si) => {
            if (si !== subIdx) return s;
            return {
                ...s,
                optionTypes: s.optionTypes.map((ot, oi) => {
                    if (oi !== optIdx) return ot;
                    return { ...ot, priceDelta: value };
                }),
            };
        }));
    };

    const bulkSetTier = (subIdx: number, tier: PricingTier) => {
        setScopes((prev) => prev.map((s, si) => {
            if (si !== subIdx) return s;
            return {
                ...s,
                optionTypes: s.optionTypes.map((ot) => ({
                    ...ot,
                    tier,
                    priceDelta: tier === "upgrade" ? ot.priceDelta ?? 0 : null,
                })),
            };
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(scopes);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const tierColors: Record<PricingTier, string> = {
        base: "bg-green-500 text-white",
        upgrade: "bg-amber-500 text-white",
        unavailable: "bg-foreground/20 text-foreground/60",
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t("scopeConfig.title")}>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {scopes.map((scope, subIdx) => {
                    const isExpanded = expanded.has(scope.subcategory);
                    const baseCount = scope.optionTypes.filter((o) => o.tier === "base").length;
                    const upgradeCount = scope.optionTypes.filter((o) => o.tier === "upgrade").length;

                    return (
                        <div key={scope.subcategory} className="border-2 border-foreground/10 rounded-xl overflow-hidden">
                            {/* Subcategory header */}
                            <button
                                type="button"
                                onClick={() => toggleExpand(scope.subcategory)}
                                className="w-full flex items-center justify-between p-3 bg-surface hover:bg-foreground/5 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span className="font-medium text-sm">
                                        {t(`contractorCategories.subcategories.${scope.subcategory}`)}
                                    </span>
                                </div>
                                <div className="flex gap-1 text-xs">
                                    {baseCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">{baseCount} base</span>
                                    )}
                                    {upgradeCount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600">{upgradeCount} upgrade</span>
                                    )}
                                </div>
                            </button>

                            {/* Option types */}
                            {isExpanded && (
                                <div className="border-t border-foreground/10 p-3 space-y-2 bg-foreground/[0.02]">
                                    {/* Bulk actions */}
                                    {!readOnly && (
                                        <div className="flex gap-2 mb-3">
                                            <button
                                                type="button"
                                                onClick={() => bulkSetTier(subIdx, "base")}
                                                className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                                            >
                                                {t("scopeConfig.markAllBase")}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => bulkSetTier(subIdx, "unavailable")}
                                                className="text-xs px-2 py-1 rounded bg-foreground/5 text-foreground/50 hover:bg-foreground/10 transition-colors"
                                            >
                                                {t("scopeConfig.markAllUnavailable")}
                                            </button>
                                        </div>
                                    )}

                                    {scope.optionTypes.length === 0 ? (
                                        <p className="text-xs text-foreground/40">{t("scopeConfig.noOptionsForSubcategory")}</p>
                                    ) : (
                                        scope.optionTypes.map((opt, optIdx) => (
                                            <div key={opt.optionType} className="flex items-center gap-3 py-1.5">
                                                <span className="text-sm flex-1 min-w-0 truncate">
                                                    {t(`optionTypes.${opt.optionType}`)}
                                                </span>

                                                {/* 3-way toggle */}
                                                <div className="flex rounded-lg overflow-hidden border border-foreground/10 shrink-0">
                                                    {(["base", "upgrade", "unavailable"] as PricingTier[]).map((tier) => (
                                                        <button
                                                            key={tier}
                                                            type="button"
                                                            disabled={readOnly}
                                                            onClick={() => updateTier(subIdx, optIdx, tier)}
                                                            className={`px-2 py-1 text-[11px] font-medium transition-colors ${
                                                                opt.tier === tier
                                                                    ? tierColors[tier]
                                                                    : "bg-background text-foreground/40 hover:bg-foreground/5"
                                                            } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                                                        >
                                                            {t(`scopeConfig.${tier}`)}
                                                        </button>
                                                    ))}
                                                </div>

                                                {/* Price delta input for upgrades */}
                                                {opt.tier === "upgrade" && !readOnly && (
                                                    <input
                                                        type="number"
                                                        value={opt.priceDelta ?? 0}
                                                        onChange={(e) => updatePriceDelta(subIdx, optIdx, Number(e.target.value))}
                                                        placeholder={t("scopeConfig.priceDeltaPlaceholder")}
                                                        className="w-20 text-xs px-2 py-1 border border-foreground/10 rounded bg-background"
                                                    />
                                                )}
                                                {opt.tier === "upgrade" && readOnly && opt.priceDelta != null && (
                                                    <span className="text-xs text-amber-600 shrink-0">
                                                        {opt.priceDelta > 0 ? "+" : ""}{opt.priceDelta}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {!readOnly && (
                <div className="flex gap-2 pt-4 mt-4 border-t border-foreground/10">
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        <Save size={14} className="mr-1" />
                        {saving ? t("common.processing") : t("scopeConfig.saveScope")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onClose}>
                        {t("common.cancel")}
                    </Button>
                </div>
            )}
        </Modal>
    );
}
