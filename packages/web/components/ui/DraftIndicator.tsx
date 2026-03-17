import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { FileText, X } from "lucide-react";

interface DraftIndicatorProps {
    show: boolean;
    savedAt: number | null;
    onDiscard: () => void;
}

function formatRelativeTime(timestamp: number, t: (key: string) => string): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return t("draft.justNow");
    if (minutes < 60) return t("draft.minutesAgo").replace("{{count}}", String(minutes));
    if (hours < 24) return t("draft.hoursAgo").replace("{{count}}", String(hours));
    return t("draft.daysAgo").replace("{{count}}", String(days));
}

export function DraftIndicator({ show, savedAt, onDiscard }: DraftIndicatorProps) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setVisible(true);
            const timer = setTimeout(() => {
                setVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        } else {
            setVisible(false);
        }
    }, [show]);

    const handleDiscard = () => {
        setVisible(false);
        onDiscard();
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-2 text-sm flex items-center justify-between gap-3"
                >
                    <div className="flex items-center gap-2 text-foreground/70">
                        <FileText size={14} className="shrink-0" />
                        <span>
                            {savedAt
                                ? t("draft.restoredAt").replace("{{time}}", formatRelativeTime(savedAt, t))
                                : t("draft.restored")}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={handleDiscard}
                        className="flex items-center gap-1 text-foreground/50 hover:text-foreground/80 transition-colors text-xs font-medium"
                    >
                        <X size={12} />
                        {t("draft.discard")}
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
