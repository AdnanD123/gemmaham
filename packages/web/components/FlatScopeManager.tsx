import { useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw, ChevronDown, ChevronRight, Settings2 } from "lucide-react";
import Button from "./ui/Button";
import Badge from "./ui/Badge";
import { updateFlatCustomizationConfig, initFlatCustomizationConfig } from "../lib/firestore";
import { useToast } from "../lib/contexts/ToastContext";
import { formatTimestamp } from "@gemmaham/shared";
import type { Flat, FlatContractorScope, PricingTier } from "@gemmaham/shared";

interface Props {
    flat: Flat;
    buildingId: string;
    onRefresh: () => void;
}

export default function FlatScopeManager({ flat, buildingId, onRefresh }: Props) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const config = flat.customizationConfig;
    const [scopes, setScopes] = useState<FlatContractorScope[]>(config?.scopes ?? []);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);

    const toggleExpand = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const updateTier = (scopeIdx: number, subIdx: number, optIdx: number, tier: PricingTier) => {
        setScopes((prev) => prev.map((scope, si) => {
            if (si !== scopeIdx) return scope;
            return {
                ...scope,
                subcategories: scope.subcategories.map((sub, subi) => {
                    if (subi !== subIdx) return sub;
                    return {
                        ...sub,
                        optionTypes: sub.optionTypes.map((ot, oi) => {
                            if (oi !== optIdx) return ot;
                            return { ...ot, tier, priceDelta: tier === "upgrade" ? ot.priceDelta ?? 0 : null };
                        }),
                    };
                }),
            };
        }));
    };

    const updatePriceDelta = (scopeIdx: number, subIdx: number, optIdx: number, value: number) => {
        setScopes((prev) => prev.map((scope, si) => {
            if (si !== scopeIdx) return scope;
            return {
                ...scope,
                subcategories: scope.subcategories.map((sub, subi) => {
                    if (subi !== subIdx) return sub;
                    return {
                        ...sub,
                        optionTypes: sub.optionTypes.map((ot, oi) => {
                            if (oi !== optIdx) return ot;
                            return { ...ot, priceDelta: value };
                        }),
                    };
                }),
            };
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateFlatCustomizationConfig(flat.id, scopes);
            addToast("success", t("scopeConfig.scopeSaved"));
            onRefresh();
        } catch (e) {
            console.error("Failed to save flat scope:", e);
            addToast("error", t("scopeConfig.scopeSaveFailed"));
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        setResetting(true);
        try {
            await initFlatCustomizationConfig(flat.id, buildingId);
            addToast("success", t("scopeConfig.scopeReset"));
            onRefresh();
        } catch (e) {
            console.error("Failed to reset scope:", e);
        } finally {
            setResetting(false);
        }
    };

    const tierColors: Record<PricingTier, string> = {
        base: "bg-green-500 text-white",
        upgrade: "bg-amber-500 text-white",
        unavailable: "bg-foreground/20 text-foreground/60",
    };

    if (!config) {
        return (
            <div className="text-center py-8">
                <Settings2 size={28} className="mx-auto text-foreground/20 mb-3" />
                <p className="text-foreground/40 mb-4">{t("scopeConfig.noScopeYet")}</p>
                <Button
                    size="sm"
                    onClick={async () => {
                        await initFlatCustomizationConfig(flat.id, buildingId);
                        onRefresh();
                    }}
                >
                    {t("scopeConfig.initFromBuilding")}
                </Button>
            </div>
        );
    }

    return (
        <div>
            {/* Status badges */}
            <div className="flex items-center gap-3 mb-4">
                <span className="text-xs text-foreground/40">
                    {t("scopeConfig.inheritedFromBuilding")} · {formatTimestamp(config.inheritedAt)}
                </span>
                {config.overriddenAt && (
                    <Badge variant="info">{t("scopeConfig.overridden")}</Badge>
                )}
            </div>

            {/* Contractor scopes */}
            <div className="space-y-4">
                {scopes.map((scope, scopeIdx) => {
                    const contractorKey = `contractor-${scope.contractorId}`;
                    const isContractorExpanded = expanded.has(contractorKey);

                    return (
                        <div key={scope.contractorId} className="border-2 border-foreground/10 rounded-xl overflow-hidden">
                            <button
                                type="button"
                                onClick={() => toggleExpand(contractorKey)}
                                className="w-full flex items-center justify-between p-3 bg-surface hover:bg-foreground/5 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    {isContractorExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span className="font-medium">{scope.contractorName}</span>
                                    <Badge variant="default">
                                        {t(`contractorCategories.categories.${scope.category}`)}
                                    </Badge>
                                </div>
                                <span className="text-xs text-foreground/40">
                                    {scope.subcategories.length} {t("contractorCategories.subcategories_count", { count: scope.subcategories.length })}
                                </span>
                            </button>

                            {isContractorExpanded && (
                                <div className="border-t border-foreground/10 p-3 space-y-3">
                                    {scope.subcategories.map((sub, subIdx) => {
                                        const subKey = `${scope.contractorId}-${sub.subcategory}`;
                                        const isSubExpanded = expanded.has(subKey);

                                        return (
                                            <div key={sub.subcategory} className="rounded-lg border border-foreground/5 overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(subKey)}
                                                    className="w-full flex items-center justify-between p-2 bg-foreground/[0.02] hover:bg-foreground/5 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        {isSubExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                        <span className="text-sm font-medium">
                                                            {t(`contractorCategories.subcategories.${sub.subcategory}`)}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1 text-[10px]">
                                                        <span className="px-1 py-0.5 rounded bg-green-500/10 text-green-600">
                                                            {sub.optionTypes.filter((o) => o.tier === "base").length}
                                                        </span>
                                                        <span className="px-1 py-0.5 rounded bg-amber-500/10 text-amber-600">
                                                            {sub.optionTypes.filter((o) => o.tier === "upgrade").length}
                                                        </span>
                                                    </div>
                                                </button>

                                                {isSubExpanded && (
                                                    <div className="p-2 space-y-1.5 bg-background">
                                                        {sub.optionTypes.map((opt, optIdx) => (
                                                            <div key={opt.optionType} className="flex items-center gap-2 py-1">
                                                                <span className="text-sm flex-1 min-w-0 truncate">
                                                                    {t(`optionTypes.${opt.optionType}`)}
                                                                </span>
                                                                <div className="flex rounded-lg overflow-hidden border border-foreground/10 shrink-0">
                                                                    {(["base", "upgrade", "unavailable"] as PricingTier[]).map((tier) => (
                                                                        <button
                                                                            key={tier}
                                                                            type="button"
                                                                            onClick={() => updateTier(scopeIdx, subIdx, optIdx, tier)}
                                                                            className={`px-2 py-0.5 text-[10px] font-medium transition-colors ${
                                                                                opt.tier === tier
                                                                                    ? tierColors[tier]
                                                                                    : "bg-background text-foreground/40 hover:bg-foreground/5"
                                                                            }`}
                                                                        >
                                                                            {t(`scopeConfig.${tier}`)}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                {opt.tier === "upgrade" && (
                                                                    <input
                                                                        type="number"
                                                                        value={opt.priceDelta ?? 0}
                                                                        onChange={(e) => updatePriceDelta(scopeIdx, subIdx, optIdx, Number(e.target.value))}
                                                                        className="w-16 text-xs px-1.5 py-0.5 border border-foreground/10 rounded bg-background"
                                                                    />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 mt-4 border-t border-foreground/10">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? t("common.processing") : t("scopeConfig.saveScope")}
                </Button>
                <Button size="sm" variant="outline" onClick={handleReset} disabled={resetting}>
                    <RotateCcw size={14} className="mr-1" />
                    {t("scopeConfig.resetToBuilding")}
                </Button>
            </div>
        </div>
    );
}
