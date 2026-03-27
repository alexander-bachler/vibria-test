import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import type { VEvent } from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDateLong(dateStr: string, endDateStr?: string | null): string {
  const d = new Date(dateStr);
  if (endDateStr && endDateStr !== dateStr) {
    const end = new Date(endDateStr);
    const dFmt = d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit" });
    const eFmt = end.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "long" });
    return `${dFmt}–${eFmt}`;
  }
  return d.toLocaleDateString("de-AT", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── EventCard – Flyer / Poster Style ────────────────────────────────────────

function EventCard({ event, isPast }: { event: VEvent; isPast?: boolean }) {
  const dateObj = new Date(event.date);
  const day = dateObj.toLocaleDateString("de-AT", { day: "2-digit" });
  const month = dateObj.toLocaleDateString("de-AT", { month: "2-digit" });
  const year = dateObj.getFullYear();

  const available = event.total_seats - (event.reserved_seats ?? 0);
  const soldOut = available <= 0;

  const mailSubject = encodeURIComponent(
    `Reservierung: ${event.title} – ${day}.${month}.${year}`
  );
  const mailBody = encodeURIComponent(
    `Liebe VIBRIA,\n\nIch möchte gerne Plätze für folgende Veranstaltung reservieren:\n\n${event.title}\n${day}.${month}.${year}, ${event.time} Uhr\n\nAnzahl der Plätze: \nName: \n\nMit freundlichen Grüßen`
  );

  return (
    <motion.article
      whileHover={!isPast ? { y: -3, boxShadow: "0 20px 40px -15px hsl(195 100% 10% / 0.18)" } : {}}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`overflow-hidden rounded-sm ${isPast ? "opacity-60" : ""}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr]">
        {/* ── Left: Image + Date Overlay ────────── */}
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

          {/* Date block – bold poster style */}
          <div className="absolute bottom-0 left-0 bg-primary/90 backdrop-blur-sm px-4 py-3 md:px-5 md:py-4">
            <div className="font-heading text-primary-foreground text-2xl md:text-3xl leading-none font-bold">
              {day}.{month}.{year}
            </div>
            <div className="font-heading text-primary-foreground/80 text-lg md:text-xl leading-none mt-0.5">
              {event.time} UHR
            </div>
          </div>
        </div>

        {/* ── Right: Content ───────────────────── */}
        <div className="bg-card border border-border border-t-0 md:border-t md:border-l-0 p-5 md:p-7 flex flex-col">
          {/* Title block */}
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

          {/* Bottom bar – admission + seats + CTA */}
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
              ) : soldOut ? (
                <div>
                  <span className="text-destructive font-heading text-xs uppercase tracking-wider">
                    Ausverkauft
                  </span>
                </div>
              ) : (
                <div>
                  <span className="text-sm font-body text-foreground">
                    <span className="font-bold text-lg">{available}</span>
                    <span className="text-muted-foreground"> / {event.total_seats} Plätze frei</span>
                  </span>
                </div>
              )}
            </div>

            {!soldOut && !isPast && (
              <a
                href={`mailto:office@vibria.art?subject=${mailSubject}&body=${mailBody}`}
                className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-7 py-3 rounded-sm hover:bg-accent transition-all duration-200"
              >
                <Mail size={14} />
                Platz reservieren
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

// ─── Past Event Row (compact archive view) ───────────────────────────────────

function PastEventRow({ event }: { event: VEvent }) {
  const dateObj = new Date(event.date);
  const day = dateObj.toLocaleDateString("de-AT", { day: "2-digit" });
  const month = dateObj.toLocaleDateString("de-AT", { month: "2-digit" });
  const year = dateObj.getFullYear();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border opacity-60 hover:opacity-80 transition-opacity">
      <div className="flex items-center gap-4">
        <span className="font-heading text-sm text-primary/70 tabular-nums flex-shrink-0">
          {day}.{month}.{year}
        </span>
        <div>
          <span className="font-heading text-sm uppercase text-foreground">
            {event.title}
          </span>
          {event.subtitle && (
            <span className="font-body text-xs text-muted-foreground ml-2">
              {event.subtitle}
            </span>
          )}
        </div>
      </div>
      {event.type && (
        <span className="self-start sm:self-center inline-block bg-muted text-muted-foreground font-body text-xs px-2 py-0.5 rounded uppercase tracking-wider flex-shrink-0">
          {event.type}
        </span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Veranstaltungen() {
  const [showArchive, setShowArchive] = useState(false);

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

      {/* ── Upcoming Events ──────────────────────── */}
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
              <EventCard key={evt.id} event={evt} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground font-body py-4">
            Derzeit sind keine Veranstaltungen geplant. Schau bald wieder vorbei!
          </p>
        )}
      </section>

      {/* ── Archive ──────────────────────────────── */}
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
                <div className="mt-4">
                  {past.map((evt) => (
                    <PastEventRow key={evt.id} event={evt} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}
