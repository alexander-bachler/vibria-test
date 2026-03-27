import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Reservation } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminReservations() {
  const qc = useQueryClient();
  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["admin-reservations"],
    queryFn: () => api.get("/api/admin/reservations"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/api/admin/reservations/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-reservations"] }),
  });

  return (
    <div>
      <h1 className="text-2xl uppercase text-foreground mb-6">Reservierungen</h1>
      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border border-border rounded-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm font-body min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Veranstaltung", "Name", "E-Mail", "Plätze", "Status", "Eingegangen", "Aktion"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground text-sm">{r.event_title ?? `#${r.event_id}`}</div>
                    {r.event_date && <div className="text-xs text-muted-foreground">{new Date(r.event_date).toLocaleDateString("de-AT")}</div>}
                  </td>
                  <td className="px-4 py-3 text-foreground">{r.name}</td>
                  <td className="px-4 py-3 text-muted-foreground"><a href={`mailto:${r.email}`} className="hover:text-primary">{r.email}</a></td>
                  <td className="px-4 py-3 text-center font-bold">{r.seats}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString("de-AT")}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => updateMut.mutate({ id: r.id, status: e.target.value })}
                      className="field text-xs py-1"
                    >
                      <option value="pending">pending</option>
                      <option value="confirmed">confirmed</option>
                      <option value="cancelled">cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
