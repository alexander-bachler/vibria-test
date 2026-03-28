import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import ImageGallery from "@/components/ImageGallery";
import type { GalleryImage } from "@/lib/api";
import { AlertTriangle, MapPin, Train } from "lucide-react";

export default function Raeumlichkeiten() {
  const { data: images = [], isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["gallery", "raeumlichkeiten"],
    queryFn: () => api.get("/api/gallery?category=raeumlichkeiten"),
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
            Das Souterrain
          </span>
          <h1 className="text-3xl md:text-5xl uppercase text-foreground leading-[0.95]">
            Die Räumlichkeiten
          </h1>
        </motion.div>
      </div>

      {/* Lead text – full width */}
      <div className="container mx-auto px-4 md:px-6 pb-10 md:pb-14">
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-body text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl"
        >
          Die Räumlichkeiten des <strong className="text-foreground">VIBRIA | Kunst- und Kulturvereins</strong>{" "}
          befinden sich im kulturell vielschichtigen <strong className="text-foreground">15. Wiener Gemeindebezirk</strong>,
          genauer gesagt in Rudolfsheim in der Reichsapfelgasse 1, im Souterrain eines Mehrparteienhauses.
        </motion.p>
      </div>

      {/* Details + Info Cards */}
      <div className="bg-card border-y border-border">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
          <div className="grid md:grid-cols-5 gap-10 md:gap-14">
            {/* Left: Details – takes 3 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="md:col-span-3 space-y-6"
            >
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-heading text-xs uppercase tracking-wider text-primary">Geschichte</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    Wir haben das Lokal im <strong className="text-foreground">Jänner 2024</strong> entdeckt und es
                    nach kurzer Renovierung im <strong className="text-foreground">April 2024</strong> eröffnet.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-heading text-xs uppercase tracking-wider text-primary">Kapazität</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    Es finden ca. <strong className="text-foreground">40 Personen</strong> Platz, um unseren
                    Veranstaltungen beizuwohnen.
                  </p>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <h3 className="font-heading text-xs uppercase tracking-wider text-primary">Atmosphäre</h3>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    Im Sommer angenehm kühl und im Winter lauschig warm durch unseren
                    Pelletsofen – begleitet vom hauseigenen Piano. Für unsere Künstler gibt es eine kleine
                    Künstlergarderobe sowie eine kleine Küche.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Right: Info Cards – takes 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="md:col-span-2 space-y-4"
            >
              <div className="flex gap-3 bg-background border border-border rounded-sm p-4">
                <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-heading text-sm uppercase text-foreground mb-1">Adresse</h3>
                  <p className="font-body text-sm text-muted-foreground">
                    Reichsapfelgasse 1/30<br />
                    1150 Wien<br />
                    <span className="text-xs">(blaue Türe rechts vom Haustor)</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-background border border-border rounded-sm p-4">
                <Train size={18} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-heading text-sm uppercase text-foreground mb-1">Öffentliche Verkehrsmittel</h3>
                  <ul className="font-body text-sm text-muted-foreground space-y-0.5">
                    <li>U4 Meidling Hauptstraße</li>
                    <li>U4 Schönbrunn</li>
                    <li>57A Hollergasse</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 bg-destructive/5 border border-destructive/20 rounded-sm p-4">
                <AlertTriangle size={18} className="text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-heading text-sm uppercase text-destructive mb-1">Nicht barrierefrei</h3>
                  <p className="font-body text-sm text-muted-foreground">
                    Der Zugang erfolgt über eine Stiege. Wir bitten um Verständnis.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        <h2 className="text-2xl uppercase text-foreground mb-6">Eindrücke</h2>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-sm animate-pulse" />
            ))}
          </div>
        ) : (
          <ImageGallery images={images} />
        )}
      </div>
    </div>
  );
}
