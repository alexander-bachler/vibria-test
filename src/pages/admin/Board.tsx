import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import ImageUpload from "@/components/ImageUpload";
import type { BoardMember } from "@/lib/api";

type BoardForm = Omit<BoardMember, "id">;
const EMPTY: BoardForm = { name: "", nickname: null, bio: "", image_path: null, sort_order: 0 };

function BoardModal({ member, onClose, onSave }: { member: Partial<BoardMember> | null; onClose: () => void; onSave: (d: BoardForm) => void }) {
  const [form, setForm] = useState<BoardForm>({ ...EMPTY, ...(member ?? {}) });
  const set = (k: keyof BoardForm, v: BoardForm[keyof BoardForm]) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-card rounded-sm shadow-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-heading text-lg uppercase">{member?.id ? "Vorstandsmitglied bearbeiten" : "Neues Mitglied"}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="p-6 space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="field" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div>
            <label className="label">Spitzname / Rolle</label>
            <input className="field" value={form.nickname ?? ""} onChange={(e) => set("nickname", e.target.value || null)} placeholder="z.B. Die lyrische Sopranistin" />
          </div>
          <div>
            <label className="label">Bio *</label>
            <textarea className="field resize-none" rows={5} required value={form.bio} onChange={(e) => set("bio", e.target.value)} />
          </div>
          <div>
            <label className="label">Reihenfolge</label>
            <input type="number" className="field" value={form.sort_order} onChange={(e) => set("sort_order", parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Foto</label>
            <ImageUpload folder="board" value={form.image_path} onChange={(p) => set("image_path", p)} />
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

export default function AdminBoard() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<BoardMember> | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { data: board = [], isLoading } = useQuery<BoardMember[]>({
    queryKey: ["board"],
    queryFn: () => api.get("/api/board"),
  });

  const createMut = useMutation({ mutationFn: (d: BoardForm) => api.post("/api/admin/board", d), onSuccess: () => { qc.invalidateQueries({ queryKey: ["board"] }); setShowModal(false); } });
  const updateMut = useMutation({ mutationFn: ({ id, data }: { id: number; data: BoardForm }) => api.put(`/api/admin/board/${id}`, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ["board"] }); setShowModal(false); } });
  const deleteMut = useMutation({ mutationFn: (id: number) => api.delete(`/api/admin/board/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ["board"] }) });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl uppercase text-foreground">Vorstand</h1>
        <button className="btn-primary flex items-center gap-2" onClick={() => { setEditing(null); setShowModal(true); }}><Plus size={15} /> Neues Mitglied</button>
      </div>
      {isLoading ? <div className="h-40 bg-muted rounded animate-pulse" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {board.map((m) => (
            <div key={m.id} className="bg-card border border-border rounded-sm overflow-hidden flex flex-col">
              <div className="h-40 bg-muted overflow-hidden">
                <img src={getImageUrl(m.image_path)} alt={m.name} className="w-full h-full object-cover object-top" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                {m.nickname && <p className="text-xs font-body text-primary uppercase tracking-wider mb-1">„{m.nickname}"</p>}
                <h3 className="font-heading text-sm uppercase text-foreground mb-2">{m.name}</h3>
                <p className="font-body text-xs text-muted-foreground line-clamp-3 flex-1">{m.bio}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setEditing(m); setShowModal(true); }} className="flex-1 btn-secondary text-xs py-1 flex items-center justify-center gap-1"><Pencil size={11} /> Bearbeiten</button>
                  <button onClick={() => { if (confirm("Löschen?")) deleteMut.mutate(m.id); }} className="p-1 hover:text-destructive"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && <BoardModal member={editing} onClose={() => setShowModal(false)} onSave={(d) => editing?.id ? updateMut.mutate({ id: editing.id, data: d }) : createMut.mutate(d)} />}
    </div>
  );
}
