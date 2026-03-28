import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import type { Artist } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";

function ArtistVisual({ name, imagePath }: { name: string; imagePath: string | null }) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  if (imagePath) {
    return (
      <img
        src={getImageUrl(imagePath)}
        alt=""
        className="absolute inset-0 w-full h-full object-cover object-top"
        loading="lazy"
      />
    );
  }
  return (
    <span
      className="font-heading text-lg md:text-xl text-primary/45 select-none"
      aria-hidden
    >
      {initial}
    </span>
  );
}

export default function Kuenstler() {
  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: () => api.get("/api/artists"),
  });

  const sorted = [...artists].sort((a, b) => a.name.localeCompare(b.name, "de"));

  return (
    <div>
      {/* Page Header */}
      <div className="container mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-6 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-3 block">
            Unsere Bühne
          </span>
          <h1 className="text-3xl md:text-5xl uppercase text-foreground leading-[0.95]">
            Künstler:innen
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
          Alle Künstlerinnen und Künstler, die bisher bei uns aufgetreten sind – eine
          lebendige Gemeinschaft aus Theater, Musik, Tanz, Literatur und darstellender Kunst.
        </motion.p>
      </div>

      {/* Artist List */}
      <div className="bg-card border-y border-border">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
          {isLoading ? (
            <div className="max-w-2xl space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex gap-4 py-1">
                  <div className="w-[4.5rem] h-[4.5rem] md:w-20 md:h-20 shrink-0 bg-muted rounded-sm animate-pulse" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 w-40 bg-muted rounded-sm animate-pulse" />
                    <div className="h-3 w-full max-w-md bg-muted rounded-sm animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="max-w-2xl list-none p-0 m-0 divide-y divide-border/60">
              {sorted.map((artist, i) => (
                <motion.li
                  key={artist.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.035, 0.35) }}
                  className="flex gap-4 md:gap-5 py-5 first:pt-0"
                >
                  <div
                    className="relative w-[4.5rem] h-[4.5rem] md:w-20 md:h-20 shrink-0 rounded-sm overflow-hidden bg-background border border-border flex items-center justify-center"
                    aria-hidden
                  >
                    <ArtistVisual name={artist.name} imagePath={artist.image_path} />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <h2 className="font-heading text-sm md:text-base uppercase text-foreground tracking-wide leading-snug">
                      {artist.name}
                    </h2>
                    {artist.description && (
                      <p className="font-body text-xs md:text-sm text-muted-foreground mt-1.5 leading-relaxed">
                        {artist.description}
                      </p>
                    )}
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Counter */}
      {!isLoading && (
        <div className="container mx-auto px-4 md:px-6 py-8 text-center">
          <p className="font-body text-xs text-muted-foreground uppercase tracking-widest">
            {sorted.length} Künstler:innen im VIBRIA
          </p>
        </div>
      )}
    </div>
  );
}
