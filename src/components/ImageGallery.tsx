import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/imageUrl";
import type { GalleryImage } from "@/lib/api";

interface Props {
  images: GalleryImage[];
}

export default function ImageGallery({ images }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);
  const prev = () => setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  const next = () => setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null));

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => openLightbox(i)}
            className="relative overflow-hidden rounded-sm bg-muted group aspect-square"
          >
            <img
              src={getImageUrl(img.image_path)}
              alt={img.title ?? `Bild ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 text-white/70 hover:text-white p-2"
          >
            <ChevronLeft size={36} />
          </button>

          <div
            className="max-w-5xl max-h-[90vh] px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={getImageUrl(images[lightboxIndex].image_path)}
              alt={images[lightboxIndex].title ?? ""}
              className="max-h-[85vh] max-w-full object-contain rounded"
            />
            {images[lightboxIndex].title && (
              <p className="text-white/70 text-sm font-body text-center mt-2">
                {images[lightboxIndex].title}
              </p>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 text-white/70 hover:text-white p-2"
          >
            <ChevronRight size={36} />
          </button>

          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
          >
            <X size={24} />
          </button>

          <div className="absolute bottom-4 text-white/50 text-xs font-body">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
