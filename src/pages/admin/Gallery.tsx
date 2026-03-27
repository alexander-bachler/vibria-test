import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import ImageUpload from "@/components/ImageUpload";
import type { GalleryImage } from "@/lib/api";

export default function AdminGallery() {
  const qc = useQueryClient();
  const [category, setCategory] = useState("raeumlichkeiten");
  const [uploadPath, setUploadPath] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: images = [], isLoading } = useQuery<GalleryImage[]>({
    queryKey: ["gallery", category],
    queryFn: () => api.get(`/api/gallery?category=${category}`),
  });

  const addMut = useMutation({
    mutationFn: (data: Omit<GalleryImage, "id">) => api.post("/api/admin/gallery", data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["gallery"] }); setAdding(false); setUploadPath(null); setUploadTitle(""); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => api.delete(`/api/admin/gallery/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery"] }),
  });

  const categories = [
    { value: "raeumlichkeiten", label: "Räumlichkeiten" },
    { value: "story", label: "Geschichte" },
    { value: "home", label: "Startseite" },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl uppercase text-foreground">Galerie</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-muted rounded p-1">
            {categories.map((c) => (
              <button key={c.value} onClick={() => setCategory(c.value)}
                className={`px-3 py-1 text-xs font-body rounded transition-colors ${category === c.value ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {c.label}
              </button>
            ))}
          </div>
          <button className="btn-primary flex items-center gap-2 text-xs" onClick={() => setAdding(true)}>
            <Plus size={13} /> Bild hinzufügen
          </button>
        </div>
      </div>

      {adding && (
        <div className="bg-card border border-border rounded-sm p-5 mb-6 space-y-4">
          <h3 className="font-heading text-sm uppercase text-foreground">Neues Bild hochladen</h3>
          <ImageUpload folder={`gallery`} value={uploadPath} onChange={setUploadPath} />
          <div>
            <label className="label">Titel (optional)</label>
            <input className="field" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
          </div>
          <div className="flex gap-3 justify-end">
            <button className="btn-secondary" onClick={() => { setAdding(false); setUploadPath(null); }}>Abbrechen</button>
            <button className="btn-primary" disabled={!uploadPath} onClick={() => {
              if (uploadPath) addMut.mutate({ title: uploadTitle || null, description: null, image_path: uploadPath, category, sort_order: images.length + 1 });
            }}>Hinzufügen</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-square bg-muted rounded animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {images.map((img) => (
            <div key={img.id} className="relative group aspect-square bg-muted rounded overflow-hidden">
              <img src={getImageUrl(img.image_path)} alt={img.title ?? ""} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => { if (confirm("Bild löschen?")) deleteMut.mutate(img.id); }} className="bg-destructive text-white rounded-full p-2"><Trash2 size={14} /></button>
              </div>
              {img.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs font-body px-2 py-1 truncate">{img.title}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
