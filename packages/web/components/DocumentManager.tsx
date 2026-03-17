import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, Trash2, Download, FileText, Shield, ClipboardList, Ruler, File } from "lucide-react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import Badge from "./ui/Badge";
import ConfirmDialog from "./ui/ConfirmDialog";
import {
    addBuildingDocument,
    getBuildingDocuments,
    updateBuildingDocument,
    deleteBuildingDocument,
} from "../lib/firestore";
import { uploadBuildingDocument } from "../lib/storage";
import { useToast } from "../lib/contexts/ToastContext";
import { formatTimestamp } from "@gemmaham/shared";
import type { BuildingDocument, BuildingDocumentType } from "@gemmaham/shared";

interface Props {
    buildingId: string;
    companyId: string;
    readOnly?: boolean;
}

const DOC_TYPE_ICONS: Record<BuildingDocumentType, typeof FileText> = {
    plan: Ruler,
    permit: Shield,
    contract: ClipboardList,
    specification: FileText,
    other: File,
};

export default function DocumentManager({ buildingId, companyId, readOnly = false }: Props) {
    const { t } = useTranslation();
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [documents, setDocuments] = useState<BuildingDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const [docName, setDocName] = useState("");
    const [docType, setDocType] = useState<BuildingDocumentType>("other");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const typeOptions = [
        { value: "plan", label: t("documents.plan") },
        { value: "permit", label: t("documents.permit") },
        { value: "contract", label: t("documents.contract") },
        { value: "specification", label: t("documents.specification") },
        { value: "other", label: t("documents.other") },
    ];

    const loadDocuments = async () => {
        try {
            const docs = await getBuildingDocuments(buildingId);
            setDocuments(docs);
        } catch (err) {
            console.error("Failed to load documents:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDocuments();
    }, [buildingId]);

    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        if (!docName) {
            setDocName(file.name.replace(/\.[^.]+$/, ""));
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !docName.trim()) return;
        setUploading(true);
        try {
            const url = await uploadBuildingDocument(buildingId, selectedFile);
            await addBuildingDocument(buildingId, {
                buildingId,
                name: docName.trim(),
                type: docType,
                url,
                uploadedBy: companyId,
                sharedWithContractors: false,
                sharedWithBuyers: false,
            });
            setDocName("");
            setDocType("other");
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            await loadDocuments();
            addToast("success", t("documents.upload") + " ✓");
        } catch (err) {
            console.error("Failed to upload document:", err);
            addToast("error", String(err));
        } finally {
            setUploading(false);
        }
    };

    const handleToggleSharing = async (
        docId: string,
        field: "sharedWithContractors" | "sharedWithBuyers",
        value: boolean,
    ) => {
        try {
            await updateBuildingDocument(buildingId, docId, { [field]: value });
            setDocuments((prev) =>
                prev.map((d) => (d.id === docId ? { ...d, [field]: value } : d)),
            );
        } catch (err) {
            console.error("Failed to update sharing:", err);
            addToast("error", String(err));
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteBuildingDocument(buildingId, deleteTarget);
            setDocuments((prev) => prev.filter((d) => d.id !== deleteTarget));
            setDeleteTarget(null);
            addToast("success", t("documents.delete") + " ✓");
        } catch (err) {
            console.error("Failed to delete document:", err);
            addToast("error", String(err));
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-8 bg-foreground/10 rounded w-1/3" />
                <div className="h-24 bg-foreground/10 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="font-semibold text-lg">{t("documents.title")}</h2>

            {/* Upload section */}
            {!readOnly && (
                <div className="bg-surface rounded-2xl border border-foreground/6 p-5 space-y-4">
                    <h3 className="font-medium text-sm">{t("documents.uploadDocument")}</h3>

                    {/* Drop zone */}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                            dragOver ? "border-primary bg-primary/5" : "border-foreground/20"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {selectedFile ? (
                            <div className="space-y-1">
                                <Upload size={24} className="mx-auto text-primary" />
                                <p className="text-sm font-medium">{selectedFile.name}</p>
                                <p className="text-xs text-foreground/50">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <Upload size={24} className="mx-auto text-foreground/40" />
                                <p className="text-sm text-foreground/40">{t("documents.uploadDocument")}</p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.gif"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileSelect(f);
                            }}
                            className="hidden"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label={t("documents.name")}
                            value={docName}
                            onChange={(e) => setDocName(e.target.value)}
                            placeholder={t("documents.name")}
                        />
                        <Select
                            label={t("documents.type")}
                            value={docType}
                            onChange={(e) => setDocType(e.target.value as BuildingDocumentType)}
                            options={typeOptions}
                        />
                    </div>

                    <Button
                        onClick={handleUpload}
                        disabled={uploading || !selectedFile || !docName.trim()}
                        size="sm"
                    >
                        {uploading ? "..." : t("documents.upload")}
                    </Button>
                </div>
            )}

            {/* Document list */}
            {documents.length === 0 ? (
                <div className="text-center py-8">
                    <FileText size={32} className="mx-auto text-foreground/20 mb-2" />
                    <p className="text-foreground/40">{t("documents.empty")}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {documents.map((d) => {
                        const Icon = DOC_TYPE_ICONS[d.type] || File;
                        return (
                            <div
                                key={d.id}
                                className="rounded-2xl border border-foreground/6 shadow-card bg-surface p-4 flex items-start gap-4"
                            >
                                <div className="p-2 bg-foreground/5 rounded-xl shrink-0">
                                    <Icon size={20} className="text-foreground/60" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium truncate">{d.name}</h4>
                                        <Badge variant={d.type as string}>{t(`documents.${d.type}`)}</Badge>
                                    </div>
                                    <p className="text-xs text-foreground/40">{formatTimestamp(d.createdAt)}</p>

                                    {/* Sharing toggles */}
                                    {!readOnly && (
                                        <div className="flex gap-4 mt-2">
                                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={d.sharedWithContractors}
                                                    onChange={(e) =>
                                                        handleToggleSharing(d.id, "sharedWithContractors", e.target.checked)
                                                    }
                                                    className="w-3.5 h-3.5"
                                                />
                                                {t("documents.sharedWithContractors")}
                                            </label>
                                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={d.sharedWithBuyers}
                                                    onChange={(e) =>
                                                        handleToggleSharing(d.id, "sharedWithBuyers", e.target.checked)
                                                    }
                                                    className="w-3.5 h-3.5"
                                                />
                                                {t("documents.sharedWithBuyers")}
                                            </label>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <a
                                        href={d.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                                        title={t("documents.download")}
                                    >
                                        <Download size={16} />
                                    </a>
                                    {!readOnly && (
                                        <button
                                            onClick={() => setDeleteTarget(d.id)}
                                            className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                            title={t("documents.delete")}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
                title={t("documents.delete")}
                message={t("documents.delete") + "?"}
            />
        </div>
    );
}
