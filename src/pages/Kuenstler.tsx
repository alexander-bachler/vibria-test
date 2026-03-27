import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import type { Artist } from "@/lib/api";

export default function Kuenstler() {
  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["artists"],
    queryFn: () => api.get("/api/artists"),
  });

  const sorted = [...artists].sort((a, b) => a.name.localeCompare(b.name, "de"));

  return (
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-16">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl uppercase text-foreground mb-4"
      >
        Künstler im Portrait
      </motion.h1>
      <p className="font-body text-muted-foreground text-sm mb-10 max-w-2xl">
        Alle Künstlerinnen und Künstler, die bisher bei uns aufgetreten sind – eine lebendige Gemeinschaft
        aus Theater, Musik, Tanz, Literatur und darstellender Kunst.
      </p>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-sm animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sorted.map((artist, i) => (
            <motion.div
              key={artist.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              className="bg-card border border-border rounded-sm overflow-hidden"
            >
              {artist.image_path ? (
                <div className="aspect-square bg-muted overflow-hidden">
                  <img
                    src={getImageUrl(artist.image_path)}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-primary/5 flex items-center justify-center">
                  <span className="text-3xl font-heading text-primary/30 uppercase">
                    {artist.name[0]}
                  </span>
                </div>
              )}
              <div className="p-3">
                <h3 className="font-heading text-sm uppercase text-foreground leading-tight">
                  {artist.name}
                </h3>
                {artist.description && (
                  <p className="font-body text-xs text-muted-foreground mt-1 line-clamp-3">
                    {artist.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
