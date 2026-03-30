import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import SeatZoneMap from "@/components/SeatZoneMap";
import type { VEvent } from "@/lib/api";
import type { ZoneKey, ZoneData } from "@/components/SeatZoneMap";

interface ReservationModalProps {
  event: VEvent;
  onClose: () => void;
}

const ZONE_LABELS: Record<ZoneKey, string> = {
  "vorne-links":   "Vorne Links",
  "vorne-mitte":   "Vorne Mitte",
  "vorne-rechts":  "Vorne Rechts",
  "mitte-links":   "Mitte Links",
  "mitte-mitte":   "Mitte Mitte",
  "mitte-rechts":  "Mitte Rechts",
  "hinten-links":  "Hinten Links",
  "hinten-mitte":  "Hinten Mitte",
  "hinten-rechts": "Hinten Rechts",
};

/** Build an array of YYYY-MM-DD strings from start to end (inclusive). */
function getEventDays(start: string, end: string | null): string[] {
  if (!end || end <= start) return [start];
  const days: string[] = [];
  const d = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (d <= last) {
    days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

function formatDayOption(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("de-AT", {
    weekday: "short", day: "2-digit", month: "long", year: "numeric",
  });
}

export default function ReservationModal({ event, onClose }: ReservationModalProps) {
  const isMultiDay = !!event.end_date && event.end_date > event.date;
  const eventDays = getEventDays(event.date, event.end_date);

  const [selectedDay, setSelectedDay] = useState<string>(eventDays[0]);
  const [selectedZone, setSelectedZone] = useState<ZoneKey | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [honeypot, setHoneypot] = useState(""); // anti-spam
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const dateObj = new Date(event.date + "T00:00:00");
  const dateStr = isMultiDay
    ? `${dateObj.toLocaleDateString("de-AT", { day: "2-digit", month: "long" })} – ${new Date(event.end_date + "T00:00:00").toLocaleDateString("de-AT", { day: "2-digit", month: "long", year: "numeric" })}`
    : dateObj.toLocaleDateString("de-AT", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      });

  const { data: zones = {} } = useQuery<Record<string, ZoneData>>({
    queryKey: ["event-zones", event.id, isMultiDay ? selectedDay : null],
    queryFn: () => {
      const url = isMultiDay
        ? `/api/events/${event.id}/zones?date=${selectedDay}`
        : `/api/events/${event.id}/zones`;
      return api.get(url);
    },
    refetchInterval: 30_000, // refresh every 30s to show live availability
  });

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) {
      setError("Bitte wähle einen Sitzbereich aus.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/reservations", {
        event_id: event.id,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        seats,
        seating_zone: selectedZone,
        reservation_date: isMultiDay ? selectedDay : null,
        website: honeypot,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative bg-background border border-border rounded-t-xl sm:rounded-xl w-full sm:max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading text-lg uppercase text-foreground leading-tight">
                Platz reservieren
              </h2>
              <p className="font-body text-sm text-muted-foreground mt-0.5">
                {event.title} · {dateStr} · {event.time} Uhr
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0 mt-0.5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-5">
            {success ? (
              /* Success state */
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-10 text-center"
              >
                <CheckCircle className="w-14 h-14 text-primary mx-auto mb-4" />
                <h3 className="font-heading text-xl uppercase text-foreground mb-2">
                  Reservierung bestätigt!
                </h3>
                <p className="font-body text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Wir haben Ihnen eine Bestätigung an{" "}
                  <span className="text-foreground">{email}</span> geschickt.
                  Bitte nehmen Sie Ihren Platz spätestens 15 Minuten vor Beginn ein.
                </p>
                <div className="mt-6 space-y-2 font-body text-sm bg-muted/40 rounded p-4 max-w-xs mx-auto text-left">
                  {isMultiDay && (
                    <div><span className="text-muted-foreground">Tag:</span> <span className="font-medium">{formatDayOption(selectedDay)}</span></div>
                  )}
                  <div><span className="text-muted-foreground">Bereich:</span> <span className="font-medium">{selectedZone ? ZONE_LABELS[selectedZone] : ""}</span></div>
                  <div><span className="text-muted-foreground">Plätze:</span> <span className="font-medium">{seats}</span></div>
                </div>
                <button
                  onClick={onClose}
                  className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-7 py-3 rounded-sm hover:bg-accent transition-all"
                >
                  Schließen
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Day selector for multi-day events */}
                {isMultiDay && (
                  <div>
                    <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-3">
                      Tag wählen <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {eventDays.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setSelectedDay(day);
                            setSelectedZone(null);
                          }}
                          className={`px-4 py-2 rounded font-body text-sm transition-all
                            ${selectedDay === day
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border text-foreground hover:border-primary/50"
                            }`}
                        >
                          {formatDayOption(day)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Seat Zone Map */}
                <div>
                  <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-3">
                    Sitzbereich wählen <span className="text-destructive">*</span>
                  </label>
                  <SeatZoneMap
                    zones={zones}
                    selectedZone={selectedZone}
                    onSelect={(zone) => setSelectedZone(zone)}
                  />
                  {selectedZone && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-center font-body text-sm text-primary font-medium"
                    >
                      Ausgewählt: {ZONE_LABELS[selectedZone]}
                    </motion.p>
                  )}
                </div>

                {/* Number of seats */}
                <div>
                  <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-1.5">
                    Anzahl Plätze <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 6].map((n) => {
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSeats(n)}
                          className={`w-10 h-10 rounded font-heading text-sm transition-all
                            ${seats === n
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border text-foreground hover:border-primary/50"
                            }`}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contact fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-1.5">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Vor- und Nachname"
                      className="w-full bg-card border border-input rounded px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-1.5">
                      Handynummer
                    </label>
                    <input
                      type="tel"
                      maxLength={30}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+43 660 ..."
                      className="w-full bg-card border border-input rounded px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-1.5">
                      E-Mail <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      maxLength={255}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@beispiel.at"
                      className="w-full bg-card border border-input rounded px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                {/* Honeypot – hidden from real users */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Info note */}
                <div className="bg-muted/50 border border-border rounded px-4 py-3 font-body text-xs text-muted-foreground leading-relaxed">
                  VIBRIA ist ein freiwilliger Kunst- und Kulturverein. Alle Veranstaltungen werden
                  ehrenamtlich organisiert.{" "}
                  <strong className="text-foreground">
                    Bitte nehmen Sie Ihren Platz spätestens 15 Minuten vor Veranstaltungsbeginn ein.
                  </strong>
                </div>

                {/* Error */}
                {error && (
                  <p className="font-body text-sm text-destructive">{error}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || !selectedZone}
                  className="w-full bg-primary text-primary-foreground font-heading text-base uppercase tracking-wider py-3.5 rounded-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading
                    ? "Wird gesendet …"
                    : selectedZone
                      ? `${seats} ${seats === 1 ? "Platz" : "Plätze"} in ${ZONE_LABELS[selectedZone]} reservieren`
                      : "Bitte Sitzbereich wählen"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
