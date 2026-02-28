import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToast, type ToastType } from "../../lib/contexts/ToastContext";

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={18} className="text-green-500 shrink-0" />,
    error: <XCircle size={18} className="text-red-500 shrink-0" />,
    info: <Info size={18} className="text-blue-500 shrink-0" />,
    warning: <AlertTriangle size={18} className="text-amber-500 shrink-0" />,
};

const bgColors: Record<ToastType, string> = {
    success: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800",
    error: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
    info: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800",
    warning: "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
};

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm ${bgColors[toast.type]} ${
                        toast.exiting ? "animate-[toast-out_0.3s_ease-in_forwards]" : "animate-[toast-in_0.3s_ease-out]"
                    }`}
                >
                    {icons[toast.type]}
                    <p className="text-sm text-foreground flex-1">{toast.message}</p>
                    <button
                        onClick={() => removeToast(toast.id)}
                        className="text-foreground/40 hover:text-foreground/70 transition-colors shrink-0"
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>,
        document.body,
    );
}
