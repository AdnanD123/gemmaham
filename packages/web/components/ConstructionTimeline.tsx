import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, ImagePlus } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Textarea from "./ui/Textarea";
import Select from "./ui/Select";
import Badge from "./ui/Badge";
import ConfirmDialog from "./ui/ConfirmDialog";
import { addConstructionUpdate, getConstructionUpdates, deleteConstructionUpdate } from "../lib/firestore";
import { uploadConstructionPhoto } from "../lib/storage";
import { useToast } from "../lib/contexts/ToastContext";
import type { ConstructionUpdate, ConstructionPhase } from "@gemmaham/shared";

interface Props {
    buildingId: string;
    companyId: string;
}

export default function ConstructionTimeline({ buildingId, companyId }: Props) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const [updates, setUpdates] = useState<ConstructionUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: "",
        description: "",
        phase: "foundation" as ConstructionPhase,
        progressPercent: "0",
    });
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);

    useEffect(() => {
        (async () => {
            try {
                const result = await getConstructionUpdates(buildingId);
                setUpdates(result);
            } catch (e) {
                console.error("Failed to load updates:", e);
                setUpdates([]);
            } finally {
                setLoading(false);
            }
        })();
    }, [buildingId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setPhotoFiles((prev) => [...prev, ...files]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const imageUrls: string[] = [];
            for (const file of photoFiles) {
                const url = await uploadConstructionPhoto(companyId, buildingId, file);
                imageUrls.push(url);
            }

            await addConstructionUpdate(buildingId, {
                title: form.title,
                description: form.description,
                phase: form.phase,
                progressPercent: Number(form.progressPercent),
                images: imageUrls,
            });

            const refreshed = await getConstructionUpdates(buildingId);
            setUpdates(refreshed);
            setForm({ title: "", description: "", phase: "foundation", progressPercent: "0" });
            setPhotoFiles([]);
            setShowForm(false);
            addToast("success", t("toast.updateAdded"));
        } catch (e) {
            console.error("Failed to add update:", e);
            addToast("error", t("toast.updateAddFailed"));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteConstructionUpdate(buildingId, deleteTarget);
            setUpdates((prev) => prev.filter((u) => u.id !== deleteTarget));
            addToast("success", t("toast.updateDeleted"));
        } catch (e) {
            console.error("Failed to delete update:", e);
        } finally {
            setDeleteTarget(null);
        }
    };

    const phaseOptions = [
        { value: "foundation", label: t("buildings.phase.foundation") },
        { value: "structure", label: t("buildings.phase.structure") },
        { value: "facade", label: t("buildings.phase.facade") },
        { value: "interior", label: t("buildings.phase.interior") },
        { value: "finishing", label: t("buildings.phase.finishing") },
        { value: "handover", label: t("buildings.phase.handover") },
    ];

    if (loading) {
        return <div className="animate-pulse space-y-4"><div className="h-24 bg-foreground/5 rounded-lg" /><div className="h-24 bg-foreground/5 rounded-lg" /></div>;
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-foreground/50">{updates.length} {t("construction.updates")}</p>
                <Button size="sm" onClick={() => setShowForm(!showForm)}>
                    <Plus size={16} className="mr-1" /> {t("construction.addUpdate")}
                </Button>
            </div>

            {/* Add Update Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-surface rounded-2xl border border-foreground/6 mb-6">
                    <Input
                        label={t("construction.updateTitle")}
                        placeholder={t("construction.updateTitlePlaceholder")}
                        value={form.title}
                        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                        required
                    />
                    <Textarea
                        label={t("construction.updateDesc")}
                        value={form.description}
                        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Select label={t("buildings.currentPhase")} value={form.phase} onChange={(e) => setForm((f) => ({ ...f, phase: e.target.value as ConstructionPhase }))} options={phaseOptions} />
                        <Input label={t("construction.progress")} type="number" min="0" max="100" value={form.progressPercent} onChange={(e) => setForm((f) => ({ ...f, progressPercent: e.target.value }))} />
                    </div>

                    {/* Photo upload */}
                    <div>
                        <label className="block text-sm font-medium mb-1">{t("construction.photos")}</label>
                        <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-foreground/6 rounded-xl cursor-pointer hover:border-primary/30 transition-colors">
                            <ImagePlus size={16} className="text-foreground/40" />
                            <span className="text-sm text-foreground/50">{t("construction.addPhotos")}</span>
                            <input type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                        </label>
                        {photoFiles.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {photoFiles.map((f, i) => (
                                    <span key={i} className="text-xs bg-foreground/10 px-2 py-1 rounded">{f.name}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button type="submit" size="sm" disabled={submitting}>
                            {submitting ? t("common.processing") : t("construction.postUpdate")}
                        </Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                            {t("common.cancel")}
                        </Button>
                    </div>
                </form>
            )}

            {/* Timeline */}
            {updates.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-foreground/40">{t("construction.noUpdates")}</p>
                </div>
            ) : (
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-foreground/6" />

                    <div className="space-y-6">
                        {updates.map((update) => (
                            <div key={update.id} className="relative pl-10">
                                {/* Dot */}
                                <div className="absolute left-2.5 top-2 w-3 h-3 rounded-full bg-primary border-2 border-background" />

                                <div className="p-4 bg-surface rounded-2xl border border-foreground/6">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium">{update.title}</h3>
                                                <Badge variant="default">{t(`buildings.phase.${update.phase}`)}</Badge>
                                            </div>
                                            <p className="text-sm text-foreground/60">{update.description}</p>
                                        </div>
                                        <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(update.id)}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-xs text-foreground/50 mb-1">
                                            <span>{t("construction.progress")}</span>
                                            <span>{update.progressPercent}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-foreground/4 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${update.progressPercent}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Photos */}
                                    {update.images.length > 0 && (
                                        <div className="flex gap-2 mt-3 flex-wrap">
                                            {update.images.map((img, i) => (
                                                <img
                                                    key={i}
                                                    src={img}
                                                    alt=""
                                                    className="w-24 h-24 rounded-lg object-cover border border-foreground/6"
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title={t("construction.deleteUpdateTitle")}
                message={t("construction.deleteUpdateMsg")}
                confirmLabel={t("common.delete")}
            />
        </div>
    );
}
