import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<{ token: string }>("/api/auth/login", { email, password });
      localStorage.setItem("vibria_admin_token", res.token);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/images/logos/vibria_logo_white.svg" alt="VIBRIA" className="h-10 mx-auto mb-3 opacity-90" />
          <p className="text-primary-foreground/50 font-body text-xs uppercase tracking-widest">Admin</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-card rounded-sm shadow-lg p-8 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-input rounded px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground font-body mb-1">Passwort</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-input rounded px-3 py-2.5 font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {error && <p className="text-destructive font-body text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-heading text-sm uppercase tracking-wider py-3 rounded-sm hover:bg-accent transition-colors disabled:opacity-50"
          >
            {loading ? "Anmelden…" : "Anmelden"}
          </button>
        </form>
        <p className="text-center mt-4 text-primary-foreground/40 font-body text-xs">
          <a href="/" className="hover:text-primary-foreground/70 transition-colors">← Zurück zur Website</a>
        </p>
      </div>
    </div>
  );
}
