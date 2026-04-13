import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { MailOpen, Mail, Send, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import type { ContactMessage, EmailLogListItem } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const EMAIL_TYPE_LABELS: Record<string, string> = {
  reservation_confirmation: "Reservierung (Gast)",
  reservation_admin: "Reservierung (Admin)",
  contact_admin: "Kontakt (Admin)",
};

function buildEmailLogsQuery(type: string, status: string): string {
  const q = new URLSearchParams();
  if (type) q.set("type", type);
  if (status) q.set("status", status);
  const s = q.toString();
  return s ? `/api/admin/email-logs?${s}` : "/api/admin/email-logs";
}

export default function AdminCommunication() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "email" ? "email" : "contact";

  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [previewId, setPreviewId] = useState<number | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewMeta, setPreviewMeta] = useState<EmailLogListItem | null>(null);
  const [resendOpen, setResendOpen] = useState(false);

  const { data: messages = [], isLoading: loadingMessages } = useQuery<ContactMessage[]>({
    queryKey: ["admin-messages"],
    queryFn: () => api.get("/api/admin/messages"),
  });

  const { data: emailLogs = [], isLoading: loadingLogs } = useQuery<EmailLogListItem[]>({
    queryKey: ["admin-email-logs", typeFilter, statusFilter],
    queryFn: () => api.get(buildEmailLogsQuery(typeFilter, statusFilter)),
  });

  const markReadMut = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/messages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-messages"] }),
  });

  const resendMut = useMutation({
    mutationFn: (id: number) => api.post<{ success: boolean; message?: string }>(`/api/admin/email-logs/${id}/resend`, {}),
    onSuccess: () => {
      toast.success("E-Mail wurde erneut gesendet.");
      qc.invalidateQueries({ queryKey: ["admin-email-logs"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
      setResendOpen(false);
    },
    onError: (e: Error) => toast.error(e.message || "Versand fehlgeschlagen"),
  });

  const unread = messages.filter((m) => !m.is_read).length;

  const setTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "email") next.set("tab", "email");
    else next.delete("tab");
    setSearchParams(next, { replace: true });
  };

  const openPreview = async (row: EmailLogListItem) => {
    setPreviewId(row.id);
    setPreviewMeta(row);
    setPreviewHtml(null);
    try {
      const full = await api.get<EmailLogListItem & { html_body: string | null }>(
        `/api/admin/email-logs/${row.id}`
      );
      setPreviewHtml(full.html_body ?? "");
    } catch {
      toast.error("E-Mail konnte nicht geladen werden.");
      setPreviewId(null);
      setPreviewMeta(null);
    }
  };

  const confirmResend = () => {
    if (previewId != null) resendMut.mutate(previewId);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl uppercase text-foreground">Kommunikation</h1>
        {tab === "contact" && unread > 0 && (
          <span className="bg-destructive text-white text-xs font-heading px-2 py-0.5 rounded-full">
            {unread} neu
          </span>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-4 w-full h-auto min-h-10 flex flex-wrap justify-start gap-1 sm:inline-flex sm:w-auto sm:flex-nowrap">
          <TabsTrigger value="contact" className="flex-1 min-w-[10rem] sm:flex-initial sm:min-w-0">
            Kontaktanfragen
          </TabsTrigger>
          <TabsTrigger value="email" className="flex-1 min-w-[10rem] sm:flex-initial sm:min-w-0">
            E-Mail-Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="mt-0">
          {loadingMessages ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}</div>
          ) : messages.length === 0 ? (
            <p className="text-muted-foreground font-body">Keine Kontaktanfragen vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`bg-card border rounded-sm p-5 ${msg.is_read ? "border-border opacity-60" : "border-primary/30 shadow-sm"}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 mb-3">
                    <div className="flex items-start gap-2 min-w-0">
                      {msg.is_read ? (
                        <MailOpen size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                      ) : (
                        <Mail size={16} className="text-primary shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <span className="font-medium text-foreground text-sm">{msg.name}</span>
                        <span className="text-muted-foreground text-xs ml-2 break-all">
                          <a href={`mailto:${msg.email}`} className="hover:text-primary">
                            {msg.email}
                          </a>
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0 items-stretch sm:items-end text-left sm:text-right w-full sm:w-auto">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(msg.created_at).toLocaleString("de-AT")}
                      </span>
                      {!msg.is_read && (
                        <button
                          type="button"
                          onClick={() => markReadMut.mutate(msg.id)}
                          className="text-xs font-body text-primary hover:text-accent underline text-left sm:text-right"
                        >
                          Als gelesen markieren
                        </button>
                      )}
                    </div>
                  </div>
                  {msg.subject && <p className="text-sm font-medium text-foreground mb-1">{msg.subject}</p>}
                  <p className="font-body text-sm text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
                  <div className="mt-3 flex gap-2">
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${msg.subject ?? ""}`}
                      className="btn-secondary text-xs py-1 px-3"
                    >
                      Antworten
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="email" className="mt-0">
          <div className="flex flex-wrap gap-2 mb-4">
            <select
              className="field text-sm py-1.5 max-w-[200px]"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Typ filtern"
            >
              <option value="">Alle Typen</option>
              <option value="reservation_confirmation">Reservierung (Gast)</option>
              <option value="reservation_admin">Reservierung (Admin)</option>
              <option value="contact_admin">Kontakt (Admin)</option>
            </select>
            <select
              className="field text-sm py-1.5 max-w-[160px]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Status filtern"
            >
              <option value="">Alle Status</option>
              <option value="sent">Gesendet</option>
              <option value="failed">Fehlgeschlagen</option>
            </select>
          </div>

          {loadingLogs ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : emailLogs.length === 0 ? (
            <p className="text-muted-foreground font-body">Keine E-Mail-Einträge.</p>
          ) : (
            <div className="bg-card border border-border rounded-sm overflow-hidden overflow-x-auto">
              <table className="w-full text-sm font-body min-w-[720px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    {["Zeit", "Empfänger", "Betreff", "Typ", "Status"].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground font-heading whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border hover:bg-muted/30 cursor-pointer"
                      onClick={() => void openPreview(row)}
                    >
                      <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(row.created_at).toLocaleString("de-AT")}
                      </td>
                      <td className="px-3 py-2 text-foreground max-w-[180px] truncate">{row.recipient}</td>
                      <td className="px-3 py-2 text-muted-foreground max-w-[240px] truncate">{row.subject}</td>
                      <td className="px-3 py-2">
                        <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
                          {EMAIL_TYPE_LABELS[row.type] ?? row.type}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {row.status === "sent" ? (
                          <span className="text-green-700 bg-green-100 text-xs px-2 py-0.5 rounded">Gesendet</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-destructive bg-destructive/10 text-xs px-2 py-0.5 rounded">
                            <AlertCircle size={12} />
                            Fehlgeschlagen
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={previewId !== null}
        onOpenChange={(o) => {
          if (!o) {
            setPreviewId(null);
            setPreviewHtml(null);
            setPreviewMeta(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="pr-8">E-Mail-Vorschau</DialogTitle>
            {previewMeta && (
              <p className="text-sm text-muted-foreground">
                {previewMeta.recipient} · {previewMeta.subject}
              </p>
            )}
          </DialogHeader>
          <div className="flex-1 min-h-[320px] border rounded-sm overflow-hidden bg-muted/30">
            {previewHtml === null ? (
              <div className="p-8 text-center text-muted-foreground">Laden…</div>
            ) : (
              <iframe
                title="E-Mail-Vorschau"
                className="w-full h-[min(60vh,520px)] bg-white"
                srcDoc={previewHtml}
                sandbox="allow-same-origin"
              />
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPreviewId(null)}>
              Schließen
            </Button>
            <Button
              type="button"
              onClick={() => setResendOpen(true)}
              disabled={!previewMeta || previewHtml === null || previewHtml === ""}
            >
              <Send className="mr-2 h-4 w-4" />
              Erneut senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resendOpen} onOpenChange={setResendOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>E-Mail erneut senden?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Die gespeicherte HTML-Version wird erneut an{" "}
            <strong>{previewMeta?.recipient}</strong> gesendet. Bei Reservierungsbestätigungen mit QR-Code ist ggf. der
            erneute Versand über die Reservierungsliste zuverlässiger (frischer QR-Code).
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResendOpen(false)}>
              Abbrechen
            </Button>
            <Button type="button" onClick={confirmResend} disabled={resendMut.isPending}>
              Senden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
