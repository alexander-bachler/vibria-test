import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MailOpen, Mail } from "lucide-react";
import { api } from "@/lib/api";
import type { ContactMessage } from "@/lib/api";

export default function AdminMessages() {
  const qc = useQueryClient();
  const { data: messages = [], isLoading } = useQuery<ContactMessage[]>({
    queryKey: ["admin-messages"],
    queryFn: () => api.get("/api/admin/messages"),
  });

  const markReadMut = useMutation({
    mutationFn: (id: number) => api.patch(`/api/admin/messages/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-messages"] }),
  });

  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl uppercase text-foreground">Nachrichten</h1>
        {unread > 0 && (
          <span className="bg-destructive text-white text-xs font-heading px-2 py-0.5 rounded-full">{unread} neu</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded animate-pulse" />)}</div>
      ) : messages.length === 0 ? (
        <p className="text-muted-foreground font-body">Keine Nachrichten vorhanden.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`bg-card border rounded-sm p-5 ${msg.is_read ? "border-border opacity-60" : "border-primary/30 shadow-sm"}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  {msg.is_read ? <MailOpen size={16} className="text-muted-foreground" /> : <Mail size={16} className="text-primary" />}
                  <div>
                    <span className="font-medium text-foreground text-sm">{msg.name}</span>
                    <span className="text-muted-foreground text-xs ml-2">
                      <a href={`mailto:${msg.email}`} className="hover:text-primary">{msg.email}</a>
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleDateString("de-AT")}</span>
                  {!msg.is_read && (
                    <button onClick={() => markReadMut.mutate(msg.id)} className="text-xs font-body text-primary hover:text-accent underline">Als gelesen markieren</button>
                  )}
                </div>
              </div>
              {msg.subject && <p className="text-sm font-medium text-foreground mb-1">{msg.subject}</p>}
              <p className="font-body text-sm text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
              <div className="mt-3 flex gap-2">
                <a href={`mailto:${msg.email}?subject=Re: ${msg.subject ?? ""}`} className="btn-secondary text-xs py-1 px-3">Antworten</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
