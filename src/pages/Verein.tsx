import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import type { BoardMember } from "@/lib/api";

const projects = [
  "Junge Stimmen/Talente am Werk",
  "Theater Gesamt – Theaterstücke für alle Altersgruppen",
  "Fang den Klang – Klang-, Ton- und Stimmexperimente",
  "Reif für Kunst – gut Ding braucht Weile",
  "Theater Infantil – Theaterarbeit mit Kindern",
  "Oper (be)greifbar",
  "Tanz- und Körper",
  "Audiovisueller Spielraum",
];

const vereinsdata = [
  ["Name", "VIBRIA | Kunst- und Kulturverein"],
  ["Sitz", "Wien"],
  ["Land", "Österreich"],
  ["Lokalität", "Reichsapfelgasse 1/30, 1150 Wien"],
  ["Postanschrift", "Jheringgasse 36/26, 1150 Wien"],
  ["Gegründet", "16. Juli 2022"],
  ["c/o", "Thomas Parb, Ester Font Bardolet"],
  ["Zuständigkeit", "Landespolizeidirektion Wien"],
  ["ZVR-Zahl", "1829365501"],
];

export default function Verein() {
  const { data: board = [], isLoading } = useQuery<BoardMember[]>({
    queryKey: ["board"],
    queryFn: () => api.get("/api/board"),
  });

  return (
    <div>
      {/* Page Header */}
      <div className="container mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-6 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-3 block">
            Gemeinnütziger Verein
          </span>
          <h1 className="text-3xl md:text-5xl uppercase text-foreground leading-[0.95]">
            Der Verein
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
          In einer schnelllebigen, leistungsorientierten Welt wird es immer schwieriger, sich als
          Individuum seinen künstlerischen Neigungen hinzugeben – sei es durch das Ausleben der
          eigenen Kreativität oder durch den einfachen Genuss von Kunst und Kultur.
        </motion.p>
      </div>

      {/* Die Idee + Vereinsdaten */}
      <div className="bg-card border-y border-border">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="grid md:grid-cols-5 gap-10 md:gap-14">
            {/* Left: Die Idee – 3 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-3 space-y-6"
            >
              <div className="space-y-2">
                <h3 className="font-heading text-xs uppercase tracking-wider text-primary">Die Idee</h3>
                <p className="font-body text-sm text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">VIBRIA | Kunst- und Kulturverein</strong> will als
                  gemeinnütziger Verein genau an diesen Punkten ansetzen. Jede und jeder soll die
                  Möglichkeit haben, anspruchsvolle, spannende Kunst- und Kulturprogramme zu genießen,
                  mitzugestalten oder sogar zu erforschen – egal welchen Alters, Geschlechts oder welcher
                  Herkunft.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-heading text-xs uppercase tracking-wider text-primary">Unsere Projekte</h3>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
                  {projects.map((p) => (
                    <div key={p} className="flex items-start gap-2 font-body text-sm text-muted-foreground">
                      <span className="text-primary mt-0.5 flex-shrink-0">–</span>
                      {p}
                    </div>
                  ))}
                  <div className="font-body text-sm text-muted-foreground/60 italic pl-4">
                    und vieles mehr …
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right: Vereinsdaten – 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2"
            >
              <h3 className="font-heading text-xs uppercase tracking-wider text-primary mb-4">Vereinsdaten</h3>
              <div className="bg-background border border-border rounded-sm overflow-hidden">
                <table className="w-full text-sm font-body">
                  <tbody>
                    {vereinsdata.map(([label, value], idx) => (
                      <tr key={label} className={idx < vereinsdata.length - 1 ? "border-b border-border" : ""}>
                        <td className="py-2.5 px-4 text-muted-foreground w-28 md:w-32">{label}</td>
                        <td className="py-2.5 px-4 text-foreground">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <a
                  href="https://citizen.bmi.gv.at/at.gv.bmi.zvnsrv-p/zvrlink/1829365501"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-accent font-body text-sm underline underline-offset-4 transition-colors"
                >
                  Vereinsstatuten (PDF) →
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Der Vorstand */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="mb-8">
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-2 block">
            Die Menschen dahinter
          </span>
          <h2 className="text-2xl md:text-3xl uppercase text-foreground">Der Vorstand</h2>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-muted rounded h-80 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {board.map((member, i) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card border border-border rounded-sm overflow-hidden"
              >
                <div className="relative bg-muted" style={{ paddingBottom: "120%" }}>
                  <img
                    src={getImageUrl(member.image_path)}
                    alt={member.name}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  {member.nickname && (
                    <p className="text-xs font-body text-primary uppercase tracking-wider mb-1">
                      „{member.nickname}"
                    </p>
                  )}
                  <h3 className="font-heading text-base uppercase text-foreground leading-tight mb-2">
                    {member.name}
                  </h3>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed line-clamp-6">
                    {member.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Geschichte der VIBRIA */}
      <div className="bg-card border-y border-border">
        <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="mb-8">
            <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-2 block">
              Katalanische Mythologie
            </span>
            <h2 className="text-2xl md:text-3xl uppercase text-foreground">
              Die Geschichte der VIBRIA
            </h2>
          </div>
          <div className="grid md:grid-cols-5 gap-10 md:gap-14 items-center">
            <div className="md:col-span-3 font-body text-sm text-muted-foreground leading-relaxed space-y-4">
              <p>
                Die <strong className="text-foreground">Vibria</strong> ist eine der geheimnisvollsten
                Gestalten der katalanischen Mythologie – eine schlangenartige, oft geflügelte Kreatur,
                die sowohl Furcht als auch Faszination auslöst. Ihr Aussehen reicht von einer riesigen,
                schillernden Schlange bis hin zu einer feuerspeienden Bestie mit drachenhaftem Kopf und
                einem Schnabel, manchmal sogar mit menschlichen Zügen.
              </p>
              <p>
                Als Hüterin verborgener Schätze und uralten Wissens wird sie mit Wasserquellen, Flüssen
                und Höhlen in Verbindung gebracht. Ihre <strong className="text-foreground">Bedeutung</strong>{" "}
                liegt in der Verbindung von Natur, Magie und menschlichem Schicksal.
              </p>
              <p>
                Heute lebt die <strong className="text-foreground">Vibria</strong> vor allem in{" "}
                <strong className="text-foreground">Kunst, Literatur und Brauchtum</strong> weiter. In
                katalanischen Dörfern wird sie bei Festen als Figur durch die Straßen getragen. Künstler
                und Schriftsteller nutzen ihr Bild als Symbol für katalanische Identität und
                Widerstandsfähigkeit.
              </p>
            </div>
            <div className="md:col-span-2 rounded-sm overflow-hidden">
              <img
                src={getImageUrl("story/vibria-drac.jpg")}
                alt="Die Vibria – katalanische Mythologie"
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
