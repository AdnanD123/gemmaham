import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, X, ImageIcon } from "lucide-react";
import { uploadPropertyPhoto } from "../lib/storage";

interface PhotoUploaderProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  storagePath: string;
}

export const PhotoUploader = ({ photos, onChange, storagePath }: PhotoUploaderProps) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const maxPhotos = 5;
  const remaining = maxPhotos - photos.length;

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const toUpload = Array.from(files).slice(0, remaining);
    if (toUpload.length === 0) return;

    setUploading(true);
    const newUrls: string[] = [];

    for (const file of toUpload) {
      const tempId = `${file.name}-${Date.now()}`;
      try {
        setUploadProgress((prev) => ({ ...prev, [tempId]: 0 }));
        const url = await uploadPropertyPhoto(storagePath, file, (progress) => {
          setUploadProgress((prev) => ({ ...prev, [tempId]: progress }));
        });
        newUrls.push(url);
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[tempId];
          return next;
        });
      } catch (err) {
        console.error("Failed to upload photo:", err);
        setUploadProgress((prev) => {
          const next = { ...prev };
          delete next[tempId];
          return next;
        });
      }
    }

    if (newUrls.length > 0) {
      onChange([...photos, ...newUrls]);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const uploadingEntries = Object.entries(uploadProgress);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">{t("photos.upload")}</label>
        <span className="text-xs text-foreground/50">
          {t("photos.max5")} ({photos.length}/{maxPhotos})
        </span>
      </div>

      {/* Thumbnail grid */}
      {(photos.length > 0 || uploadingEntries.length > 0) && (
        <div className="grid grid-cols-5 gap-2">
          {photos.map((url, i) => (
            <div key={url} className="relative group rounded-2xl overflow-hidden border border-foreground/6 shadow-card aspect-square">
              <img
                loading="lazy"
                src={url}
                alt={`Photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 p-1 rounded-full bg-surface/90 text-foreground border border-foreground/6 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                <X size={14} />
              </button>
              <span className="absolute bottom-1 left-1 text-[10px] bg-foreground/50 text-white px-1.5 py-0.5 rounded-full">
                {i + 1}
              </span>
            </div>
          ))}
          {uploadingEntries.map(([id, progress]) => (
            <div key={id} className="relative rounded-2xl overflow-hidden border border-foreground/6 shadow-card aspect-square bg-foreground/5 flex items-center justify-center">
              <div className="text-center">
                <ImageIcon size={20} className="mx-auto text-foreground/30 mb-1" />
                <div className="w-12 h-1 bg-foreground/10 rounded-full mx-auto">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {remaining > 0 && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="relative border-2 border-dashed border-foreground/20 rounded-2xl p-6 text-center hover:border-primary/40 transition-colors cursor-pointer"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          <Upload size={24} className="mx-auto text-foreground/30 mb-2" />
          <p className="text-sm text-foreground/50">
            {uploading ? t("photos.uploading") : t("photos.dragToReorder")}
          </p>
          <p className="text-xs text-foreground/30 mt-1">
            {t("photos.max5")}
          </p>
        </div>
      )}
    </div>
  );
};
