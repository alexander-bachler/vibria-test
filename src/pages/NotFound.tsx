import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-7xl md:text-9xl font-heading text-primary/20 uppercase leading-none mb-4">
          404
        </h1>
        <h2 className="text-2xl uppercase text-foreground mb-3">Seite nicht gefunden</h2>
        <p className="font-body text-muted-foreground mb-6 max-w-sm mx-auto">
          Die gesuchte Seite existiert nicht oder wurde verschoben.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider px-6 py-2.5 rounded-sm hover:bg-accent transition-colors"
        >
          ← Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}
