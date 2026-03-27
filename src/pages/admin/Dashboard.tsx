import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, BookOpen, MessageSquare, Users } from "lucide-react";
import { api } from "@/lib/api";
import type { AdminStats } from "@/lib/api";

export default function AdminDashboard() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/api/admin/stats"),
  });

  const cards = [
    { to: "/admin/events", icon: Calendar, label: "Kommende Events", value: stats?.upcoming_events ?? "–", color: "bg-primary/10 text-primary" },
    { to: "/admin/reservations", icon: BookOpen, label: "Reservierungen", value: stats?.total_reservations ?? "–", color: "bg-accent/10 text-accent" },
    { to: "/admin/messages", icon: MessageSquare, label: "Neue Nachrichten", value: stats?.unread_messages ?? "–", color: "bg-destructive/10 text-destructive" },
  ];

  const quickLinks = [
    { to: "/admin/events", label: "Veranstaltungen verwalten" },
    { to: "/admin/artists", label: "Künstler verwalten" },
    { to: "/admin/board", label: "Vorstand verwalten" },
    { to: "/admin/gallery", label: "Galerie verwalten" },
    { to: "/admin/reservations", label: "Reservierungen" },
    { to: "/admin/messages", label: "Kontakt-Nachrichten" },
  ];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl uppercase text-foreground mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {cards.map(({ to, icon: Icon, label, value, color }) => (
          <Link key={to} to={to} className="bg-card border border-border rounded-sm p-6 flex gap-4 items-center hover:shadow-md transition-shadow">
            <div className={`${color} rounded-full p-3`}>
              <Icon size={20} />
            </div>
            <div>
              <div className="text-3xl font-heading font-bold text-foreground">{value}</div>
              <div className="text-xs font-body text-muted-foreground uppercase tracking-wide">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick nav */}
      <div className="bg-card border border-border rounded-sm p-6">
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-heading mb-4">Schnellzugriff</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {quickLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center gap-2 px-4 py-2.5 rounded border border-border hover:border-primary/40 hover:bg-primary/5 font-body text-sm text-foreground transition-colors"
            >
              → {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
