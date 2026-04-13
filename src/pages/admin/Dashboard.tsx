import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, BookOpen, MessageSquare, AlertTriangle, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import type { AdminStats, Reservation } from "@/lib/api";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminDashboard() {
  const qc = useQueryClient();
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: () => api.get("/api/admin/stats"),
  });

  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<Reservation[]>({
    queryKey: ["admin-reservations"],
    queryFn: () => api.get("/api/admin/reservations"),
  });

  const recentReservations = useMemo(() => reservations.slice(0, 15), [reservations]);

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/admin/reservations/${id}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/reservations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-reservations"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const failed = stats ? (stats.failed_emails_24h ?? 0) : null;
  const cards = [
    { to: "/admin/events", icon: Calendar, label: "Kommende Events", value: stats?.upcoming_events ?? "–", color: "bg-primary/10 text-primary" },
    { to: "/admin/events?tab=reservations", icon: BookOpen, label: "Neue Reservierungen", value: stats?.pending_reservations ?? "–", color: "bg-accent/10 text-accent" },
    { to: "/admin/communication", icon: MessageSquare, label: "Neue Nachrichten", value: stats?.unread_messages ?? "–", color: "bg-destructive/10 text-destructive" },
    {
      to: "/admin/communication?tab=email",
      icon: AlertTriangle,
      label: "E-Mail-Fehler (24h)",
      value: failed === null ? "–" : failed,
      color: failed !== null && failed > 0 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground",
    },
  ];

  const quickLinks = [
    { to: "/admin/events", label: "Veranstaltungen verwalten" },
    { to: "/admin/artists", label: "Künstler verwalten" },
    { to: "/admin/board", label: "Vorstand verwalten" },
    { to: "/admin/gallery", label: "Galerie verwalten" },
    { to: "/admin/events?tab=reservations", label: "Alle Reservierungen" },
    { to: "/admin/communication", label: "Kommunikation & E-Mail-Log" },
  ];

  return (
    <div>
      <h1 className="text-2xl md:text-3xl uppercase text-foreground mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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

      {/* Recent reservations */}
      <div className="bg-card border border-border rounded-sm p-6 mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-heading">Neueste Reservierungen</h2>
          <Link to="/admin/events?tab=reservations" className="text-xs font-body text-primary hover:underline">
            Alle anzeigen
          </Link>
        </div>
        {reservationsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-muted rounded animate-pulse" />)}
          </div>
        ) : recentReservations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Reservierungen.</p>
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-sm font-body min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-heading">Veranstaltung</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-heading">Datum</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-heading">Name</th>
                  <th className="text-center px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-heading">Plätze</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-heading">Status</th>
                  <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-heading">Reserviert am</th>
                  <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-heading">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-border ${r.status === "pending" ? "bg-yellow-50/50" : ""}`}
                  >
                    <td className="px-3 py-2">
                      <Link
                        to={`/admin/events/${r.event_id}/guests`}
                        className="font-medium text-foreground hover:text-primary text-sm"
                      >
                        {r.event_title ?? `#${r.event_id}`}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
                      {r.reservation_date
                        ? new Date(r.reservation_date + "T00:00:00").toLocaleDateString("de-AT")
                        : r.event_date
                          ? new Date(r.event_date + "T00:00:00").toLocaleDateString("de-AT")
                          : "–"}
                    </td>
                    <td className="px-3 py-2 text-foreground">{r.name}</td>
                    <td className="px-3 py-2 text-center font-bold">{r.seats}</td>
                    <td className="px-3 py-2">
                      <select
                        value={r.status}
                        onChange={(e) =>
                          updateStatusMut.mutate({ id: r.id, status: e.target.value })
                        }
                        disabled={updateStatusMut.isPending || deleteMut.isPending}
                        className={`text-xs font-medium rounded px-2 py-1 border border-border cursor-pointer max-w-[9rem] ${STATUS_BADGE[r.status] ?? "bg-muted text-muted-foreground"}`}
                      >
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="cancelled">cancelled</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Diese Reservierung dauerhaft löschen?")) deleteMut.mutate(r.id);
                        }}
                        disabled={deleteMut.isPending || updateStatusMut.isPending}
                        className="inline-flex items-center justify-center p-1.5 rounded text-destructive hover:bg-destructive/10 disabled:opacity-50"
                        title="Löschen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
