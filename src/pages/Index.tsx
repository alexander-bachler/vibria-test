import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import vibriaLogo from "@/assets/vibria-logo.svg";
import eventImage from "@/assets/event-thomas.jpg";
import eventMirtilli from "@/assets/event-mirtilli.jpg";
import eventJungeTalente from "@/assets/event-junge-talente.jpg";
import eventLeichtglaeubige from "@/assets/event-leichtglaeubige.png";
import eventWeihnachtsmarkt from "@/assets/event-weihnachtsmarkt.png";
import eventJavier from "@/assets/event-javier.png";
import heroImage from "@/assets/hero-souterrain.png";
import SeatMap from "@/components/SeatMap";

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
  seatIds: string[];
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
  {
    id: "evt-2",
    title: "ENSEMBLE MIRTILLI SUONANTI",
    subtitle: "Komponistinnen aus alter Zeit und ihre Kollegen",
    date: "2026-03-14",
    time: "19:30",
    description:
      "Tauchen wir ein in die faszinierende Klangwelt von Renaissance und Barock! Das Ensemble Mirtilli suonanti entführt uns mit historischen Originalinstrumenten – darunter die zarte Traversflöte und die wundervoll klingende Viola da gamba. Im Mittelpunkt stehen die Werke brillanter Komponistinnen dieser Epoche. Maria Posch (Traversflöten), Maria Brüssing (Viola da gamba), Romina Mayer (Traversflöten).",
    admission: "Freiwillige Spenden",
    totalSeats: 40,
    image: "mirtilli",
  },
  {
    id: "evt-3",
    title: "JUNGE TALENTE AM WERK",
    subtitle: "Sologitarre und Sologesang",
    date: "2026-02-14",
    time: "18:00",
    description:
      "Junge, talentierte Musiker:innen betreten die Bühne – mit berührendem Sologesang und virtuoser Sologitarre. Talente: Salome Vladar, Hanna Zlattinger, Lena Marie Parb, Luisa Fernández-Flurschütz, Miriam Kickinger.",
    admission: "Freiwillige Spenden",
    totalSeats: 40,
    image: "junge-talente",
  },
  {
    id: "evt-4",
    title: "DIE GESELLSCHAFT DER LEICHTGLÄUBIGEN",
    subtitle: "Theaterperformance",
    date: "2026-02-28",
    time: "19:30",
    description:
      "Eine packende Theaterperformance, die uns zum Nachdenken bringt. Erleben Sie einen Abend voller Dramatik und Tiefgang im VIBRIA.",
    admission: "Freiwillige Spenden",
    totalSeats: 40,
    image: "leichtglaeubige",
  },
  {
    id: "evt-5",
    title: "JAVIER MEDINA BERNAL",
    subtitle: "Live-Konzert",
    date: "2026-01-24",
    time: "19:30",
    description:
      "Ein mitreißendes Live-Konzert mit Javier Medina Bernal. Lassen Sie sich von seiner Musik verzaubern – ein unvergesslicher Abend im intimen Rahmen des VIBRIA.",
    admission: "Freiwillige Spenden",
    totalSeats: 40,
    image: "javier",
  },
  {
    id: "evt-6",
    title: "VIBRIA WEIHNACHTSMARKT",
    subtitle: "Handwerkskunst & Heißgetränke",
    date: "2025-12-20",
    time: "12:00",
    description:
      "Handwerkskunst & Heißgetränke am 20.–21. Dezember, 12:00–18:00 Uhr. Extra: Am 21. Dezember um 17:30 Uhr – Tee und Arirang: Ausklang mit koreanischem Tee und Konzert.",
    admission: "Freiwillige Spenden",
    totalSeats: 40,
    image: "weihnachtsmarkt",
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
  const [bSelectedSeats, setBSelectedSeats] = useState<string[]>([]);

  // ─── Admin form state
  const [aTitle, setATitle] = useState("");
  const [aSubtitle, setASubtitle] = useState("");
  const [aDate, setADate] = useState("");
  const [aTime, setATime] = useState("19:30");
  const [aDesc, setADesc] = useState("");
  const [aAdmission, setAAdmission] = useState("Freiwillige Spenden");

  const handleBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || bSelectedSeats.length === 0) return;

    const booking: Booking = {
      id: `bk-${Date.now()}`,
      eventId: selectedEvent.id,
      name: bName.trim(),
      email: bEmail.trim(),
      tickets: bSelectedSeats.length,
      seatIds: [...bSelectedSeats],
      createdAt: new Date().toISOString(),
    };
    setBookings((prev) => [...prev, booking]);
    setBName("");
    setBEmail("");
    setBSelectedSeats([]);
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
      <header className="bg-primary sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between py-4 px-4 md:px-6">
          <img
            src={vibriaLogo}
            alt="VIBRIA Kunst- und Kulturverein"
            className="h-12 md:h-16 invert brightness-200 cursor-pointer"
            onClick={() => { setIsAdmin(false); setSelectedEvent(null); setBookingSuccess(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          />
          <nav className="flex items-center gap-5 md:gap-7">
            <a href="#veranstaltungen" className="text-xs font-body uppercase tracking-widest text-primary-foreground/70 hover:text-primary-foreground transition-colors hidden sm:inline">
              Programm
            </a>
            <a href="#adresse" className="text-xs font-body uppercase tracking-widest text-primary-foreground/70 hover:text-primary-foreground transition-colors hidden sm:inline">
              Adresse
            </a>
            <a href="#kontakt" className="text-xs font-body uppercase tracking-widest text-primary-foreground/70 hover:text-primary-foreground transition-colors hidden sm:inline">
              Kontakt
            </a>
            <button
              onClick={() => { setIsAdmin(!isAdmin); setSelectedEvent(null); }}
              className="text-xs font-body uppercase tracking-widest text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              {isAdmin ? "← Zurück" : "Admin"}
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero – Flyer-Stil ──────────────────────────────────── */}
      {!isAdmin && !selectedEvent && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative overflow-hidden"
        >
          <div className="relative min-h-[50vh] flex flex-col justify-end">
            <img
              src={heroImage}
              alt="VIBRIA Souterrain Veranstaltung"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-primary/75" />
            <div className="relative z-10 container mx-auto px-4 md:px-6 py-8 md:py-12 lg:py-14">
              <div className="mb-2">
                <span className="inline-block bg-primary-foreground/10 text-primary-foreground/80 font-body text-xs uppercase tracking-[0.3em] px-3 py-1 mb-4">
                  Kunst- und Kulturverein
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl text-primary-foreground uppercase leading-[0.9] mb-4">
                Kunst &<br />Kultur<br />
                <span className="text-primary-foreground/50 text-2xl md:text-3xl lg:text-4xl font-medium block mt-2">
                  im Souterrain
                </span>
              </h1>
              <p className="text-primary-foreground/70 font-body text-sm md:text-base max-w-md leading-relaxed mb-6">
                In unserem intimen Souterrain-Raum mit 40 Plätzen erleben Sie Musik, Geschichten und Kunst hautnah.
              </p>
              <div className="flex items-center gap-2 text-primary-foreground/40 font-body text-xs uppercase tracking-[0.2em]">
                <span className="w-8 h-px bg-primary-foreground/30" />
                Reichsapfelgasse 1, 1150 Wien
              </div>
            </div>
          </div>
        </motion.section>
      )}

      <main id="veranstaltungen" className="container mx-auto px-4 md:px-6 py-8 md:py-12 scroll-mt-20">
        <AnimatePresence mode="wait">
          {/* ── Visitor: Event List ──────────────────────────────── */}
          {!isAdmin && !selectedEvent && (
            <motion.div
              key="events"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
                const upcoming = sorted.filter((e) => e.date >= today);
                const past = sorted.filter((e) => e.date < today).reverse();

                return (
                  <>
                    {/* Aktuelle Veranstaltungen */}
                    <h2 className="text-2xl md:text-3xl text-foreground uppercase mb-6">
                      Aktuelle Veranstaltungen
                    </h2>
                    {upcoming.length > 0 ? (
                      <div className="space-y-6">
                        {upcoming.map((evt) => {
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
                      </div>
                    ) : (
                      <p className="text-muted-foreground font-body mb-8">
                        Derzeit sind keine Veranstaltungen geplant.
                      </p>
                    )}

                    {/* Vergangene Veranstaltungen */}
                    {past.length > 0 && (
                      <>
                        <h2 className="text-2xl md:text-3xl text-foreground uppercase mt-14 mb-6 opacity-70">
                          Vergangene Veranstaltungen
                        </h2>
                        <div className="space-y-6 opacity-75">
                          {past.map((evt) => (
                            <EventCard
                              key={evt.id}
                              event={evt}
                              available={0}
                              soldOut={true}
                              onSelect={() => {}}
                              isPast
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* ── Visitor: Booking Form ───────────────────────────── */}
          {!isAdmin && selectedEvent && (
            <motion.div
              key="booking"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto"
            >
              <button
                onClick={() => { setSelectedEvent(null); setBookingSuccess(false); setBSelectedSeats([]); }}
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

                  {/* Seat Map */}
                  <div className="mb-8">
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-3">
                      Plätze auswählen
                    </label>
                    <SeatMap
                      bookedSeatIds={bookings
                        .filter((b) => b.eventId === selectedEvent.id)
                        .flatMap((b) => b.seatIds)}
                      selectedSeatIds={bSelectedSeats}
                      onToggleSeat={(seatId) => {
                        setBSelectedSeats((prev) =>
                          prev.includes(seatId)
                            ? prev.filter((s) => s !== seatId)
                            : [...prev, seatId]
                        );
                      }}
                    />
                  </div>

                  <form onSubmit={handleBook} className="space-y-4 max-w-md">
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
                    <button
                      type="submit"
                      disabled={bSelectedSeats.length === 0}
                      className="w-full bg-primary text-primary-foreground font-heading text-lg uppercase tracking-wider py-3 rounded hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {bSelectedSeats.length > 0
                        ? `${bSelectedSeats.length} ${bSelectedSeats.length === 1 ? "Platz" : "Plätze"} reservieren`
                        : "Bitte Plätze auswählen"}
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

      {/* ── Video-Sektion ──────────────────────────────────────── */}
      {!isAdmin && !selectedEvent && (
        <section className="bg-card border-t border-border">
          <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
            <h2 className="text-2xl md:text-3xl text-foreground uppercase mb-2">
              VIBRIA auf YouTube
            </h2>
            <p className="text-muted-foreground font-body text-sm mb-8 max-w-xl">
              Erleben Sie Ausschnitte unserer Veranstaltungen, Künstlerporträts und Einblicke in unser Souterrain.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* Platzhalter-Videos – Video-IDs hier ersetzen */}
              {[
                { id: "-f2dO_LehcA", label: "Lange Nacht der Chöre 2024 – Frauenchor BORG St.Pölten" },
                { id: "-fTy33vihkM", label: "Meine Lippen, sie küssen so heiss – Franz Lehár" },
                { id: "AcoblNB3zLA", label: "Wenn zur Ruh die Glocken läuten – Gerhard Winkle" },
              ].map((video, i) => (
                <div key={i} className="relative overflow-hidden rounded-sm bg-muted" style={{ aspectRatio: "16/9" }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${video.id}`}
                    title={video.label}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            <a
              href="https://www.youtube.com/@vibria-kunst-und-kulturverein"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-7 py-3 rounded-sm hover:bg-accent transition-all duration-200"
            >
              Alle Videos ansehen
              <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
            </a>
          </div>
        </section>
      )}

      {/* ── Adresse ──────────────────────────────────────────── */}
      {!isAdmin && !selectedEvent && (
        <section id="adresse" className="scroll-mt-20 border-t border-border">
          <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
            <h2 className="text-2xl md:text-3xl text-foreground uppercase mb-8">
              Adresse
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg text-foreground font-heading uppercase mb-3">VIBRIA | Kunst- und Kulturverein</h3>
                <p className="font-body text-muted-foreground leading-relaxed mb-4">
                  Reichsapfelgasse 1<br />
                  1150 Wien<br />
                  Österreich
                </p>
                <p className="font-body text-sm text-muted-foreground">
                  Unser Souterrain befindet sich im Erdgeschoss – barrierefrei erreichbar.
                </p>
              </div>
              <div className="rounded-sm overflow-hidden bg-muted" style={{ minHeight: 280 }}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2659.5!2d16.3330!3d48.1960!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476d078a1c6b1e3b%3A0x0!2sReichsapfelgasse%201%2C%201150%20Wien!5e0!3m2!1sde!2sat!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: 280 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Standort VIBRIA"
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Kontakt ─────────────────────────────────────────────── */}
      {!isAdmin && !selectedEvent && (
        <section id="kontakt" className="scroll-mt-20 bg-card border-t border-border">
          <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
            <h2 className="text-2xl md:text-3xl text-foreground uppercase mb-8">
              Kontakt
            </h2>
            <div className="max-w-lg">
              <p className="font-body text-muted-foreground leading-relaxed mb-6">
                Fragen zu unseren Veranstaltungen oder zur Reservierung? Schreiben Sie uns gerne!
              </p>
              <div className="space-y-3 font-body text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-primary font-heading text-lg">✉</span>
                  <a href="mailto:info@vibria.art" className="text-foreground hover:text-primary transition-colors">
                    info@vibria.art
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary font-heading text-lg">◆</span>
                  <a href="https://www.instagram.com/vibria.art/" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                    @vibria.art auf Instagram
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-primary font-heading text-lg">◆</span>
                  <a href="https://www.facebook.com/vibria.art" target="_blank" rel="noopener noreferrer" className="text-foreground hover:text-primary transition-colors">
                    VIBRIA auf Facebook
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

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
            <a href="https://www.youtube.com/@vibria-kunst-und-kulturverein" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors text-xs font-body">
              YouTube
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

// ─── Event Card – Flyer/Poster Style ─────────────────────────────────────────

function EventCard({
  event,
  available,
  soldOut,
  onSelect,
  isPast,
}: {
  event: VEvent;
  available: number;
  soldOut: boolean;
  onSelect: () => void;
  isPast?: boolean;
}) {
  // Parse date for poster display
  const dateObj = new Date(event.date);
  const day = dateObj.toLocaleDateString("de-AT", { day: "2-digit" });
  const month = dateObj.toLocaleDateString("de-AT", { month: "2-digit" });
  const year = dateObj.getFullYear();

  return (
    <motion.article
      whileHover={{ y: -3, boxShadow: "0 20px 40px -15px hsl(195 90% 16% / 0.15)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`overflow-hidden rounded-sm ${soldOut ? "opacity-60" : ""}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[340px_1fr]">
        {/* Left: Image with poster overlay */}
        <div className="relative h-64 md:h-auto overflow-hidden bg-muted">
          {(() => {
            const imgMap: Record<string, string> = {
              "evt-1": eventImage,
              "mirtilli": eventMirtilli,
              "junge-talente": eventJungeTalente,
              "leichtglaeubige": eventLeichtglaeubige,
              "weihnachtsmarkt": eventWeihnachtsmarkt,
              "javier": eventJavier,
            };
            const src = event.image ? imgMap[event.image] : (event.id === "evt-1" ? eventImage : undefined);
            return src ? (
              <img src={src} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <span className="text-6xl font-heading text-primary/20 uppercase">V</span>
              </div>
            );
          })()}
          {/* Date overlay – like the flyer's bold date block */}
          <div className="absolute bottom-0 left-0 bg-primary/90 backdrop-blur-sm px-4 py-3 md:px-5 md:py-4">
            <div className="font-heading text-primary-foreground text-2xl md:text-3xl leading-none font-bold">
              {day}.{month}.{year}
            </div>
            <div className="font-heading text-primary-foreground/80 text-lg md:text-xl leading-none mt-0.5">
              {event.time} UHR
            </div>
          </div>
        </div>

        {/* Right: Content */}
        <div className="bg-card border border-border border-l-0 p-5 md:p-7 flex flex-col">
          {/* Title block – mimicking the flyer hierarchy */}
          <div className="mb-4">
            {event.title.includes(" - ") || event.title.includes("WER IST") ? (
              <>
                <span className="text-xs font-heading uppercase tracking-[0.2em] text-muted-foreground block mb-1">
                  {event.title.split(/\s*[-–]\s*/)[0] || ""}
                </span>
                <h3 className="text-2xl md:text-3xl uppercase text-foreground leading-[0.95] font-extrabold">
                  {event.title.split(/\s*[-–]\s*/).slice(1).join(" - ") || event.title}
                </h3>
              </>
            ) : (
              <h3 className="text-2xl md:text-3xl uppercase text-foreground leading-[0.95] font-extrabold">
                {event.title}
              </h3>
            )}
            {event.subtitle && (
              <p className="text-base md:text-lg text-accent font-heading uppercase tracking-wide mt-1">
                {event.subtitle}
              </p>
            )}
          </div>

          <p className="text-sm font-body text-muted-foreground mb-5 leading-relaxed flex-1">
            {event.description}
          </p>

          {/* Bottom bar – admission + seats + CTA */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 pt-4 border-t border-border">
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
              ) : (
                <div>
                  {soldOut ? (
                    <span className="text-destructive font-heading text-xs uppercase tracking-wider">
                      Ausverkauft
                    </span>
                  ) : (
                    <span className="text-sm font-body text-foreground">
                      <span className="font-bold text-lg">{available}</span>
                      <span className="text-muted-foreground"> / {event.totalSeats} Plätze frei</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            {!soldOut && !isPast && (
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                className="group inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-7 py-3 rounded-sm hover:bg-accent transition-all duration-200"
              >
                Sitzplatz buchen
                <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

export default Index;
