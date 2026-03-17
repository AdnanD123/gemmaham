import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "motion/react";
import { CheckCircle } from "lucide-react";
import Button from "./ui/Button";
import Textarea from "./ui/Textarea";
import { updateContractorProgress } from "../lib/firestore";
import { useToast } from "../lib/contexts/ToastContext";

interface ProgressReporterProps {
    buildingId: string;
    contractorId: string;
    currentProgress: number;
    currentStatus: string;
    onUpdate: () => void;
}

export const ProgressReporter = ({
    buildingId,
    contractorId,
    currentProgress,
    currentStatus,
    onUpdate,
}: ProgressReporterProps) => {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [progress, setProgress] = useState(currentProgress);
    const [note, setNote] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const isCompleted = currentStatus === "completed";

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await updateContractorProgress(buildingId, contractorId, {
                progressPercent: progress,
                note: note.trim() || undefined,
            });
            addToast("success", t("contractor.progressUpdated"));
            setNote("");
            onUpdate();
        } catch (err) {
            console.error("Failed to update progress:", err);
            addToast("error", "Failed to update progress.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleMarkComplete = async () => {
        setSubmitting(true);
        try {
            await updateContractorProgress(buildingId, contractorId, {
                progressPercent: 100,
                note: note.trim() || undefined,
            });
            addToast("success", t("contractor.progressUpdated"));
            setNote("");
            onUpdate();
        } catch (err) {
            console.error("Failed to mark complete:", err);
            addToast("error", "Failed to update progress.");
        } finally {
            setSubmitting(false);
        }
    };

    if (isCompleted) {
        return (
            <div className="p-5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-2xl">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle size={20} />
                    <span className="font-semibold">{t("contractor.status.completed")}</span>
                    <span className="ml-auto text-lg font-bold">100%</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl space-y-4">
            <h3 className="font-semibold text-lg">{t("contractor.updateProgress")}</h3>

            {/* Large visual progress bar */}
            <div>
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-foreground/50">{t("contractor.progress")}</span>
                    <span className="text-2xl font-bold text-primary">{progress}%</span>
                </div>
                <div className="w-full h-5 bg-foreground/10 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-primary rounded-full"
                        initial={{ width: `${currentProgress}%` }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    />
                </div>
            </div>

            {/* Range slider */}
            <div>
                <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full accent-primary cursor-pointer"
                    disabled={submitting}
                />
                <div className="flex justify-between text-xs text-foreground/40 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                </div>
            </div>

            {/* Note field */}
            <Textarea
                label={t("contractor.whatCompleted")}
                placeholder={t("contractor.progressNotePlaceholder")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[80px]"
            />

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
                <Button
                    onClick={handleSubmit}
                    disabled={submitting || progress === currentProgress}
                >
                    {submitting ? t("common.processing") : t("contractor.updateProgress")}
                </Button>

                {progress >= 95 && (
                    <Button
                        variant="secondary"
                        onClick={handleMarkComplete}
                        disabled={submitting}
                    >
                        <CheckCircle size={16} className="mr-1" />
                        {t("contractor.markComplete")}
                    </Button>
                )}
            </div>
        </div>
    );
};
