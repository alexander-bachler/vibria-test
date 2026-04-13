import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Camera, ArrowLeft, UserCheck, UserX, RotateCcw, QrCode,
  CalendarDays, MapPin, Users, Clock, AlertTriangle, CalendarPlus,
} from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { api } from "@/lib/api";
import type { Reservation } from "@/lib/api";

const ZONE_LABELS: Record<string, string> = {
  "vorne-links": "Vorne Links",
  "vorne-mitte": "Vorne Mitte",
  "vorne-rechts": "Vorne Rechts",
  "mitte-links": "Mitte Links",
  "mitte-mitte": "Mitte Mitte",
  "mitte-rechts": "Mitte Rechts",
  "hinten-links": "Hinten Links",
  "hinten-mitte": "Hinten Mitte",
  "hinten-rechts": "Hinten Rechts",
  "rest-plaetze": "Restplätze (Zusatz)",
};

interface TokenReservation extends Reservation {
  event_title: string;
  event_date: string;
  event_end_date: string | null;
  event_time: string;
  zone_label: string | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("de-AT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractToken(scannedText: string): string | null {
  const match = scannedText.match(/\/admin\/checkin\/([a-f0-9]{64})$/i);
  if (match) return match[1];
  if (/^[a-f0-9]{64}$/i.test(scannedText)) return scannedText;
  return null;
}

export default function ScanCheckIn() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"scanning" | "loading" | "result" | "error">("scanning");
  const [reservation, setReservation] = useState<TokenReservation | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-scanner-region";
  const isProcessingRef = useRef(false);

  const checkInMut = useMutation({
    mutationFn: (token: string) =>
      api.patch<{ checked_in_at: string | null }>(
        `/api/admin/reservations/token/${token}/checkin`
      ),
    onSuccess: (data) => {
      if (reservation) {
        setReservation({ ...reservation, checked_in_at: data.checked_in_at });
      }
    },
  });

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch {
        // already stopped
      }
    }
  }, []);

  const handleScanSuccess = useCallback(async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const token = extractToken(decodedText);
    if (!token) {
      isProcessingRef.current = false;
      return;
    }

    setPhase("loading");
    await stopScanner();

    try {
      const res = await api.get<TokenReservation>(
        `/api/admin/reservations/token/${token}`
      );
      setReservation(res);
      setPhase("result");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Reservierung nicht gefunden";
      setErrorMsg(message);
      setPhase("error");
    }
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    isProcessingRef.current = false;
    setReservation(null);
    setErrorMsg("");
    setPhase("scanning");

    await new Promise((r) => setTimeout(r, 100));

    const el = document.getElementById(scannerContainerId);
    if (!el) return;

    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
      } catch { /* ignore */ }
      scannerRef.current.clear();
    }

    const scanner = new Html5Qrcode(scannerContainerId);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => { handleScanSuccess(text); },
        () => {},
      );
    } catch {
      setErrorMsg("Kamera konnte nicht gestartet werden. Bitte erlauben Sie den Kamerazugriff.");
      setPhase("error");
    }
  }, [handleScanSuccess]);

  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, [startScanner, stopScanner]);

  const handleReset = () => {
    checkInMut.reset();
    startScanner();
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => { stopScanner(); navigate(-1); }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Zurück
        </button>
        <h1 className="text-xl font-heading uppercase text-foreground flex items-center gap-2">
          <QrCode size={22} />
          QR-Code Scanner
        </h1>
      </div>

      {/* Scanner */}
      {phase === "scanning" && (
        <div className="bg-card border border-border rounded-sm overflow-hidden">
          <div
            id={scannerContainerId}
            className="w-full aspect-square max-h-[60vh] bg-black"
          />
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Camera size={16} />
              Halten Sie den QR-Code vor die Kamera
            </p>
          </div>
        </div>
      )}

      {/* Loading */}
      {phase === "loading" && (
        <div className="bg-card border border-border rounded-sm p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Reservierung wird geladen...</p>
        </div>
      )}

      {/* Error */}
      {phase === "error" && (
        <div className="bg-card border border-destructive/50 rounded-sm p-6 text-center">
          <AlertTriangle size={32} className="mx-auto text-destructive mb-3" />
          <p className="text-sm text-destructive font-medium mb-4">{errorMsg}</p>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <RotateCcw size={14} />
            Erneut scannen
          </button>
        </div>
      )}

      {/* Result */}
      {phase === "result" && reservation && (
        <ReservationDetail
          reservation={reservation}
          onCheckIn={() => checkInMut.mutate(reservation.checkin_token)}
          isCheckingIn={checkInMut.isPending}
          onScanNext={handleReset}
        />
      )}
    </div>
  );
}

