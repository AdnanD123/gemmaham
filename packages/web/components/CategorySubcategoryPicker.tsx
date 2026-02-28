import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CONTRACTOR_CATEGORIES,
  type ContractorCategoryDefinition,
} from "@gemmaham/shared";
import type {
  ContractorCategory,
  ContractorSubcategory,
  ContractorCategorySelection,
} from "@gemmaham/shared";

// ─── Helper functions (exported for use in forms) ───────
export function deriveCategoryKeys(
  selections: ContractorCategorySelection[],
): ContractorCategory[] {
  return selections.map((s) => s.category);
}

export function deriveSubcategoryKeys(
  selections: ContractorCategorySelection[],
): ContractorSubcategory[] {
  return selections.flatMap((s) => s.subcategories);
}

// ─── Props ──────────────────────────────────────────────
interface CategorySubcategoryPickerProps {
  value: ContractorCategorySelection[];
  onChange: (selections: ContractorCategorySelection[]) => void;
  availableCategories?: ContractorCategory[];
  readOnly?: boolean;
  compact?: boolean;
}

export default function CategorySubcategoryPicker({
  value,
  onChange,
  availableCategories,
  readOnly = false,
  compact = false,
}: CategorySubcategoryPickerProps) {
  const { t } = useTranslation();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = availableCategories
    ? CONTRACTOR_CATEGORIES.filter((c) => availableCategories.includes(c.key))
    : CONTRACTOR_CATEGORIES;

  const getSelection = (
    categoryKey: ContractorCategory,
  ): ContractorCategorySelection | undefined => {
    return value.find((s) => s.category === categoryKey);
  };

  const isCategorySelected = (categoryKey: ContractorCategory): boolean => {
    return value.some((s) => s.category === categoryKey);
  };

  const isSubcategorySelected = (
    categoryKey: ContractorCategory,
    subKey: ContractorSubcategory,
  ): boolean => {
    const sel = getSelection(categoryKey);
    return sel?.subcategories.includes(subKey) ?? false;
  };

  const toggleCategory = (cat: ContractorCategoryDefinition) => {
    if (readOnly) return;
    const existing = getSelection(cat.key);
    if (existing) {
      // Remove entire category
      onChange(value.filter((s) => s.category !== cat.key));
    } else {
      // Add category with all subcategories
      onChange([
        ...value,
        { category: cat.key, subcategories: [...cat.subcategories] },
      ]);
    }
  };

  const toggleSubcategory = (
    cat: ContractorCategoryDefinition,
    subKey: ContractorSubcategory,
  ) => {
    if (readOnly) return;
    const existing = getSelection(cat.key);

    if (!existing) {
      // First subcategory selected in this category
      onChange([...value, { category: cat.key, subcategories: [subKey] }]);
      return;
    }

    const hasSub = existing.subcategories.includes(subKey);
    if (hasSub) {
      // Remove subcategory
      const newSubs = existing.subcategories.filter((s) => s !== subKey);
      if (newSubs.length === 0) {
        // Remove entire category if no subcategories left
        onChange(value.filter((s) => s.category !== cat.key));
      } else {
        onChange(
          value.map((s) =>
            s.category === cat.key ? { ...s, subcategories: newSubs } : s,
          ),
        );
      }
    } else {
      // Add subcategory
      onChange(
        value.map((s) =>
          s.category === cat.key
            ? { ...s, subcategories: [...s.subcategories, subKey] }
            : s,
        ),
      );
    }
  };

  const toggleExpand = (categoryKey: string) => {
    setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey);
  };

  const totalSelected = value.reduce(
    (sum, s) => sum + s.subcategories.length,
    0,
  );

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {/* Summary */}
      {!compact && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {t("contractorCategories.label")}
          </span>
          <span className="text-xs text-foreground/60">
            {totalSelected > 0
              ? t("contractorCategories.selectedCount", {
                  count: totalSelected,
                })
              : t("contractorCategories.noCategories")}
          </span>
        </div>
      )}

      {/* Category list */}
      <div
        className={`border-2 border-foreground/10 rounded-xl overflow-hidden divide-y divide-foreground/10 ${
          compact ? "max-h-72 overflow-y-auto" : "max-h-96 overflow-y-auto"
        }`}
      >
        {categories.map((cat) => {
          const selected = isCategorySelected(cat.key);
          const selection = getSelection(cat.key);
          const subCount = selection?.subcategories.length ?? 0;
          const isExpanded = expandedCategory === cat.key;

          return (
            <div key={cat.key}>
              {/* Category row */}
              <div
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                  selected
                    ? "bg-primary/10"
                    : "bg-surface hover:bg-foreground/5"
                }`}
                onClick={() => toggleExpand(cat.key)}
              >
                {/* Checkbox */}
                {!readOnly && (
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleCategory(cat);
                    }}
                    className="w-4 h-4 rounded border-foreground/30 text-primary focus:ring-primary/50 shrink-0"
                  />
                )}

                {/* Category name */}
                <span
                  className={`flex-1 text-sm font-medium ${
                    selected ? "text-foreground" : "text-foreground/70"
                  }`}
                >
                  {t(`contractorCategories.categories.${cat.key}`)}
                </span>

                {/* Count badge */}
                {subCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary">
                    {subCount}
                  </span>
                )}

                {/* Expand arrow */}
                <svg
                  className={`w-4 h-4 text-foreground/40 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* Subcategories (expanded) */}
              {isExpanded && (
                <div className="bg-foreground/[0.02] px-3 py-2 space-y-1">
                  {cat.subcategories.map((sub) => {
                    const subSelected = isSubcategorySelected(cat.key, sub);
                    return (
                      <label
                        key={sub}
                        className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                          subSelected
                            ? "bg-primary/10"
                            : "hover:bg-foreground/5"
                        } ${readOnly ? "cursor-default" : ""}`}
                      >
                        {!readOnly && (
                          <input
                            type="checkbox"
                            checked={subSelected}
                            onChange={() => toggleSubcategory(cat, sub)}
                            className="w-3.5 h-3.5 rounded border-foreground/30 text-primary focus:ring-primary/50"
                          />
                        )}
                        {readOnly && subSelected && (
                          <span className="w-3.5 h-3.5 text-primary">
                            &#10003;
                          </span>
                        )}
                        <span
                          className={`text-sm ${
                            subSelected
                              ? "text-foreground font-medium"
                              : "text-foreground/60"
                          }`}
                        >
                          {t(`contractorCategories.subcategories.${sub}`)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
