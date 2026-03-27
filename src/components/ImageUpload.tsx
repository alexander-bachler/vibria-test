import { useRef, useState } from "react";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/imageUrl";
import { Upload, X, Loader2 } from "lucide-react";

interface Props {
  folder: string;
  value: string | null;
  onChange: (path: string | null) => void;
  className?: string;
}

export default function ImageUpload({ folder, value, onChange, className = "" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const result = await api.upload(file, folder);
      onChange(result.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className={className}>
      {value ? (
        <div className="relative rounded overflow-hidden border border-border">
          <img
            src={getImageUrl(value)}
            alt="Vorschau"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 bg-destructive text-white rounded-full p-1 shadow"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded cursor-pointer bg-muted/30 hover:bg-muted/60 transition-colors"
        >
          {uploading ? (
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload size={24} className="text-muted-foreground mb-2" />
              <span className="text-sm font-body text-muted-foreground">
                Bild hier ablegen oder klicken
              </span>
              <span className="text-xs text-muted-foreground/60 mt-1">
                JPG, PNG, WebP · max. 10 MB
              </span>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleChange}
          />
        </label>
      )}
      {error && (
        <p className="text-destructive text-xs font-body mt-1">{error}</p>
      )}
    </div>
  );
}
