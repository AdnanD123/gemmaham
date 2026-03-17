import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Check, AlertTriangle, X } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Select from "./ui/Select";
import Badge from "./ui/Badge";
import ConfirmDialog from "./ui/ConfirmDialog";
import {
    addBuildingMilestone,
    getBuildingMilestones,
    updateBuildingMilestone,
    deleteBuildingMilestone,
} from "../lib/firestore";
import { useToast } from "../lib/contexts/ToastContext";
import type { BuildingMilestone, ConstructionPhase } from "@gemmaham/shared";

interface Props {
    buildingId: string;
    currentPhase: ConstructionPhase;
}

const PHASES: ConstructionPhase[] = ["foundation", "structure", "facade", "interior", "finishing", "handover"];

const PHASE_COLORS: Record<ConstructionPhase, string> = {
    foundation: "bg-amber-600",
    structure: "bg-orange-500",
    facade: "bg-blue-500",
    interior: "bg-violet-500",
    finishing: "bg-emerald-500",
    handover: "bg-green-600",
};

function daysUntil(dateStr: string): number {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function MilestoneTimeline({ buildingId, currentPhase }: Props) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [milestones, setMilestones] = useState<BuildingMilestone[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: "",
        date: "",
        phase: "foundation" as ConstructionPhase,
        description: "",
    });

    useEffect(() => {
        (async () => {
            try {
                const result = await getBuildingMilestones(buildingId);
                setMilestones(result);
            } catch (e) {
                console.error("Failed to load milestones:", e);
                setMilestones([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [buildingId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await addBuildingMilestone(buildingId, {
                title: form.title,
                date: form.date,
                phase: form.phase,
                description: form.description || undefined,
                completed: false,
            });
            const refreshed = await getBuildingMilestones(buildingId);
            setMilestones(refreshed);
            setForm({ title: "", date: "", phase: "foundation", description: "" });
            setShowForm(false);
            addToast("success", t("milestones.added"));
        } catch (e) {
            console.error("Failed to add milestone:", e);
            addToast("error", t("milestones.addFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleCompleted = async (milestone: BuildingMilestone) => {
        try {
            await updateBuildingMilestone(buildingId, milestone.id, {
                completed: !milestone.completed,
            });
            setMilestones((prev) =>
                prev.map((m) =>
                    m.id === milestone.id ? { ...m, completed: !m.completed } : m
                )
            );
        } catch (e) {
            console.error("Failed to toggle milestone:", e);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteBuildingMilestone(buildingId, deleteTarget);
            setMilestones((prev) => prev.filter((m) => m.id !== deleteTarget));
            addToast("success", t("milestones.deleted"));
        } catch (e) {
            console.error("Failed to delete milestone:", e);
        } finally {
            setDeleteTarget(null);
        }
    };

    const currentPhaseIndex = PHASES.indexOf(currentPhase);

    // Compute date range for timeline positioning
    const dateRange = useMemo(() => {
        if (milestones.length === 0) return { min: Date.now(), max: Date.now() + 1 };
        const dates = milestones.map((m) => new Date(m.date).getTime());
        const today = Date.now();
        dates.push(today);
        const min = Math.min(...dates);
        const max = Math.max(...dates);
        const padding = (max - min) * 0.05 || 86400000;
        return { min: min - padding, max: max + padding };
    }, [milestones]);

    const getTimelinePosition = (dateStr: string): number => {
        const t = new Date(dateStr).getTime();
        const range = dateRange.max - dateRange.min;
        if (range === 0) return 50;
        return ((t - dateRange.min) / range) * 100;
    };

    const todayPosition = getTimelinePosition(new Date().toISOString().split("T")[0]);

    const phaseOptions = PHASES.map((p) => ({
        value: p,
        label: t(`buildings.phase.${p}`),
    }));

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-16 bg-foreground/5 rounded-lg" />
                <div className="h-24 bg-foreground/5 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{t("milestones.title")}</h3>
                <Button size="sm" onClick={() => setShowForm(!showForm)}>
                    <Plus size={16} className="mr-1" /> {t("milestones.add")}
                </Button>
            </div>

            {/* Add Milestone Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-3 p-4 bg-surface rounded-2xl border border-foreground/6 mb-2"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-sm">{t("milestones.add")}</h4>
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    aria-label={t("common.close")}
                                    className="text-foreground/40 hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 rounded"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <Input
                                label={t("milestones.titleLabel")}
                                value={form.title}
                                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label={t("milestones.date")}
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                                    required
                                />
                                <Select
                                    label={t("milestones.phase")}
                                    value={form.phase}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, phase: e.target.value as ConstructionPhase }))
                                    }
                                    options={phaseOptions}
                                />
                            </div>
                            <Textarea
                                label={t("milestones.description")}
                                value={form.description}
                                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                            />
                            <div className="flex gap-2 pt-2">
                                <Button type="submit" size="sm" disabled={submitting}>
                                    {submitting ? t("common.processing") : t("milestones.add")}
                                </Button>
                                <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                                    {t("common.cancel")}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Horizontal Visual Timeline */}
            {milestones.length > 0 && (
                <div className="bg-surface rounded-2xl border border-foreground/6 p-5">
                    {/* Phase bar */}
                    <div className="overflow-x-auto -mx-5 px-5 mb-6">
                    <div className="flex rounded-lg overflow-hidden h-8 min-w-[480px]">
                        {PHASES.map((phase, i) => {
                            const isActive = i === currentPhaseIndex;
                            const isPast = i < currentPhaseIndex;
                            return (
                                <div
                                    key={phase}
                                    className={`flex-1 flex items-center justify-center text-xs font-medium text-white transition-all relative ${PHASE_COLORS[phase]} ${
                                        isActive ? "ring-2 ring-offset-1 ring-primary scale-y-110" : ""
                                    } ${isPast ? "opacity-70" : ""} ${!isPast && !isActive ? "opacity-40" : ""}`}
                                    title={t(`buildings.phase.${phase}`)}
                                >
                                    <span className="truncate px-1">
                                        {t(`buildings.phase.${phase}`)}
                                    </span>
                                    {isActive && (
                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rotate-45" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    </div>

                    {/* Timeline track */}
                    <div className="relative h-16 mb-2">
                        {/* Track line */}
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-foreground/10 -translate-y-1/2" />

                        {/* Today marker */}
                        <div
                            className="absolute top-0 bottom-0 w-px border-l-2 border-dashed border-accent z-10"
                            style={{ left: `${Math.min(Math.max(todayPosition, 0), 100)}%` }}
                        >
                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium text-accent whitespace-nowrap">
                                {t("milestones.today")}
                            </span>
                        </div>

                        {/* Milestone diamonds */}
                        {milestones.map((milestone) => {
                            const pos = getTimelinePosition(milestone.date);
                            const days = daysUntil(milestone.date);
                            const isOverdue = !milestone.completed && days < 0;
                            const isApproaching = !milestone.completed && days >= 0 && days <= 7;

                            let color = "bg-primary"; // upcoming indigo
                            if (milestone.completed) color = "bg-secondary"; // completed green
                            else if (isOverdue) color = "bg-accent"; // overdue red

                            return (
                                <motion.div
                                    key={milestone.id}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group z-20"
                                    style={{ left: `${Math.min(Math.max(pos, 2), 98)}%` }}
                                >
                                    <div
                                        className={`w-4 h-4 ${color} rotate-45 border-2 border-background cursor-pointer transition-transform hover:scale-125 ${
                                            isApproaching ? "ring-2 ring-yellow-400 ring-offset-1" : ""
                                        }`}
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-30">
                                        <div className="bg-foreground text-background text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                                            <p className="font-medium">{milestone.title}</p>
                                            <p className="opacity-70">{new Date(milestone.date).toLocaleDateString()}</p>
                                            {isOverdue && (
                                                <p className="text-red-300 mt-0.5">{t("milestones.overdue")}</p>
                                            )}
                                            {isApproaching && (
                                                <p className="text-yellow-300 mt-0.5">
                                                    {t("milestones.daysRemaining", { count: days })}
                                                </p>
                                            )}
                                        </div>
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45 -mt-1" />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Milestone Cards */}
            {milestones.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-foreground/50">{t("milestones.empty")}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {milestones.map((milestone) => {
                            const days = daysUntil(milestone.date);
                            const isOverdue = !milestone.completed && days < 0;
                            const isApproaching = !milestone.completed && days >= 0 && days <= 7;

                            return (
                                <motion.div
                                    key={milestone.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className={`p-4 bg-surface rounded-2xl border transition-colors ${
                                        isOverdue
                                            ? "border-accent/40"
                                            : isApproaching
                                            ? "border-yellow-400/40"
                                            : "border-foreground/6"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Completed checkbox */}
                                        <button
                                            onClick={() => handleToggleCompleted(milestone)}
                                            aria-label={milestone.completed ? `Mark ${milestone.title} as incomplete` : `Mark ${milestone.title} as completed`}
                                            className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                                                milestone.completed
                                                    ? "bg-secondary border-secondary text-white"
                                                    : "border-foreground/20 hover:border-primary"
                                            }`}
                                        >
                                            {milestone.completed && <Check size={12} />}
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <h4
                                                    className={`font-medium ${
                                                        milestone.completed ? "line-through text-foreground/40" : ""
                                                    }`}
                                                >
                                                    {milestone.title}
                                                </h4>
                                                <Badge variant="default">
                                                    {t(`buildings.phase.${milestone.phase}`)}
                                                </Badge>
                                                {isOverdue && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
                                                        <AlertTriangle size={12} />
                                                        {t("milestones.overdue")}
                                                    </span>
                                                )}
                                                {isApproaching && (
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-600">
                                                        <AlertTriangle size={12} />
                                                        {t("milestones.approaching")}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-3 text-sm text-foreground/50">
                                                <span>{new Date(milestone.date).toLocaleDateString()}</span>
                                                {!milestone.completed && days >= 0 && (
                                                    <span>
                                                        {t("milestones.daysRemaining", { count: days })}
                                                    </span>
                                                )}
                                            </div>

                                            {milestone.description && (
                                                <p className="text-sm text-foreground/60 mt-2">
                                                    {milestone.description}
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setDeleteTarget(milestone.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title={t("milestones.deleteTitle")}
                message={t("milestones.deleteMsg")}
                confirmLabel={t("common.delete")}
            />
        </div>
    );
}
