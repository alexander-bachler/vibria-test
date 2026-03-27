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
    <div className="container mx-auto px-4 md:px-6 py-10 md:py-16">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl uppercase text-foreground mb-8"
      >
        Die Räumlichkeiten
      </motion.h1>

      {/* Description */}
      <div className="grid md:grid-cols-2 gap-10 mb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-body text-sm text-muted-foreground leading-relaxed space-y-4"
        >
          <p>
            Die Räumlichkeiten des <strong className="text-foreground">VIBRIA | Kunst- und Kulturvereins</strong>{" "}
            befinden sich im kulturell vielschichtigen <strong className="text-foreground">15. Wiener Gemeindebezirk</strong>,
            genauer gesagt in Rudolfsheim in der Reichsapfelgasse 1, im Souterrain eines Mehrparteienhauses.
          </p>
          <p>
            Wir haben das Lokal im <strong className="text-foreground">Jänner 2024</strong> entdeckt und es
            nach kurzer Renovierung im <strong className="text-foreground">April 2024</strong> eröffnet.
          </p>
          <p>
            Es finden ca. <strong className="text-foreground">40 Personen</strong> Platz, um unseren
            Veranstaltungen beizuwohnen. Im Sommer angenehm kühl und im Winter lauschig warm durch unseren
            Pelletsofen – begleitet vom hauseigenen Piano. Für unsere Künstler gibt es eine kleine
            Künstlergarderobe sowie eine kleine Küche.
          </p>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Adresse */}
          <div className="flex gap-3 bg-card border border-border rounded-sm p-4">
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

          {/* ÖPNV */}
          <div className="flex gap-3 bg-card border border-border rounded-sm p-4">
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

          {/* Barrierefreiheit */}
          <div className="flex gap-3 bg-yellow-50 border border-yellow-200 rounded-sm p-4">
            <AlertTriangle size={18} className="text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-heading text-sm uppercase text-yellow-800 mb-1">Nicht barrierefrei</h3>
              <p className="font-body text-sm text-yellow-700">
                Unser Souterrain ist leider nicht barrierefrei erreichbar. Der Zugang erfolgt über eine
                robuste und trittsichere Stiege. Wir bitten um Verständnis.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gallery */}
      <section>
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
      </section>
    </div>
  );
}
