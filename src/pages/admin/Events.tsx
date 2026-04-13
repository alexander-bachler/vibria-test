import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Eye, EyeOff, ClipboardList, Calendar, BookOpen, Search } from "lucide-react";
import { api } from "@/lib/api";
import ImageUpload from "@/components/ImageUpload";
import type { VEvent, Reservation } from "@/lib/api";

type EventForm = Omit<VEvent, "id" | "created_at" | "reserved_seats">;

const EMPTY: EventForm = {
  title: "", subtitle: null, date: "", end_date: null, time: "19:30",
  type: "", description: null, admission: "Freiwillige Spenden",
  total_seats: 40, image_path: null, is_published: 1,
};

function EventModal({ event, onClose, onSave }: {
  event: Partial<VEvent> | null;
  onClose: () => void;
  onSave: (data: EventForm) => void;
}) {
  const [form, setForm] = useState<EventForm>({
    ...EMPTY,
    ...(event ?? {}),
  });

  const setField = (k: keyof EventForm, v: EventForm[keyof EventForm]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-card rounded-sm shadow-2xl w-full max-w-2xl my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-heading text-lg uppercase text-foreground">
            {event?.id ? "Veranstaltung bearbeiten" : "Neue Veranstaltung"}
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Titel *</label>
              <input className="field" required value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Untertitel</label>
              <input className="field" value={form.subtitle ?? ""} onChange={(e) => setField("subtitle", e.target.value || null)} />
            </div>
            <div>
              <label className="label">Datum *</label>
              <input type="date" className="field" required value={form.date} onChange={(e) => setField("date", e.target.value)} />
            </div>
            <div>
              <label className="label">Enddatum</label>
              <input type="date" className="field" value={form.end_date ?? ""} onChange={(e) => setField("end_date", e.target.value || null)} />
            </div>
            <div>
              <label className="label">Zeit *</label>
              <input type="time" className="field" required value={form.time} onChange={(e) => setField("time", e.target.value)} />
            </div>
            <div>
              <label className="label">Typ</label>
              <input className="field" value={form.type ?? ""} onChange={(e) => setField("type", e.target.value || null)} placeholder="Konzert, Theater, Lesung…" />
            </div>
            <div>
              <label className="label">Eintritt</label>
              <input className="field" value={form.admission} onChange={(e) => setField("admission", e.target.value)} />
            </div>
            <div>
              <label className="label">Plätze gesamt</label>
              <input type="number" className="field" min={1} max={200} value={form.total_seats} onChange={(e) => setField("total_seats", parseInt(e.target.value))} />
            </div>
            <div className="col-span-2">
              <label className="label">Beschreibung</label>
              <textarea className="field resize-none" rows={4} value={form.description ?? ""} onChange={(e) => setField("description", e.target.value || null)} />
            </div>
          </div>

          <div>
            <label className="label">Bild</label>
            <ImageUpload folder="events" value={form.image_path} onChange={(p) => setField("image_path", p)} />
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="published" className="rounded" checked={form.is_published === 1} onChange={(e) => setField("is_published", e.target.checked ? 1 : 0)} />
            <label htmlFor="published" className="font-body text-sm text-muted-foreground">Veröffentlicht</label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Abbrechen</button>
            <button type="submit" className="btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function AllReservationsTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["admin-reservations"],
    queryFn: () => api.get("/api/admin/reservations"),
  });

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

  const filtered = (() => {
    let list = reservations;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.phone && r.phone.toLowerCase().includes(q)) ||
          (r.event_title && r.event_title.toLowerCase().includes(q))
      );
    }
    const pending = list.filter((r) => r.status === "pending");
    const rest = list.filter((r) => r.status !== "pending");
    return [...pending, ...rest];
  })();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded animate-pulse" />)}
      </div>
    );
  }

  return (
    <div>
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Name, E-Mail, Telefon oder Veranstaltung suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field pl-9 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-sm p-8 text-center">
          <BookOpen size={32} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-muted-foreground text-sm">
            {reservations.length === 0
              ? "Keine Reservierungen vorhanden."
              : "Keine Ergebnisse für die aktuelle Suche."}
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-sm font-body min-w-[820px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {["Veranstaltung", "Datum", "Name", "Plätze", "Status", "Reserviert am", "Aktionen"].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading whitespace-nowrap ${
                      h === "Plätze" ? "text-center" : h === "Aktionen" ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
            <tr
              key={r.id}
              className={`border-b border-border hover:bg-muted/30 transition-colors ${
                r.status === "pending" ? "bg-yellow-50/50" : ""
              }`}
            >
              <td className="px-4 py-3">
                <Link
                  to={`/admin/events/${r.event_id}/guests`}
                  className="font-medium text-foreground text-sm hover:text-primary"
                >
                  {r.event_title ?? `#${r.event_id}`}
                </Link>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">
                {r.reservation_date
                  ? new Date(r.reservation_date + "T00:00:00").toLocaleDateString("de-AT")
                  : r.event_date
                    ? new Date(r.event_date + "T00:00:00").toLocaleDateString("de-AT")
                    : "–"}
              </td>
              <td className="px-4 py-3 text-foreground">{r.name}</td>
              <td className="px-4 py-3 text-center font-bold">{r.seats}</td>
              <td className="px-4 py-3">
                <select
                  value={r.status}
                  onChange={(e) =>
                    updateStatusMut.mutate({ id: r.id, status: e.target.value })
                  }
                  disabled={updateStatusMut.isPending || deleteMut.isPending}
                  className={`text-xs font-medium rounded px-2 py-1 border border-border cursor-pointer max-w-[9rem] ${STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}
                >
                  <option value="pending">pending</option>
                  <option value="confirmed">confirmed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                {new Date(r.created_at).toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap">
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
  );
}

export default function AdminEvents() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "reservations" ? "reservations" : "events";
  const [editing, setEditing] = useState<Partial<VEvent> | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [eventSearch, setEventSearch] = useState("");

  const { data: events = [], isLoading } = useQuery<VEvent[]>({
    queryKey: ["admin-events"],
    queryFn: () => api.get("/api/admin/events"),
  });

  const createMut = useMutation({
    mutationFn: (data: EventForm) => api.post("/api/admin/events", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); setShowModal(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: EventForm }) => api.put(`/api/admin/events/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-events"] }); setShowModal(false); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/events/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  const handleSave = (data: EventForm) => {
    if (editing?.id) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const switchTab = (tab: "events" | "reservations") => {
    if (tab === "events") {
      searchParams.delete("tab");
    } else {
      searchParams.set("tab", "reservations");
    }
    setSearchParams(searchParams);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl uppercase text-foreground">Veranstaltungen</h1>
        {activeTab === "events" && (
          <button className="btn-primary flex items-center justify-center gap-2 shrink-0 w-full sm:w-auto" onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus size={15} /> Neue Veranstaltung
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-border">
        <button
          onClick={() => switchTab("events")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-heading uppercase tracking-wider border-b-2 transition-colors -mb-px ${
            activeTab === "events"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar size={14} />
          Veranstaltungen
        </button>
        <button
          onClick={() => switchTab("reservations")}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-heading uppercase tracking-wider border-b-2 transition-colors -mb-px ${
            activeTab === "reservations"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen size={14} />
          Alle Reservierungen
        </button>
      </div>

      {activeTab === "reservations" ? (
        <AllReservationsTab />
      ) : (
        <>
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Titel, Typ oder Datum suchen…"
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className="field pl-9 text-sm"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>
          ) : (() => {
            const q = eventSearch.toLowerCase().trim();
            const filteredEvents = q
              ? events.filter(
                  (evt) =>
                    evt.title.toLowerCase().includes(q) ||
                    (evt.subtitle && evt.subtitle.toLowerCase().includes(q)) ||
                    (evt.type && evt.type.toLowerCase().includes(q)) ||
                    evt.date.includes(q) ||
                    new Date(evt.date + "T00:00:00").toLocaleDateString("de-AT").includes(q)
                )
              : events;

            if (filteredEvents.length === 0) {
              return (
                <div className="bg-card border border-border rounded-sm p-8 text-center">
                  <Calendar size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground text-sm">
                    {events.length === 0
                      ? "Keine Veranstaltungen vorhanden."
                      : "Keine Ergebnisse für die aktuelle Suche."}
                  </p>
                </div>
              );
            }

            return (
              <div className="bg-card border border-border rounded-sm overflow-hidden">
                <table className="w-full text-sm font-body">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading">Titel</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading hidden md:table-cell">Datum</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading hidden lg:table-cell">Typ</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading">Plätze</th>
                      <th className="w-24 px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEvents.map((evt) => (
                      <tr key={evt.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/admin/events/${evt.id}/guests`)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {evt.is_published ? <Eye size={12} className="text-primary flex-shrink-0" /> : <EyeOff size={12} className="text-muted-foreground flex-shrink-0" />}
                            <div>
                              <div className="font-medium text-foreground text-sm">{evt.title}</div>
                              {evt.subtitle && <div className="text-xs text-muted-foreground">{evt.subtitle}</div>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {evt.end_date && evt.end_date > evt.date
                            ? `${new Date(evt.date + "T00:00:00").toLocaleDateString("de-AT")} – ${new Date(evt.end_date + "T00:00:00").toLocaleDateString("de-AT")}`
                            : new Date(evt.date + "T00:00:00").toLocaleDateString("de-AT")
                          } · {evt.time}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{evt.type ?? "–"}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs">
                            {evt.end_date && evt.end_date > evt.date
                              ? `${evt.reserved_seats ?? 0} gesamt`
                              : `${evt.reserved_seats ?? 0}/${evt.total_seats}`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => navigate(`/admin/events/${evt.id}/guests`)} className="p-1 hover:text-primary transition-colors" title="Gästeliste"><ClipboardList size={14} /></button>
                            <button onClick={() => { setEditing(evt); setShowModal(true); }} className="p-1 hover:text-primary transition-colors" title="Bearbeiten"><Pencil size={14} /></button>
                            <button onClick={() => { if (confirm("Löschen?")) deleteMut.mutate(evt.id); }} className="p-1 hover:text-destructive transition-colors" title="Löschen"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </>
      )}

      {showModal && (
        <EventModal
          event={editing}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
