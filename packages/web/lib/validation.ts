import { z } from "zod";

// ── Auth schemas ──────────────────────────────────────────────

export const loginSchema = z.object({
    email: z.string().email("validation.invalidEmail"),
    password: z.string().min(6, "validation.passwordMin"),
});

export const registerSchema = z.object({
    displayName: z.string().min(2, "validation.nameMin"),
    email: z.string().email("validation.invalidEmail"),
    password: z.string().min(6, "validation.passwordMin"),
    role: z.enum(["user", "company", "contractor"]),
});

// ── Profile schemas ───────────────────────────────────────────

export const profileSetupSchema = z.object({
    displayName: z.string().min(2, "validation.nameMin"),
    phone: z.string().min(5, "validation.phoneMin"),
    address: z.string().min(3, "validation.addressMin"),
});

export const contractorProfileSetupSchema = z.object({
    displayName: z.string().min(2, "validation.nameMin"),
    phone: z.string().min(5, "validation.phoneMin"),
    companyName: z.string().min(2, "validation.companyNameMin"),
});

// ── Property schemas ──────────────────────────────────────────

export const flatSchema = z.object({
    title: z.string().min(3, "validation.titleMin"),
    description: z.string().optional(),
    address: z.string().min(3, "validation.addressMin"),
    price: z.number({ invalid_type_error: "validation.pricePositive" }).positive("validation.pricePositive"),
    bedrooms: z.number({ invalid_type_error: "validation.required" }).int().min(0, "validation.minZero").max(20, "validation.bedroomsMax"),
    bathrooms: z.number({ invalid_type_error: "validation.required" }).int().min(0, "validation.minZero").max(10, "validation.bathroomsMax"),
    area: z.number({ invalid_type_error: "validation.areaPositive" }).positive("validation.areaPositive"),
});

export const houseSchema = z.object({
    title: z.string().min(3, "validation.titleMin"),
    description: z.string().min(1, "validation.required"),
    address: z.string().min(3, "validation.addressMin"),
    price: z.number({ invalid_type_error: "validation.pricePositive" }).positive("validation.pricePositive"),
    bedrooms: z.number({ invalid_type_error: "validation.required" }).int().min(0, "validation.minZero").max(20, "validation.bedroomsMax"),
    bathrooms: z.number({ invalid_type_error: "validation.required" }).int().min(0, "validation.minZero").max(10, "validation.bathroomsMax"),
    area: z.number({ invalid_type_error: "validation.areaPositive" }).positive("validation.areaPositive"),
    lotSize: z.number({ invalid_type_error: "validation.lotSizePositive" }).positive("validation.lotSizePositive"),
    stories: z.number({ invalid_type_error: "validation.required" }).int().min(1, "validation.storiesMin").max(10, "validation.storiesMax"),
});

// ── Type helpers ──────────────────────────────────────────────

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;
export type ContractorProfileSetupFormData = z.infer<typeof contractorProfileSetupSchema>;
export type FlatFormData = z.infer<typeof flatSchema>;
export type HouseFormData = z.infer<typeof houseSchema>;
