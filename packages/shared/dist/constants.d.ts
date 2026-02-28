export declare const SHARE_STATUS_RESET_DELAY_MS = 1500;
export declare const PROGRESS_INCREMENT = 15;
export declare const REDIRECT_DELAY_MS = 600;
export declare const PROGRESS_INTERVAL_MS = 100;
export declare const PROGRESS_STEP = 5;
export declare const GRID_OVERLAY_SIZE = "60px 60px";
export declare const GRID_COLOR = "#3B82F6";
export declare const IMAGE_RENDER_DIMENSION = 1024;
export declare const CONTRACTOR_SPECIALTIES: readonly ["flooring", "kitchen", "bathroom", "walls", "electrical", "other"];
import type { ContractorCategory, ContractorSubcategory } from "./types.js";
export interface ContractorCategoryDefinition {
    key: ContractorCategory;
    subcategories: ContractorSubcategory[];
}
export declare const CONTRACTOR_CATEGORIES: ContractorCategoryDefinition[];
export declare const getSubcategoriesForCategory: (categoryKey: ContractorCategory) => ContractorSubcategory[];
export declare const OPTION_TYPES: Record<string, string[]>;
export declare const getOptionTypesForSubcategory: (subcategory: string) => string[];
export declare const GEMMAHAM_RENDER_PROMPT: string;
