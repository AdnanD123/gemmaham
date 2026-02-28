import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
    id: string;
    type: ToastType;
    message: string;
    exiting?: boolean;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (type: ToastType, message: string) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 300);
    }, []);

    const addToast = useCallback(
        (type: ToastType, message: string) => {
            const id = `toast-${++toastCounter}`;
            setToasts((prev) => {
                const next = [...prev, { id, type, message }];
                // Keep max 5 toasts
                if (next.length > 5) return next.slice(next.length - 5);
                return next;
            });
            // Auto-dismiss after 4s
            setTimeout(() => removeToast(id), 4000);
        },
        [removeToast],
    );

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}
