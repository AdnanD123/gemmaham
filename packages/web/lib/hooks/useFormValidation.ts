import { useState, useCallback } from "react";
import type { ZodSchema, ZodError } from "zod";

export function useFormValidation<T>(schema: ZodSchema<T>) {
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = useCallback(
        (data: unknown): data is T => {
            try {
                schema.parse(data);
                setErrors({});
                return true;
            } catch (err) {
                const zodError = err as ZodError;
                const fieldErrors: Record<string, string> = {};
                zodError.errors.forEach((e) => {
                    const path = e.path.join(".");
                    if (path) fieldErrors[path] = e.message;
                });
                setErrors(fieldErrors);
                return false;
            }
        },
        [schema],
    );

    const clearError = useCallback((field: string) => {
        setErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    const clearAllErrors = useCallback(() => {
        setErrors({});
    }, []);

    return { errors, validate, clearError, clearAllErrors, setErrors };
}
