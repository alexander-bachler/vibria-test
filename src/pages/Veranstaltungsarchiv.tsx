import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import type { VEvent } from "@/lib/api";
import { EventCard } from "@/pages/Veranstaltungen";

export default function Veranstaltungsarchiv() {
  const { data: events = [], isLoading } = useQuery<VEvent[]>({
    queryKey: ["events"],
    queryFn: () => api.get("/api/events"),
  });

  const today = new Date().toISOString().slice(0, 10);
  const past = events
    .filter((e) => (e.end_date ?? e.date) < today)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div className="container mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-6 md:pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="font-body text-xs uppercase tracking-[0.3em] text-primary mb-3 block">
            Rückblick
          </span>
          <h1 className="text-3xl md:text-5xl uppercase text-foreground leading-[0.95]">
            Veranstaltungsarchiv
          </h1>
          <p className="text-muted-foreground font-body text-sm mt-3 max-w-lg leading-relaxed">
            Ein Rückblick auf unsere bisherigen Veranstaltungen — mit Fotogalerien
            und Eindrücken aus unserem Souterrain.
          </p>
        </motion.div>
      </div>

      <div className="bg-card border-y border-border">
        <div className="container mx-auto px-4 md:px-6 py-10 md:py-14">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-52 bg-muted rounded-sm animate-pulse" />
              ))}
            </div>
          ) : past.length > 0 ? (
            <div className="space-y-6">
              {past.map((evt) => (
                <EventCard key={evt.id} event={evt} isPast />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground font-body py-4">
              Noch keine vergangenen Veranstaltungen vorhanden.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
