import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Images } from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import type { VEvent } from "@/lib/api";
import ReservationModal from "@/components/ReservationModal";

const quotes = [
  {
    text: `Kunst wird erst dann interessant, wenn wir vor irgendetwas stehen,
das wir nicht gleich restlos erklären können.`,
    author: "Christoph Schlingensief",
  },
  {
    text: `Ich war schon überall auf der Welt und habe noch nie
eine Statue eines Kritikers gesehen.`,
    author: "Leonard Bernstein",
  },
];

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-AT", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function HomeEventCard({ event, onReserve }: { event: VEvent; onReserve: (e: VEvent) => void }) {
  const dateObj = new Date(event.date + "T00:00:00");
  const day = dateObj.toLocaleDateString("de-AT", { day: "2-digit" });
  const month = dateObj.toLocaleDateString("de-AT", { month: "2-digit" });
  const year = dateObj.getFullYear();

  const isMultiDay = !!(event.end_date && event.end_date > event.date);
  const endDateObj = isMultiDay ? new Date(event.end_date + "T00:00:00") : null;
  const available = event.total_seats - (event.reserved_seats ?? 0);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -3, boxShadow: "0 20px 40px -15px hsl(195 100% 10% / 0.18)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="overflow-hidden rounded-sm"
    >
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
              {isMultiDay && endDateObj
                ? `${day}.${month}. – ${endDateObj.toLocaleDateString("de-AT", { day: "2-digit" })}.${endDateObj.toLocaleDateString("de-AT", { month: "2-digit" })}.${endDateObj.getFullYear()}`
                : `${day}.${month}.${year}`}
            </div>
            <div className="font-heading text-primary-foreground/80 text-lg md:text-xl leading-none mt-0.5">
              {event.time} UHR
            </div>
          </div>
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
            <p className="text-sm font-body text-muted-foreground mb-5 leading-relaxed flex-1 line-clamp-3">
              {event.description}
            </p>
          )}

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-4 border-t border-border mt-auto">
            <div className="space-y-1">
              <span className="inline-block bg-muted text-muted-foreground font-body text-xs px-3 py-1 rounded">
                {event.admission}
              </span>
              {isMultiDay && event.reserved_by_date ? (
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1">
                  {(() => {
                    const dates: string[] = [];
                    const cur = new Date(event.date + "T00:00:00");
                    const last = new Date(event.end_date + "T00:00:00");
                    while (cur <= last) {
                      const y = cur.getFullYear();
                      const m = String(cur.getMonth() + 1).padStart(2, "0");
                      const dd = String(cur.getDate()).padStart(2, "0");
                      dates.push(`${y}-${m}-${dd}`);
                      cur.setDate(cur.getDate() + 1);
                    }
                    return dates.map((d) => {
                      const reserved = event.reserved_by_date![d] ?? 0;
                      const dayAvail = event.total_seats - reserved;
                      return (
                        <span key={d} className="font-body text-xs text-muted-foreground">
                          {formatShortDate(d)}: <span className={dayAvail <= 0 ? "text-destructive font-medium" : "text-foreground font-medium"}>{dayAvail <= 0 ? "ausgebucht" : `${dayAvail} frei`}</span>
                        </span>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="pt-1">
                  <span className={`font-body text-xs ${available <= 0 ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                    {available <= 0 ? "Ausgebucht" : `${available} von ${event.total_seats} Plätzen frei`}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onReserve(event); }}
              className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-7 py-3 rounded-sm hover:bg-accent transition-all duration-200"
            >
              Platz reservieren
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function UpcomingPreview({ onReserve }: { onReserve: (e: VEvent) => void }) {
  const { data: events = [] } = useQuery<VEvent[]>({
    queryKey: ["events"],
    queryFn: () => api.get("/api/events"),
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (upcoming.length === 0) {
    return (
      <p className="text-muted-foreground font-body py-4">
        Derzeit sind keine Veranstaltungen geplant. Schau bald wieder vorbei!
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {upcoming.map((evt) => (
        <HomeEventCard key={evt.id} event={evt} onReserve={onReserve} />
      ))}
    </div>
  );
}

export default function Home() {
  const [reservingEvent, setReservingEvent] = useState<VEvent | null>(null);

  return (
    <>
    <div>
      {/* ── Hero – Flyer-Stil ───────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[55vh] flex flex-col justify-end">
          {/* Background image */}
          <img
            src="/uploads/home/Samen-3er-logo.jpg"
            alt="VIBRIA Souterrain"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          {/* Primary overlay – same as original */}
          <div className="absolute inset-0 bg-primary/75" />

          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-16">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-2"
            >
              <span className="inline-block bg-primary-foreground/10 text-primary-foreground/80 font-body text-xs uppercase tracking-[0.3em] px-3 py-1 mb-4">
                Kunst- und Kulturverein
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-6xl lg:text-7xl text-primary-foreground uppercase leading-[0.9] mb-4"
            >
              Kunst &amp;<br />Kultur<br />
              <span className="text-primary-foreground/50 text-2xl md:text-3xl lg:text-4xl font-medium block mt-2">
                im Souterrain
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-primary-foreground/70 font-body text-sm md:text-base max-w-md leading-relaxed mb-6"
            >
              In unserem intimen Souterrain-Raum mit 40 Plätzen erleben Sie Musik,
              Geschichten und Kunst hautnah.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link
                to="/veranstaltungen"
                className="group inline-flex items-center gap-2 bg-primary-foreground text-primary font-heading text-sm uppercase tracking-wider px-7 py-3 rounded-sm hover:bg-primary-foreground/90 transition-all duration-200"
              >
                Zum Programm
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <Link
                to="/veranstaltungen/archiv"
                className="group inline-flex items-center gap-2 border border-primary-foreground/40 text-primary-foreground font-heading text-sm uppercase tracking-wider px-7 py-3 rounded-sm hover:bg-primary-foreground/10 transition-all duration-200"
              >
                Veranstaltungsarchiv
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex items-center gap-2 text-primary-foreground/40 font-body text-xs uppercase tracking-[0.2em] mt-6"
            >
              <span className="w-8 h-px bg-primary-foreground/30" />
              Reichsapfelgasse 1, 1150 Wien
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Quotes (above upcoming events) ──────── */}
      <section className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {quotes.map((q, i) => (
              <motion.blockquote
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="border-l-2 border-primary pl-5"
              >
                <p className="font-body text-sm md:text-base text-foreground/80 leading-relaxed italic mb-3 whitespace-pre-line">
                  „{q.text}“
                </p>
                <cite className="font-heading text-xs uppercase tracking-widest text-primary not-italic">
                  — {q.author}
                </cite>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nächste Veranstaltungen ─────────────── */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-12">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="text-xl md:text-2xl text-foreground uppercase">
              Nächste Termine
            </h2>
            <Link
              to="/veranstaltungen"
              className="text-primary hover:text-accent font-body text-xs uppercase tracking-wider transition-colors"
            >
              Alle Termine →
            </Link>
          </div>
          <UpcomingPreview onReserve={setReservingEvent} />
        </div>
      </section>

      {/* Videos temporarily disabled */}
    </div>

    {/* Reservation Modal */}
    <AnimatePresence>
      {reservingEvent && (
        <ReservationModal
          event={reservingEvent}
          onClose={() => setReservingEvent(null)}
        />
      )}
    </AnimatePresence>
    </>
  );
}
