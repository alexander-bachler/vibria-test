import { useState } from "react";
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

  const NEWSLETTER_EMBED = `<iframe data-w-type="embedded" frameborder="0" scrolling="no" marginheight="0" marginwidth="0" src="https://sq5z8.mjt.lu/wgt/sq5z8/xy7v/form?c=300eedbb" width="100%" style="height: 0;"></iframe>`;

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-16 space-y-16">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl uppercase text-foreground mb-0"
      >
        Kontakt
      </motion.h1>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Contact Form */}
        <section>
          <h2 className="text-xl uppercase text-foreground mb-5">Schreib uns</h2>
          {status === "success" ? (
            <div className="bg-green-50 border border-green-200 rounded-sm p-6 text-center">
              <div className="text-3xl mb-2">✓</div>
              <h3 className="font-heading text-lg uppercase text-green-800 mb-1">Nachricht gesendet!</h3>
              <p className="font-body text-sm text-green-700">
                Vielen Dank! Wir melden uns so bald wie möglich.
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-4 text-sm font-body text-green-700 underline"
              >
                Neue Nachricht
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot */}
              <input type="text" name="website" value={form.website} onChange={handleChange} className="hidden" tabIndex={-1} autoComplete="off" />

              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={handleChange}
                  className="w-full bg-card border border-input rounded px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
                  E-Mail *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  maxLength={255}
                  value={form.email}
                  onChange={handleChange}
                  className="w-full bg-card border border-input rounded px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
                  Betreff
                </label>
                <input
                  type="text"
                  name="subject"
                  maxLength={200}
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full bg-card border border-input rounded px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">
                  Nachricht *
                </label>
                <textarea
                  name="message"
                  required
                  maxLength={2000}
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full bg-card border border-input rounded px-3 py-2.5 font-body text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {status === "error" && (
                <p className="text-destructive font-body text-sm">{errorMsg}</p>
              )}
              <button
                type="submit"
                disabled={status === "sending"}
                className="w-full bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider py-3 rounded-sm hover:bg-accent transition-colors disabled:opacity-50"
              >
                {status === "sending" ? "Wird gesendet…" : "Nachricht senden"}
              </button>
            </form>
          )}
        </section>

        {/* Address + Map */}
        <section>
          <h2 className="text-xl uppercase text-foreground mb-5">Adresse & Anfahrt</h2>
          <div className="flex gap-3 mb-5">
            <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <div className="font-body text-sm text-muted-foreground">
              <p className="text-foreground font-medium mb-1">VIBRIA | Kunst- und Kulturverein</p>
              <p>Reichsapfelgasse 1/30<br />1150 Wien, Österreich</p>
              <p className="text-xs mt-1">Blaue Türe rechts vom Haustor</p>
              <div className="flex gap-3 mt-3">
                <a href="https://maps.app.goo.gl/YokJDNCi8jyqvwfr5" target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:text-accent text-xs underline transition-colors">
                  Google Maps
                </a>
                <a href="https://www.openstreetmap.org/#map=19/48.186588/16.324632" target="_blank" rel="noopener noreferrer"
                  className="text-primary hover:text-accent text-xs underline transition-colors">
                  OpenStreetMap
                </a>
              </div>
            </div>
          </div>

          <div className="rounded-sm overflow-hidden border border-border mb-6" style={{ height: 260 }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d665.7!2d16.3237!3d48.18659!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x476d07cdc1e90ea5%3A0x0!2sReichsapfelgasse%201%2C%201150%20Wien!5e0!3m2!1sde!2sat!4v1700000000000"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Standort VIBRIA"
            />
          </div>

          <div className="flex gap-3">
            <Mail size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <a href="mailto:office@vibria.art" className="font-body text-sm text-foreground hover:text-primary transition-colors">
              office@vibria.art
            </a>
          </div>
        </section>
      </div>

      {/* Künstleranfrage */}
      <section className="bg-primary rounded-sm p-8 md:p-12">
        <div className="flex gap-4 items-start max-w-2xl">
          <Mic size={28} className="text-primary-foreground/60 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl md:text-2xl uppercase text-primary-foreground mb-3">
              Dein Platz auf der Bühne wartet!
            </h2>
            <p className="font-body text-sm text-primary-foreground/80 leading-relaxed mb-4">
              Du brennst darauf, als Künstler:in bei VIBRIA aufzutreten? Egal, ob du ein neues Projekt
              vor Publikum ausprobieren oder die Freude am Auftritt teilen möchtest – wir freuen uns
              auf dich! Unser Programm ist vielfältig: <strong className="text-primary-foreground">Theater, Musik,
              Lesungen, Buchpräsentationen oder Comedy</strong>.
            </p>
            <a
              href="mailto:office@vibria.art?subject=Künstleranfrage"
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-heading text-sm uppercase tracking-wider px-6 py-2.5 rounded-sm hover:bg-primary-foreground/90 transition-colors"
            >
              <Mail size={14} />
              Anfrage senden
            </a>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section>
        <h2 className="text-xl uppercase text-foreground mb-4">Newsletter</h2>
        <p className="font-body text-sm text-muted-foreground mb-6 max-w-lg">
          Bleib auf dem Laufenden! Melde dich für unseren Newsletter an und erfahre als Erste:r von
          neuen Veranstaltungen.
        </p>
        <div
          className="max-w-lg"
          dangerouslySetInnerHTML={{ __html: NEWSLETTER_EMBED }}
        />
        <script src="https://app.mailjet.com/pas-nc-pop-in-v1.js" type="text/javascript" />
      </section>
    </div>
  );
}
