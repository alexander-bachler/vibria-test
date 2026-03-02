import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import vibriaLogo from "@/assets/vibria-logo.svg";
import eventImage from "@/assets/event-thomas.jpg";

// ─── Types ───────────────────────────────────────────────────────────────────

interface VEvent {
  id: string;
  title: string;
  subtitle: string;
  date: string; // ISO date
  time: string;
  description: string;
  admission: string;
  totalSeats: number;
  image?: string;
}

interface Booking {
  id: string;
  eventId: string;
  name: string;
  email: string;
  tickets: number;
  createdAt: string;
}

// ─── Initial Data ────────────────────────────────────────────────────────────

const INITIAL_EVENTS: VEvent[] = [
  {
    id: "evt-1",
    title: "WER IST THOMAS FRANZ-RIEGLER",
    subtitle: "Geschichten & Musik",
    date: "2026-03-05",
    time: "19:30",
    description:
      "Ein Abend voller Geschichten und Musik mit Thomas Franz-Riegler. Tauchen Sie ein in eine Welt aus Erzählungen und Klängen im intimen Souterrain-Ambiente des VIBRIA.",
    admission: "Freiwillige Spenden",
    totalSeats: 40,
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("de-AT", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function getAvailableSeats(event: VEvent, bookings: Booking[]) {
  const booked = bookings
    .filter((b) => b.eventId === event.id)
    .reduce((sum, b) => sum + b.tickets, 0);
  return event.totalSeats - booked;
}

// ─── Main Component ─────────────────────────────────────────────────────────

const Index = () => {
  const [events, setEvents] = useState<VEvent[]>(INITIAL_EVENTS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<VEvent | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // ─── Booking form state
  const [bName, setBName] = useState("");
  const [bEmail, setBEmail] = useState("");
  const [bTickets, setBTickets] = useState(1);

  // ─── Admin form state
  const [aTitle, setATitle] = useState("");
  const [aSubtitle, setASubtitle] = useState("");
  const [aDate, setADate] = useState("");
  const [aTime, setATime] = useState("19:30");
  const [aDesc, setADesc] = useState("");
  const [aAdmission, setAAdmission] = useState("Freiwillige Spenden");

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    const available = getAvailableSeats(selectedEvent, bookings);
    if (bTickets > available || bTickets < 1) return;

    const booking: Booking = {
      id: `bk-${Date.now()}`,
      eventId: selectedEvent.id,
      name: bName.trim(),
      email: bEmail.trim(),
      tickets: bTickets,
      createdAt: new Date().toISOString(),
    };
    setBookings((prev) => [...prev, booking]);
    setBName("");
    setBEmail("");
    setBTickets(1);
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedEvent(null);
    }, 2500);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: VEvent = {
      id: `evt-${Date.now()}`,
      title: aTitle.trim(),
      subtitle: aSubtitle.trim(),
      date: aDate,
      time: aTime,
      description: aDesc.trim(),
      admission: aAdmission.trim() || "Freiwillige Spenden",
      totalSeats: 40,
    };
    setEvents((prev) => [...prev, newEvent]);
    setATitle("");
    setASubtitle("");
    setADate("");
    setATime("19:30");
    setADesc("");
    setAAdmission("Freiwillige Spenden");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-primary">
        <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-6">
          <img src={vibriaLogo} alt="VIBRIA Kunst- und Kulturverein" className="h-12 md:h-16 invert brightness-200" />
          <button
            onClick={() => { setIsAdmin(!isAdmin); setSelectedEvent(null); }}
            className="text-xs font-body uppercase tracking-widest text-primary-foreground/60 hover:text-primary-foreground transition-colors"
          >
            {isAdmin ? "← Zurück" : "Admin"}
          </button>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      {!isAdmin && !selectedEvent && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-primary pb-12 pt-6 md:pt-10 md:pb-20"
        >
          <div className="container mx-auto px-4 md:px-6">
            <h1 className="text-3xl md:text-5xl lg:text-6xl text-primary-foreground uppercase leading-tight max-w-2xl">
              Kunst & Kultur
              <br />
              <span className="text-primary-foreground/70 font-medium">im Souterrain</span>
            </h1>
            <p className="mt-4 text-primary-foreground/80 font-body text-sm md:text-base max-w-lg leading-relaxed">
              VIBRIA ist ein gemeinnütziger Kunst- und Kulturverein im Herzen von Wien. 
              In unserem intimen Souterrain-Raum mit 40 Plätzen erleben Sie Musik, Geschichten und Kunst hautnah.
            </p>
            <p className="mt-3 text-primary-foreground/50 font-body text-xs tracking-wide uppercase">
              Reichsapfelgasse 1, 1150 Wien
            </p>
          </div>
        </motion.section>
      )}

      <main className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        <AnimatePresence mode="wait">
          {/* ── Visitor: Event List ──────────────────────────────── */}
          {!isAdmin && !selectedEvent && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl md:text-3xl text-foreground uppercase mb-6">
                Programm
              </h2>
              <div className="space-y-6">
                {events.map((evt) => {
                  const available = getAvailableSeats(evt, bookings);
                  const soldOut = available <= 0;
                  return (
                    <EventCard
                      key={evt.id}
                      event={evt}
                      available={available}
                      soldOut={soldOut}
                      onSelect={() => !soldOut && setSelectedEvent(evt)}
                    />
                  );
                })}
                {events.length === 0 && (
                  <p className="text-muted-foreground font-body">
                    Derzeit sind keine Veranstaltungen geplant.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* ── Visitor: Booking Form ───────────────────────────── */}
          {!isAdmin && selectedEvent && (
            <motion.div
              key="booking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-lg mx-auto"
            >
              <button
                onClick={() => { setSelectedEvent(null); setBookingSuccess(false); }}
                className="text-sm text-muted-foreground hover:text-foreground font-body mb-6 inline-flex items-center gap-1 transition-colors"
              >
                ← Zurück zum Programm
              </button>

              {bookingSuccess ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-success/10 border border-success/30 rounded p-8 text-center"
                >
                  <div className="text-4xl mb-3">✓</div>
                  <h3 className="text-xl text-foreground mb-1">Buchung bestätigt!</h3>
                  <p className="text-muted-foreground font-body text-sm">
                    Wir freuen uns auf Ihren Besuch.
                  </p>
                </motion.div>
              ) : (
                <>
                  <h2 className="text-xl md:text-2xl text-foreground uppercase mb-1">
                    Platz reservieren
                  </h2>
                  <p className="text-muted-foreground font-body text-sm mb-6">
                    {selectedEvent.title} — {formatDate(selectedEvent.date)}, {selectedEvent.time} Uhr
                  </p>
                  <p className="text-sm font-body mb-6">
                    <span className="font-semibold text-foreground">
                      {getAvailableSeats(selectedEvent, bookings)}
                    </span>{" "}
                    <span className="text-muted-foreground">von {selectedEvent.totalSeats} Plätzen verfügbar</span>
                  </p>

                  <form onSubmit={handleBook} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={100}
                        value={bName}
                        onChange={(e) => setBName(e.target.value)}
                        className="w-full bg-card border border-input rounded px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
                        E-Mail
                      </label>
                      <input
                        type="email"
                        required
                        maxLength={255}
                        value={bEmail}
                        onChange={(e) => setBEmail(e.target.value)}
                        className="w-full bg-card border border-input rounded px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
                        Anzahl Plätze
                      </label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={getAvailableSeats(selectedEvent, bookings)}
                        value={bTickets}
                        onChange={(e) => setBTickets(Number(e.target.value))}
                        className="w-24 bg-card border border-input rounded px-3 py-2.5 font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground font-heading text-lg uppercase tracking-wider py-3 rounded hover:bg-accent transition-colors"
                    >
                      Jetzt reservieren
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          )}

          {/* ── Admin View ──────────────────────────────────────── */}
          {isAdmin && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-2xl md:text-3xl text-foreground uppercase mb-8">
                Admin-Bereich
              </h2>

              {/* Create Event */}
              <div className="bg-card border border-border rounded p-6 mb-10 max-w-lg">
                <h3 className="text-lg uppercase text-foreground mb-4">
                  Neue Veranstaltung
                </h3>
                <form onSubmit={handleCreateEvent} className="space-y-3">
                  <input
                    type="text"
                    placeholder="Titel"
                    required
                    maxLength={200}
                    value={aTitle}
                    onChange={(e) => setATitle(e.target.value)}
                    className="w-full bg-background border border-input rounded px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    placeholder="Untertitel"
                    maxLength={200}
                    value={aSubtitle}
                    onChange={(e) => setASubtitle(e.target.value)}
                    className="w-full bg-background border border-input rounded px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="date"
                      required
                      value={aDate}
                      onChange={(e) => setADate(e.target.value)}
                      className="bg-background border border-input rounded px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <input
                      type="time"
                      required
                      value={aTime}
                      onChange={(e) => setATime(e.target.value)}
                      className="bg-background border border-input rounded px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <textarea
                    placeholder="Beschreibung"
                    required
                    maxLength={1000}
                    value={aDesc}
                    onChange={(e) => setADesc(e.target.value)}
                    className="w-full bg-background border border-input rounded px-3 py-2 font-body text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <input
                    type="text"
                    placeholder="Eintritt (z.B. Freiwillige Spenden)"
                    maxLength={100}
                    value={aAdmission}
                    onChange={(e) => setAAdmission(e.target.value)}
                    className="w-full bg-background border border-input rounded px-3 py-2 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground font-body">
                    Sitzplätze werden automatisch auf 40 gesetzt.
                  </p>
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground font-heading uppercase tracking-wider px-6 py-2.5 rounded hover:bg-accent transition-colors"
                  >
                    Event anlegen
                  </button>
                </form>
              </div>

              {/* Bookings Overview */}
              <h3 className="text-lg uppercase text-foreground mb-4">
                Buchungsübersicht
              </h3>
              {events.map((evt) => {
                const evtBookings = bookings.filter((b) => b.eventId === evt.id);
                const totalBooked = evtBookings.reduce((s, b) => s + b.tickets, 0);
                return (
                  <div key={evt.id} className="bg-card border border-border rounded p-5 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <h4 className="font-heading text-base uppercase text-foreground">
                        {evt.title}
                      </h4>
                      <span className="text-xs font-body text-muted-foreground">
                        {formatDate(evt.date)} · {evt.time} Uhr · {totalBooked}/{evt.totalSeats} gebucht
                      </span>
                    </div>
                    {evtBookings.length === 0 ? (
                      <p className="text-sm text-muted-foreground font-body">Noch keine Buchungen.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm font-body">
                          <thead>
                            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                              <th className="pb-2 pr-4">Name</th>
                              <th className="pb-2 pr-4">E-Mail</th>
                              <th className="pb-2 pr-4">Plätze</th>
                              <th className="pb-2">Datum</th>
                            </tr>
                          </thead>
                          <tbody>
                            {evtBookings.map((b) => (
                              <tr key={b.id} className="border-b border-border/50">
                                <td className="py-2 pr-4 text-foreground">{b.name}</td>
                                <td className="py-2 pr-4 text-muted-foreground">{b.email}</td>
                                <td className="py-2 pr-4 text-foreground">{b.tickets}</td>
                                <td className="py-2 text-muted-foreground text-xs">
                                  {new Date(b.createdAt).toLocaleString("de-AT")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <p className="text-xs text-muted-foreground font-body">
            VIBRIA | Kunst- und Kulturverein · Reichsapfelgasse 1, 1150 Wien
          </p>
          <div className="flex justify-center gap-4 mt-3">
            <a href="https://www.instagram.com/vibria.art/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-body">
              Instagram
            </a>
            <a href="https://www.facebook.com/vibria.art" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-body">
              Facebook
            </a>
            <a href="https://www.vibria.art/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-body">
              Website
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// ─── Event Card ──────────────────────────────────────────────────────────────

function EventCard({
  event,
  available,
  soldOut,
  onSelect,
}: {
  event: VEvent;
  available: number;
  soldOut: boolean;
  onSelect: () => void;
}) {
  return (
    <motion.article
      whileHover={{ y: -2 }}
      className={`bg-card border border-border rounded overflow-hidden cursor-pointer transition-shadow hover:shadow-lg ${
        soldOut ? "opacity-60 cursor-not-allowed" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex flex-col md:flex-row">
        {/* Image area */}
        {event.id === "evt-1" && (
          <div className="md:w-64 h-48 md:h-auto overflow-hidden flex-shrink-0">
            <img
              src={eventImage}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-5 md:p-6 flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
            <div>
              <h3 className="text-lg md:text-xl uppercase text-foreground leading-tight">
                {event.title}
              </h3>
              {event.subtitle && (
                <p className="text-sm text-accent font-heading uppercase tracking-wide">
                  {event.subtitle}
                </p>
              )}
            </div>
            {soldOut ? (
              <span className="inline-block bg-destructive/10 text-destructive font-heading text-xs uppercase tracking-wider px-3 py-1 rounded flex-shrink-0">
                Ausverkauft
              </span>
            ) : (
              <span className="inline-block bg-success/10 text-success font-body text-xs px-3 py-1 rounded flex-shrink-0">
                {available} Plätze frei
              </span>
            )}
          </div>
          <p className="text-sm font-body text-muted-foreground mb-4 leading-relaxed">
            {event.description}
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-body text-muted-foreground mb-4">
            <span>{formatDate(event.date)}</span>
            <span>{event.time} Uhr</span>
            <span className="text-accent font-medium">{event.admission}</span>
          </div>
          <div className="mt-auto">
            {!soldOut ? (
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-6 py-2.5 rounded hover:bg-accent transition-colors"
              >
                Sitzplatz buchen
              </button>
            ) : (
              <span className="inline-block font-body text-sm text-muted-foreground italic">
                Keine Plätze mehr verfügbar
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default Index;