export function ReservationDetail({
  reservation,
  onCheckIn,
  isCheckingIn,
  onScanNext,
}: {
  reservation: TokenReservation;
  onCheckIn: () => void;
  isCheckingIn: boolean;
  onScanNext?: () => void;
}) {
  const isCheckedIn = !!reservation.checked_in_at;
  const isCancelled = reservation.status === "cancelled";
  const zoneLabel =
    reservation.zone_label ??
    ZONE_LABELS[reservation.seating_zone ?? ""] ??
    null;

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div
        className={`rounded-sm p-4 text-center ${
          isCheckedIn
            ? "bg-green-50 border border-green-300"
            : isCancelled
            ? "bg-red-50 border border-red-300"
            : "bg-yellow-50 border border-yellow-300"
        }`}
      >
        {isCheckedIn ? (
          <div className="flex items-center justify-center gap-2 text-green-700">
            <UserCheck size={20} />
            <span className="font-heading text-sm uppercase tracking-wider font-semibold">
              Eingecheckt um {formatTime(reservation.checked_in_at!)}
            </span>
          </div>
        ) : isCancelled ? (
          <div className="flex items-center justify-center gap-2 text-red-700">
            <AlertTriangle size={20} />
            <span className="font-heading text-sm uppercase tracking-wider font-semibold">
              Reservierung storniert
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-yellow-700">
            <UserX size={20} />
            <span className="font-heading text-sm uppercase tracking-wider font-semibold">
              Noch nicht eingecheckt
            </span>
          </div>
        )}
      </div>

      {/* Detail Card */}
      <div className="bg-card border border-border rounded-sm overflow-hidden">
        {/* Name */}
        <div className="px-5 pt-5 pb-3 border-b border-border">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Gast</span>
          <p className="text-xl font-heading font-bold text-foreground mt-1">
            {reservation.name}
          </p>
        </div>

        {/* Event */}
        <div className="px-5 py-3 border-b border-border">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-heading">Veranstaltung</span>
          <p className="text-base font-heading font-semibold text-primary mt-1">
            {reservation.event_title}
          </p>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-2 gap-px bg-border">
          <div className="bg-card px-5 py-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <CalendarDays size={12} />
              <span className="text-xs uppercase tracking-wider font-heading">Datum</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {formatDate(reservation.reservation_date)}
            </p>
          </div>
          <div className="bg-card px-5 py-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Clock size={12} />
              <span className="text-xs uppercase tracking-wider font-heading">Uhrzeit</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {reservation.event_time} Uhr
            </p>
          </div>
          <div className="bg-card px-5 py-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Users size={12} />
              <span className="text-xs uppercase tracking-wider font-heading">Plätze</span>
            </div>
            <p className="text-lg font-heading font-bold text-foreground">
              {reservation.seats}
            </p>
          </div>
          <div className="bg-card px-5 py-3">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <MapPin size={12} />
              <span className="text-xs uppercase tracking-wider font-heading">Bereich</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {zoneLabel ?? "–"}
            </p>
          </div>
          <div className="bg-card px-5 py-3 col-span-2">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <CalendarPlus size={12} />
              <span className="text-xs uppercase tracking-wider font-heading">Reserviert am</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {new Date(reservation.created_at).toLocaleDateString("de-AT", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        {!isCancelled && (
          <button
            onClick={onCheckIn}
            disabled={isCheckingIn}
            className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-sm text-base font-heading font-semibold uppercase tracking-wider transition-colors ${
              isCheckedIn
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            {isCheckingIn ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isCheckedIn ? (
              <>
                <UserCheck size={18} />
                Check-in aufheben
              </>
            ) : (
              <>
                <UserCheck size={18} />
                Jetzt einchecken
              </>
            )}
          </button>
        )}

        {onScanNext && (
          <button
            onClick={onScanNext}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-sm border border-border text-sm font-heading uppercase tracking-wider text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <RotateCcw size={14} />
            Nächsten QR-Code scannen
          </button>
        )}
      </div>
    </div>
  );
}
