import { useState, useCallback, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, X, Images } from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import type { VEvent, EventImage } from "@/lib/api";

function Lightbox({
  images,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: {
  images: EventImage[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const img = images[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
      >
        <X size={28} />
      </button>

      {/* Counter */}
      <div className="absolute top-4 left-4 text-white/50 font-body text-sm z-10">
        {currentIndex + 1} / {images.length}
      </div>

      {/* Prev */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-10 p-2"
        >
          <ChevronLeft size={36} />
        </button>
      )}

      {/* Image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={img.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          src={getImageUrl(img.image_path)}
          alt={`Bild ${currentIndex + 1}`}
          className="max-h-[90vh] max-w-[90vw] object-contain rounded"
          onClick={(e) => e.stopPropagation()}
        />
      </AnimatePresence>

      {/* Next */}
      {images.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors z-10 p-2"
        >
          <ChevronRight size={36} />
        </button>
      )}
    </motion.div>
  );
}

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: event, isLoading: eventLoading } = useQuery<VEvent>({
    queryKey: ["event", id],
    queryFn: () => api.get(`/api/events/${id}`),
    enabled: !!id,
  });

  const { data: images = [] } = useQuery<EventImage[]>({
    queryKey: ["event-images", id],
    queryFn: () => api.get(`/api/events/${id}/images`),
    enabled: !!id,
  });

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prevImage = () =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  const nextImage = () =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null));

  if (eventLoading) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="h-64 bg-muted rounded-sm animate-pulse" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container mx-auto px-4 md:px-6 py-12 text-center">
        <p className="text-muted-foreground font-body mb-4">Veranstaltung nicht gefunden.</p>
        <Link to="/veranstaltungen" className="text-primary hover:text-accent font-body text-sm">
          ← Zurück zu allen Veranstaltungen
        </Link>
      </div>
    );
  }

  const dateObj = new Date(event.date);
  const dateStr = dateObj.toLocaleDateString("de-AT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Hero with main image */}
      <div className="relative overflow-hidden">
        <div className="relative min-h-[35vh] md:min-h-[45vh] flex flex-col justify-end">
          {event.image_path ? (
            <img
              src={getImageUrl(event.image_path)}
              alt={event.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-primary/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/50 to-primary/20" />

          <div className="relative z-10 container mx-auto px-4 md:px-6 py-8 md:py-12">
            <Link
              to="/veranstaltungen"
              className="inline-flex items-center gap-1 text-primary-foreground/60 hover:text-primary-foreground font-body text-sm mb-4 transition-colors"
            >
              <ArrowLeft size={14} />
              Alle Veranstaltungen
            </Link>

            {event.type && (
              <span className="block text-xs font-body uppercase tracking-[0.2em] text-primary-foreground/60 mb-1">
                {event.type}
              </span>
            )}
            <h1 className="text-3xl md:text-5xl lg:text-6xl uppercase text-primary-foreground leading-[0.95] font-extrabold mb-2">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="text-lg md:text-xl text-primary-foreground/70 font-heading uppercase tracking-wide">
                {event.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-primary-foreground/80 font-body text-sm">
              <span>{dateStr}</span>
              <span className="w-1 h-1 rounded-full bg-primary-foreground/40" />
              <span>{event.time} Uhr</span>
              <span className="w-1 h-1 rounded-full bg-primary-foreground/40" />
              <span>{event.admission}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Description */}
        {event.description && (
          <div className="max-w-3xl mb-12">
            <p className="font-body text-muted-foreground leading-relaxed text-base">
              {event.description}
            </p>
          </div>
        )}

        {/* Gallery */}
        {images.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Images size={20} className="text-primary" />
              <h2 className="text-xl md:text-2xl text-foreground uppercase">
                Galerie
              </h2>
              <span className="text-muted-foreground font-body text-sm ml-1">
                ({images.length} Fotos)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((img, i) => (
                <motion.button
                  key={img.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.03 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => openLightbox(i)}
                  className="relative aspect-[4/3] overflow-hidden rounded-sm bg-muted group cursor-pointer"
                >
                  <img
                    src={getImageUrl(img.image_path)}
                    alt={`${event.title} – Foto ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors duration-200" />
                </motion.button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            images={images}
            currentIndex={lightboxIndex}
            onClose={closeLightbox}
            onPrev={prevImage}
            onNext={nextImage}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
