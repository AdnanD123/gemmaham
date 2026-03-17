import { useState, useEffect, useRef, useCallback } from "react";

interface DraftData<T> {
    values: T;
    savedAt: number;
}

function isSerializableValue(value: unknown): boolean {
    if (value === null || value === undefined) return true;
    const type = typeof value;
    return type === "string" || type === "number" || type === "boolean";
}

function filterSerializableFields<T extends Record<string, unknown>>(obj: T): Partial<T> {
    const result: Partial<T> = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            if (isSerializableValue(value)) {
                result[key] = value as T[typeof key];
            }
        }
    }
    return result;
}

export function useFormDraft<T extends Record<string, unknown>>(key: string, initialValues: T) {
    const [hasDraft, setHasDraft] = useState(false);
    const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
    const [values, setValues] = useState<T>(initialValues);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitializedRef = useRef(false);

    // On mount: restore draft from localStorage
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const draft: DraftData<Partial<T>> = JSON.parse(raw);
                if (draft && draft.values && typeof draft.values === "object") {
                    setValues((prev) => ({ ...prev, ...draft.values }));
                    setHasDraft(true);
                    setDraftSavedAt(draft.savedAt || null);
                }
            }
        } catch {
            // Corrupted draft — ignore
        }
        isInitializedRef.current = true;
    }, [key]);

    // Auto-save debounced on value changes
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!isInitializedRef.current) return;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            try {
                const serializable = filterSerializableFields(values);
                const draft: DraftData<Partial<T>> = {
                    values: serializable,
                    savedAt: Date.now(),
                };
                localStorage.setItem(key, JSON.stringify(draft));
            } catch {
                // localStorage full or unavailable — silently fail
            }
        }, 1000);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [key, values]);

    const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
        setValues((prev) => ({ ...prev, [field]: value }));
    }, []);

    const setAllValues = useCallback((updater: (prev: T) => T) => {
        setValues(updater);
    }, []);

    const clearDraft = useCallback(() => {
        if (typeof window === "undefined") return;
        try {
            localStorage.removeItem(key);
        } catch {
            // ignore
        }
        setHasDraft(false);
        setDraftSavedAt(null);
    }, [key]);

    const restoreDraft = useCallback(() => {
        if (typeof window === "undefined") return;
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                const draft: DraftData<Partial<T>> = JSON.parse(raw);
                if (draft && draft.values) {
                    setValues((prev) => ({ ...prev, ...draft.values }));
                    setHasDraft(true);
                    setDraftSavedAt(draft.savedAt || null);
                }
            }
        } catch {
            // ignore
        }
    }, [key]);

    const discardDraft = useCallback(() => {
        if (typeof window === "undefined") return;
        try {
            localStorage.removeItem(key);
        } catch {
            // ignore
        }
        setValues(initialValues);
        setHasDraft(false);
        setDraftSavedAt(null);
    }, [key, initialValues]);

    return {
        values,
        setValue,
        setAllValues,
        hasDraft,
        draftSavedAt,
        clearDraft,
        restoreDraft,
        discardDraft,
    };
}
