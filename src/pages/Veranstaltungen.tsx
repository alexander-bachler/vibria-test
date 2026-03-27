import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Images } from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import type { VEvent } from "@/lib/api";
import ReservationModal from "@/components/ReservationModal";

// ─── EventCard – Flyer / Poster Style ────────────────────────────────────────

function EventCard({
  event,
  isPast,
  onReserve,
}: {
  event: VEvent;
  isPast?: boolean;
  onReserve?: (event: VEvent) => void;
}) {
  const dateObj = new Date(event.date);
  const day = dateObj.toLocaleDateString("de-AT", { day: "2-digit" });
  const month = dateObj.toLocaleDateString("de-AT", { month: "2-digit" });
  const year = dateObj.getFullYear();

  const hasGallery = (event.gallery_count ?? 0) > 0;

  const Wrapper = isPast && hasGallery ? Link : "div";
  const wrapperProps = isPast && hasGallery
    ? { to: `/veranstaltungen/${event.id}` }
    : {};

  return (
    <motion.article
      whileHover={
        isPast && hasGallery
          ? { y: -3, boxShadow: "0 20px 40px -15px hsl(195 100% 10% / 0.18)" }
          : !isPast
            ? { y: -3, boxShadow: "0 20px 40px -15px hsl(195 100% 10% / 0.18)" }
            : {}
      }
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`overflow-hidden rounded-sm ${isPast && !hasGallery ? "opacity-50" : isPast ? "opacity-75 hover:opacity-100" : ""}`}
    >
      {/* @ts-expect-error dynamic wrapper component */}
      <Wrapper {...wrapperProps} className={isPast && hasGallery ? "block" : undefined}>
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr]">
          {/* Image + Date Overlay */}
          <div className="relative h-64 md:h-auto overflow-hidden bg-muted">
            {event.image_path ? (
              <img
                src={getImageUrl(event.image_path)}
                alt={event.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center min-h-[200px]">
                <span className="text-8xl font-heading text-primary/15 uppercase">V</span>
              </div>
            )}

            <div className="absolute bottom-0 left-0 bg-primary/90 backdrop-blur-sm px-4 py-3 md:px-5 md:py-4">
              <div className="font-heading text-primary-foreground text-2xl md:text-3xl leading-none font-bold">
                {day}.{month}.{year}
              </div>
              <div className="font-heading text-primary-foreground/80 text-lg md:text-xl leading-none mt-0.5">
                {event.time} UHR
              </div>
            </div>

            {isPast && hasGallery && (
              <div className="absolute top-3 right-3 bg-primary/80 backdrop-blur-sm text-primary-foreground rounded px-2.5 py-1.5 flex items-center gap-1.5">
                <Images size={14} />
                <span className="font-body text-xs">{event.gallery_count} Fotos</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="bg-card border border-border border-t-0 md:border-t md:border-l-0 p-5 md:p-7 flex flex-col">
            <div className="mb-4">
              {event.type && (
                <span className="text-xs font-body uppercase tracking-[0.2em] text-muted-foreground block mb-1">
                  {event.type}
                </span>
              )}
              <h3 className="text-2xl md:text-3xl uppercase text-foreground leading-[0.95] font-extrabold">
                {event.title}
              </h3>
              {event.subtitle && (
                <p className="text-base md:text-lg text-accent font-heading uppercase tracking-wide mt-1">
                  {event.subtitle}
                </p>
              )}
            </div>

            {event.description && (
              <p className="text-sm font-body text-muted-foreground mb-5 leading-relaxed flex-1">
                {event.description}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-4 border-t border-border mt-auto">
              <div className="space-y-1">
                <span className="inline-block bg-muted text-muted-foreground font-body text-xs px-3 py-1 rounded">
                  {event.admission}
                </span>
                {isPast ? (
                  <div>
                    <span className="text-muted-foreground font-heading text-xs uppercase tracking-wider">
                      Vergangen
                    </span>
                  </div>
                ) : null}
              </div>

              {!isPast && (
                <button
                  onClick={(e) => { e.stopPropagation(); onReserve?.(event); }}
                  className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-7 py-3 rounded-sm hover:bg-accent transition-all duration-200"
                >
                  Platz reservieren
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </button>
              )}

              {isPast && hasGallery && (
                <span className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-7 py-3 rounded-sm hover:bg-accent transition-all duration-200">
                  <Images size={14} />
                  Galerie ansehen
                  <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Wrapper>
    </motion.article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Veranstaltungen() {
  const [showArchive, setShowArchive] = useState(false);
  const [reservingEvent, setReservingEvent] = useState<VEvent | null>(null);

  const { data: events = [], isLoading } = useQuery<VEvent[]>({
    queryKey: ["events"],
    queryFn: () => api.get("/api/events"),
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const past = events
    .filter((e) => e.date < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl uppercase text-foreground mb-8"
      >
        Veranstaltungen
      </motion.h1>

      {/* Upcoming Events */}
      <section id="aktuell">
        <h2 className="text-2xl md:text-3xl text-foreground uppercase mb-6">
          Aktuelles Programm
        </h2>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-52 bg-muted rounded-sm animate-pulse" />
            ))}
          </div>
        ) : upcoming.length > 0 ? (
          <div className="space-y-6">
            {upcoming.map((evt) => (
              <EventCard
                key={evt.id}
                event={evt}
                onReserve={setReservingEvent}
              />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground font-body py-4">
            Derzeit sind keine Veranstaltungen geplant. Schau bald wieder vorbei!
          </p>
        )}
      </section>

      {/* Archive */}
      {past.length > 0 && (
        <section className="mt-16">
          <button
            onClick={() => setShowArchive((v) => !v)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-heading text-sm uppercase tracking-widest mb-2 transition-colors"
          >
            {showArchive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            Vergangene Veranstaltungen ({past.length})
          </button>

          <AnimatePresence>
            {showArchive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-6">
                  {past.map((evt) => (
                    <EventCard key={evt.id} event={evt} isPast />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Reservation Modal */}
      <AnimatePresence>
        {reservingEvent && (
          <ReservationModal
            event={reservingEvent}
            onClose={() => setReservingEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
