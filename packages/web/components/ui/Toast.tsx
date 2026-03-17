import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToast, type ToastType } from "../../lib/contexts/ToastContext";

const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 size={18} className="text-secondary shrink-0" />,
    error: <XCircle size={18} className="text-accent shrink-0" />,
    info: <Info size={18} className="text-primary shrink-0" />,
    warning: <AlertTriangle size={18} className="text-accent shrink-0" />,
};

const bgColors: Record<ToastType, string> = {
    success: "bg-secondary/10 text-secondary border-foreground/6",
    error: "bg-accent/10 text-accent border-foreground/6",
    info: "bg-primary/10 text-primary border-foreground/6",
    warning: "bg-accent/10 text-accent border-foreground/6",
};

export default function ToastContainer() {
    const { toasts, removeToast } = useToast();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none backdrop-blur-xl" style={{ WebkitBackdropFilter: "blur(20px) saturate(1.8)", backdropFilter: "blur(20px) saturate(1.8)" }}>
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
