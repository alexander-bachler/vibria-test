import { useState, useEffect, useMemo } from "react";
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

/** Matches per-zone selectable capacity in the seating plan (max seats per reservation). */
const MAX_SEATS_PER_RESERVATION = 4;

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
  "rest-plaetze":  "Restplätze (Zusatz)",
};

function getEventDates(start: string, end: string | null): string[] {
  if (!end || end <= start) return [start];
  const dates: string[] = [];
  const current = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (current <= last) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function formatDateChip(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-AT", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("de-AT", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

export default function ReservationModal({ event, onClose }: ReservationModalProps) {
  const isMultiDay = !!(event.end_date && event.end_date > event.date);
  const eventDates = useMemo(() => getEventDates(event.date, event.end_date), [event.date, event.end_date]);

  const [selectedDate, setSelectedDate] = useState<string | null>(isMultiDay ? null : event.date);
  const [selectedZone, setSelectedZone] = useState<ZoneKey | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [seats, setSeats] = useState(1);
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const headerDateStr = selectedDate
    ? formatDateLong(selectedDate)
    : `${formatDateChip(event.date)} – ${formatDateChip(eventDates[eventDates.length - 1])}`;

  const { data: zones = {} } = useQuery<Record<string, ZoneData>>({
    queryKey: ["event-zones", event.id, selectedDate],
    queryFn: () => api.get(`/api/events/${event.id}/zones?date=${selectedDate}`),
    enabled: !!selectedDate,
    refetchInterval: 30_000,
  });

  const selectedZoneData = selectedZone ? zones[selectedZone] : null;
  const maxSeats = selectedZoneData
    ? Math.min(selectedZoneData.available, MAX_SEATS_PER_RESERVATION)
    : MAX_SEATS_PER_RESERVATION;

  useEffect(() => {
    if (selectedZone && selectedZoneData) {
      if (selectedZoneData.available <= 0) {
        setSelectedZone(null);
        setSeats(1);
      } else if (seats > maxSeats) {
        setSeats(maxSeats);
      }
    }
  }, [zones, selectedZone, selectedZoneData, seats, maxSeats]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedZone(null);
    setSeats(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      setError("Bitte wähle ein Datum aus.");
      return;
    }
    if (!selectedZone) {
      setError("Bitte wähle einen Sitzbereich aus.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post("/api/reservations", {
        event_id: event.id,
        reservation_date: selectedDate,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        seats,
        seating_zone: selectedZone,
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
                {event.title} · {headerDateStr} · {event.time} Uhr
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
                  {isMultiDay && selectedDate && (
                    <div><span className="text-muted-foreground">Datum:</span> <span className="font-medium">{formatDateLong(selectedDate)}</span></div>
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
                {/* Date selection for multi-day events */}
                {isMultiDay && (
                  <div>
                    <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-3">
                      Datum wählen <span className="text-destructive">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {eventDates.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => handleDateSelect(d)}
                          className={`px-4 py-2.5 rounded font-body text-sm transition-all
                            ${selectedDate === d
                              ? "bg-primary text-primary-foreground"
                              : "bg-card border border-border text-foreground hover:border-primary/50"
                            }`}
                        >
                          {formatDateChip(d)}
                        </button>
                      ))}
                    </div>
                    {selectedDate && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 font-body text-sm text-primary font-medium"
                      >
                        {formatDateLong(selectedDate)}
                      </motion.p>
                    )}
                  </div>
                )}

                {/* Seat Zone Map — only shown when date is selected */}
                {selectedDate && (
                  <motion.div
                    initial={isMultiDay ? { opacity: 0, y: 10 } : false}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-3">
                      Sitzbereich wählen <span className="text-destructive">*</span>
                    </label>
                    <SeatZoneMap
                      zones={zones}
                      selectedZone={selectedZone}
                      onSelect={(zone) => {
                        setSelectedZone(zone);
                        const zd = zones[zone];
                        if (zd) {
                          const cap = Math.min(zd.available, MAX_SEATS_PER_RESERVATION);
                          setSeats((s) => Math.min(s, cap) || 1);
                        }
                      }}
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
                  </motion.div>
                )}

                {/* Number of seats — only shown when date is selected */}
                {selectedDate && (
                  <div>
                    <label className="block text-xs font-body uppercase tracking-wider text-muted-foreground mb-1.5">
                      Anzahl Plätze <span className="text-destructive">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: MAX_SEATS_PER_RESERVATION }, (_, i) => i + 1).map((n) => {
                        const disabled = n > maxSeats;
                        return (
                          <button
                            key={n}
                            type="button"
                            disabled={disabled}
                            onClick={() => setSeats(n)}
                            className={`w-10 h-10 rounded font-heading text-sm transition-all
                              ${disabled
                                ? "bg-muted/40 text-muted-foreground/40 cursor-not-allowed border border-border/50"
                                : seats === n
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-card border border-border text-foreground hover:border-primary/50"
                              }`}
                          >
                            {n}
                          </button>
                        );
                      })}
                    </div>
                    {selectedZone && maxSeats < MAX_SEATS_PER_RESERVATION && (
                      <p className="font-body text-xs text-muted-foreground mt-1.5">
                        Max. {maxSeats} {maxSeats === 1 ? "Platz" : "Plätze"} in diesem Bereich verfügbar
                      </p>
                    )}
                  </div>
                )}

                {/* Contact fields — only shown when date is selected */}
                {selectedDate && (
                  <>
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

                    {/* Honeypot */}
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
                  </>
                )}

                {/* Error */}
                {error && (
                  <p className="font-body text-sm text-destructive">{error}</p>
                )}

                {/* Submit */}
                {selectedDate && (
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
                )}
              </form>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
