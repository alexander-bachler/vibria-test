import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, QrCode } from "lucide-react";
import { api } from "@/lib/api";
import type { Reservation } from "@/lib/api";
import { ReservationDetail } from "./ScanCheckIn";

interface TokenReservation extends Reservation {
  event_title: string;
  event_date: string;
  event_end_date: string | null;
  event_time: string;
  zone_label: string | null;
}

export default function CheckInByToken() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: reservation, isLoading, error } = useQuery<TokenReservation>({
    queryKey: ["reservation-token", token],
    queryFn: () => api.get<TokenReservation>(`/api/admin/reservations/token/${token}`),
    enabled: !!token,
  });

  const checkInMut = useMutation({
    mutationFn: () =>
      api.patch<{ checked_in_at: string | null }>(
        `/api/admin/reservations/token/${token}/checkin`
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reservation-token", token] });
    },
  });

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-4">
        <button
          onClick={() => navigate("/admin/reservations")}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Zurück zu Reservierungen
        </button>
        <h1 className="text-xl font-heading uppercase text-foreground flex items-center gap-2">
          <QrCode size={22} />
          Check-in
        </h1>
      </div>

      {isLoading && (
        <div className="bg-card border border-border rounded-sm p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Reservierung wird geladen...</p>
        </div>
      )}

      {error && (
        <div className="bg-card border border-destructive/50 rounded-sm p-6 text-center">
          <p className="text-sm text-destructive font-medium">
            {error instanceof Error ? error.message : "Reservierung nicht gefunden"}
          </p>
        </div>
      )}

      {reservation && (
        <ReservationDetail
          reservation={reservation}
          onCheckIn={() => checkInMut.mutate()}
          isCheckingIn={checkInMut.isPending}
        />
      )}
    </div>
  );
}
