import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import ImageUpload from "@/components/ImageUpload";
import type { Artist } from "@/lib/api";

type ArtistForm = Omit<Artist, "id">;
const EMPTY: ArtistForm = { name: "", description: null, image_path: null, sort_order: 0 };

function ArtistModal({ artist, onClose, onSave }: { artist: Partial<Artist> | null; onClose: () => void; onSave: (d: ArtistForm) => void }) {
  const [form, setForm] = useState<ArtistForm>({ ...EMPTY, ...(artist ?? {}) });
  const set = (k: keyof ArtistForm, v: ArtistForm[keyof ArtistForm]) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-card rounded-sm shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-heading text-lg uppercase">{artist?.id ? "Künstler bearbeiten" : "Neuer Künstler"}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="field" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="label">Beschreibung</label>
            <textarea className="field resize-none" rows={3} value={form.description ?? ""} onChange={(e) => set("description", e.target.value || null)} />
          </div>
          <div>
            <label className="label">Reihenfolge</label>
            <input type="number" className="field" value={form.sort_order} onChange={(e) => set("sort_order", parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Foto (optional)</label>
            <ImageUpload folder="artists" value={form.image_path} onChange={(p) => set("image_path", p)} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="btn-secondary">Abbrechen</button>
            <button type="submit" className="btn-primary">Speichern</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminArtists() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Artist> | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["admin-artists"],
    queryFn: () => api.get("/api/artists"),
  });

  const createMut = useMutation({ mutationFn: (d: ArtistForm) => api.post("/api/admin/artists", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artists"] }); setShowModal(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: ArtistForm }) => api.put(`/api/admin/artists/${id}`, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-artists"] }); setShowModal(false); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.delete(`/api/admin/artists/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-artists"] }) });

  const handleSave = (data: ArtistForm) => editing?.id ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl uppercase text-foreground">Künstler</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditing(null); setShowModal(true); }}><Plus size={15} /> Neuer Künstler</button>
      </div>
      {isLoading ? <div className="h-40 bg-muted rounded animate-pulse" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...artists].sort((a, b) => a.name.localeCompare(b.name, "de")).map((a) => (
            <div key={a.id} className="bg-card border border-border rounded-sm overflow-hidden">
              <div className="aspect-square bg-muted overflow-hidden">
                <img src={getImageUrl(a.image_path)} alt={a.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h3 className="font-heading text-sm uppercase text-foreground">{a.name}</h3>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => { setEditing(a); setShowModal(true); }} className="flex-1 btn-secondary text-xs py-1 flex items-center justify-center gap-1"><Pencil size={11} /> Bearbeiten</button>
                  <button onClick={() => { if (confirm("Löschen?")) deleteMut.mutate(a.id); }} className="p-1 hover:text-destructive"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <ArtistModal artist={editing} onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  );
}
