import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { MapPin, Mail, Mic } from "lucide-react";
import { api } from "@/lib/api";

export default function Kontakt() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      await api.post("/api/contact", form);
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "", website: "" });
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Unbekannter Fehler");
    }
  };

  const newsletterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = newsletterRef.current;
    if (!container) return;

    const existingScript = document.querySelector(
      'script[src="https://app.mailjet.com/pas-nc-pop-in-v1.js"]'
    );
    if (existingScript) existingScript.remove();

    const script = document.createElement("script");
    script.src = "https://app.mailjet.com/pas-nc-pop-in-v1.js";
    script.type = "text/javascript";
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="container mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-6 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-3 block">
            Schreib uns
          </span>
          <h1 className="text-3xl md:text-5xl uppercase text-foreground leading-[0.95]">
            Kontakt
          </h1>
        </motion.div>
      </div>

      {/* Lead text */}
      <div className="container mx-auto px-4 md:px-6 pb-10 md:pb-14">
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-body text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl"
        >
          Hast du Fragen, Anregungen oder möchtest du Teil unserer Gemeinschaft werden?
          Wir freuen uns über jede Nachricht.
        </motion.p>
      </div>

      {/* Form + Adresse */}
      <div className="bg-card border-y border-border">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="grid md:grid-cols-5 gap-10 md:gap-14">
            {/* Left: Form – 3 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-3"
            >
              <h3 className="font-heading text-xs uppercase tracking-wider text-primary mb-5">Nachricht senden</h3>
              {status === "success" ? (
                <div className="bg-primary/5 border border-primary/20 rounded-sm p-6 text-center">
                  <div className="text-3xl mb-2 text-primary">✓</div>
                  <h3 className="font-heading text-lg uppercase text-foreground mb-1">Nachricht gesendet!</h3>
                  <p className="font-body text-sm text-muted-foreground">
                    Vielen Dank! Wir melden uns so bald wie möglich.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-4 text-sm font-body text-primary underline underline-offset-4"
                  >
                    Neue Nachricht
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" name="website" value={form.website} onChange={handleChange} className="hidden" tabIndex={-1} autoComplete="off" />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1.5">Name *</label>
                      <input type="text" name="name" required maxLength={100} value={form.name} onChange={handleChange}
                        className="w-full bg-background border border-input rounded px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1.5">E-Mail *</label>
                      <input type="email" name="email" required maxLength={255} value={form.email} onChange={handleChange}
                        className="w-full bg-background border border-input rounded px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1.5">Betreff</label>
                    <input type="text" name="subject" maxLength={200} value={form.subject} onChange={handleChange}
                      className="w-full bg-background border border-input rounded px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1.5">Nachricht *</label>
                    <textarea name="message" required maxLength={2000} rows={5} value={form.message} onChange={handleChange}
                      className="w-full bg-background border border-input rounded px-3 py-2.5 font-body text-sm text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  {status === "error" && (
                    <p className="text-destructive font-body text-sm">{errorMsg}</p>
                  )}
                  <button type="submit" disabled={status === "sending"}
                    className="w-full bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider py-3 rounded-sm hover:bg-accent transition-colors disabled:opacity-50">
                    {status === "sending" ? "Wird gesendet…" : "Nachricht senden"}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Right: Adresse & Karte – 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 space-y-5"
            >
              <h3 className="font-heading text-xs uppercase tracking-wider text-primary mb-1">Adresse & Anfahrt</h3>

              <div className="bg-background border border-border rounded-sm p-4 space-y-4">
                <div className="flex gap-3">
                  <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  <div className="font-body text-sm text-muted-foreground">
                    <p className="text-foreground font-medium mb-0.5">VIBRIA | Kunst- und Kulturverein</p>
                    <p>Reichsapfelgasse 1/30, 1150 Wien</p>
                    <p className="text-xs mt-0.5">(blaue Türe rechts vom Haustor)</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Mail size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  <a href="mailto:office@vibria.art" className="font-body text-sm text-foreground hover:text-primary transition-colors">
                    office@vibria.art
                  </a>
                </div>
              </div>

              <div className="rounded-sm overflow-hidden border border-border">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d665.7!2d16.3237!3d48.18659!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476d07cdc1e90ea5%3A0x0!2sReichsapfelgasse%201%2C%201150%20Wien!5e0!3m2!1sde!2sat!4v1700000000000"
                  width="100%"
                  height="200"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Standort VIBRIA"
                />
              </div>

              <div className="flex gap-3 font-body text-xs">
                <a href="https://maps.app.goo.gl/YokJDNCi8jyqvwfr5" target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:text-accent underline underline-offset-4 transition-colors">
                  Google Maps →
                </a>
                <a href="https://www.openstreetmap.org/#map=19/48.186588/16.324632" target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:text-accent underline underline-offset-4 transition-colors">
                  OpenStreetMap →
                </a>
              </div>

              <p className="font-body text-xs text-muted-foreground">
                <strong className="text-foreground">Öffentliche Anbindung:</strong>{" "}
                U4 Meidling Hauptstraße · U4 Schönbrunn · 57A Hollergasse
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Newsletter */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="text-center mb-8">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-2 block">
            Immer informiert
          </span>
          <h2 className="text-2xl md:text-3xl uppercase text-foreground mb-3">Newsletter</h2>
          <p className="font-body text-sm text-muted-foreground max-w-md mx-auto">
            Bleib auf dem Laufenden! Melde dich an und erfahre als Erste:r von neuen Veranstaltungen.
          </p>
        </div>
        <div className="max-w-xl mx-auto" ref={newsletterRef}>
          <iframe
            data-w-type="embedded"
            frameBorder="0"
            scrolling="no"
            marginHeight={0}
            marginWidth={0}
            src="https://sq5z8.mjt.lu/wgt/sq5z8/xy7v/form?c=300eedbb"
            width="100%"
            style={{ minHeight: 450 }}
            title="Newsletter Anmeldung"
          />
        </div>
      </div>

      {/* Künstleranfrage */}
      <div className="bg-primary">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="grid md:grid-cols-5 gap-8 md:gap-14 items-center">
            <div className="md:col-span-3">
              <span className="font-body text-xs uppercase tracking-[0.3em] text-primary-foreground/50 mb-3 block">
                Für Künstler:innen
              </span>
              <h2 className="text-xl md:text-2xl uppercase text-primary-foreground mb-3">
                Dein Platz auf der Bühne wartet!
              </h2>
              <p className="font-body text-sm text-primary-foreground/80 leading-relaxed">
                Du brennst darauf, als Künstler:in bei VIBRIA aufzutreten? Egal, ob du ein neues Projekt
                vor Publikum ausprobieren oder die Freude am Auftritt teilen möchtest – wir freuen uns
                auf dich! Unser Programm ist vielfältig: <strong className="text-primary-foreground">Theater, Musik,
                Lesungen, Buchpräsentationen oder Comedy</strong>.
              </p>
            </div>
            <div className="md:col-span-2 flex md:justify-end">
              <a
                href="mailto:office@vibria.art?subject=Künstleranfrage"
                className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-heading text-sm uppercase tracking-wider px-7 py-3 rounded-sm hover:bg-primary-foreground/90 transition-colors"
              >
                <Mail size={14} />
                Anfrage senden
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
