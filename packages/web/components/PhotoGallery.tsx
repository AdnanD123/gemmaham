import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface PhotoGalleryProps {
  photos: string[];
  alt?: string;
}

export const PhotoGallery = ({ photos, alt = "Property photo" }: PhotoGalleryProps) => {
  const { t } = useTranslation();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % photos.length);
  }, [lightboxIndex, photos.length]);

  const goPrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
  }, [lightboxIndex, photos.length]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, goNext, goPrev]);

  if (!photos || photos.length === 0) return null;

  return (
    <>
      {/* Gallery Grid */}
      <div className="mb-6">
        <h2 className="font-semibold text-lg mb-3">{t("photos.gallery")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <button
              key={url}
              onClick={() => openLightbox(i)}
              aria-label={`${alt} ${i + 1} — ${t("photos.openLightbox")}`}
              className={`relative overflow-hidden rounded-2xl border border-foreground/6 shadow-card cursor-pointer group focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 ${
                i === 0 ? "col-span-2 row-span-2" : ""
              }`}
            >
              <img
                loading="lazy"
                src={url}
                alt={`${alt} ${i + 1}`}
                className={`w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                  i === 0 ? "h-64 md:h-80" : "h-32 md:h-40"
                }`}
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Overlay */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={t("photos.gallery")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-foreground/60"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative max-w-5xl max-h-[90vh] w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={photos[lightboxIndex]}
                alt={`${alt} ${lightboxIndex + 1}`}
                className="w-full max-h-[85vh] object-contain rounded-2xl"
              />

              {/* Photo counter */}
              <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-foreground/40 px-3 py-1 rounded-full backdrop-blur-sm">
                {t("photos.photoOf", { current: lightboxIndex + 1, total: photos.length })}
              </p>

              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute top-2 right-2 sm:-top-3 sm:-right-3 p-3 sm:p-2 rounded-full bg-surface text-foreground border border-foreground/6 shadow-card hover:bg-foreground/10 transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                aria-label={t("photos.close")}
              >
                <X size={20} />
              </button>

              {/* Navigation arrows */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 sm:p-2 rounded-full bg-surface/80 text-foreground border border-foreground/6 shadow-card hover:bg-surface transition-colors backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                    aria-label={t("photos.previous")}
                  >
                    <ChevronLeft size={28} className="sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={goNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 sm:p-2 rounded-full bg-surface/80 text-foreground border border-foreground/6 shadow-card hover:bg-surface transition-colors backdrop-blur-sm focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
                    aria-label={t("photos.next")}
                  >
                    <ChevronRight size={28} className="sm:w-6 sm:h-6" />
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
