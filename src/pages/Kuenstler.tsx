import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import type { Artist } from "@/lib/api";

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function Kuenstler() {
  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: () => api.get("/api/artists"),
  });

  const sorted = [...artists].sort((a, b) => a.name.localeCompare(b.name, "de"));

  // Group by first letter
  const groups: Record<string, Artist[]> = {};
  for (const artist of sorted) {
    const letter = getInitial(artist.name);
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(artist);
  }
  const letters = Object.keys(groups).sort((a, b) => a.localeCompare(b, "de"));

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-16">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl uppercase text-foreground mb-4"
      >
        Künstler:innen
      </motion.h1>
      <p className="font-body text-muted-foreground text-sm mb-10 max-w-2xl leading-relaxed">
        Alle Künstlerinnen und Künstler, die bisher bei uns aufgetreten sind – eine
        lebendige Gemeinschaft aus Theater, Musik, Tanz, Literatur und darstellender Kunst.
      </p>

      {/* Letter quick-nav */}
      {!isLoading && letters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-10">
          {letters.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="w-8 h-8 flex items-center justify-center bg-card border border-border rounded-sm font-heading text-sm text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              {letter}
            </a>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-10">
          {letters.map((letter) => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-24">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="text-4xl md:text-5xl font-heading text-primary/20 leading-none select-none">
                  {letter}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1">
                {groups[letter].map((artist, i) => (
                  <motion.div
                    key={artist.id}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: Math.min(i * 0.04, 0.3) }}
                    className="group py-2.5 border-b border-border/50 last:border-b-0"
                  >
                    <h3 className="font-heading text-sm uppercase text-foreground tracking-wide group-hover:text-primary transition-colors">
                      {artist.name}
                    </h3>
                    {artist.description && (
                      <p className="font-body text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {artist.description}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Count */}
      {!isLoading && (
        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="font-body text-xs text-muted-foreground uppercase tracking-widest">
            {sorted.length} Künstler:innen im VIBRIA
          </p>
        </div>
      )}
    </div>
  );
}
