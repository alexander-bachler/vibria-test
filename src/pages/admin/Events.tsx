import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import ImageUpload from "@/components/ImageUpload";
import type { VEvent } from "@/lib/api";

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
          <div className="grid grid-cols-2 gap-4">
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

export default function AdminEvents() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<VEvent> | null>(null);
  const [showModal, setShowModal] = useState(false);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl uppercase text-foreground">Veranstaltungen</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditing(null); setShowModal(true); }}>
          <Plus size={15} /> Neue Veranstaltung
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>
      ) : (
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
              {events.map((evt) => (
                <tr key={evt.id} className="border-b border-border hover:bg-muted/30 transition-colors">
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
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setEditing(evt); setShowModal(true); }} className="p-1 hover:text-primary transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => { if (confirm("Löschen?")) deleteMut.mutate(evt.id); }} className="p-1 hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
