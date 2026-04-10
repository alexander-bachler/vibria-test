import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, UserCheck, UserX, Phone, Mail, Search, Users, CalendarDays, QrCode,
} from "lucide-react";
import { useState, useMemo, Fragment } from "react";
import { api } from "@/lib/api";
import type { VEvent, Reservation } from "@/lib/api";

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

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatDate(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("de-AT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("de-AT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("de-AT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface DayStats {
  date: string;
  reserved: number;
  checkedIn: number;
  confirmed: number;
  pending: number;
  reservationCount: number;
}

function DayOverviewBar({
  day,
  totalSeats,
  isSelected,
  onClick,
}: {
  day: DayStats;
  totalSeats: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const pctReserved = Math.min(100, (day.reserved / totalSeats) * 100);
  const pctCheckedIn = Math.min(pctReserved, (day.checkedIn / totalSeats) * 100);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-card border rounded-sm p-3 transition-colors ${
        isSelected ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-heading text-sm font-semibold text-foreground">
          {formatDateShort(day.date)}
        </span>
        <span className="text-xs text-muted-foreground">
          {day.reserved}/{totalSeats} Plätze
        </span>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-primary/25 rounded-full transition-all duration-300"
          style={{ width: `${pctReserved}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all duration-300"
          style={{ width: `${pctCheckedIn}%` }}
        />
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
          {day.checkedIn} da
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-green-200" />
          {day.confirmed} bestätigt
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-300" />
          {day.pending} offen
        </span>
        <span className="ml-auto">{day.reservationCount} Buchungen</span>
      </div>
    </button>
  );
}

function GuestRow({
  r,
  showDate,
  onCheckIn,
  isPending,
}: {
  r: Reservation;
  showDate: boolean;
  onCheckIn: () => void;
  isPending: boolean;
}) {
  return (
    <tr
      className={`border-b border-border transition-colors ${
        r.checked_in_at ? "bg-green-50/60" : "hover:bg-muted/30"
      } ${r.status === "cancelled" ? "opacity-40" : ""}`}
    >
      <td className="px-4 py-3">
        <span className="font-medium text-foreground">{r.name}</span>
      </td>
      {showDate && (
        <td className="px-4 py-3 text-muted-foreground text-xs">
          {formatDateShort(r.reservation_date)}
        </td>
      )}
      <td className="px-4 py-3">
        <div className="flex flex-col gap-0.5">
          <a href={`mailto:${r.email}`} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1">
            <Mail size={11} /> {r.email}
          </a>
          {r.phone && (
            <a href={`tel:${r.phone}`} className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1">
              <Phone size={11} /> {r.phone}
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {r.seating_zone ? (
          <span className="inline-block bg-primary/10 text-primary text-xs px-2 py-0.5 rounded">
            {ZONE_LABELS[r.seating_zone] ?? r.seating_zone}
          </span>
        ) : (
          <span className="text-muted-foreground/40 text-xs">–</span>
        )}
      </td>
      <td className="px-4 py-3 text-center font-bold">{r.seats}</td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}>
          {r.status}
        </span>
      </td>
      <td className="px-4 py-3 text-center">
        {r.status !== "cancelled" && (
          <button
            onClick={onCheckIn}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              r.checked_in_at
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {r.checked_in_at ? (
              <><UserCheck size={13} /> Da · {formatTime(r.checked_in_at)}</>
            ) : (
              <><UserX size={13} /> Einchecken</>
            )}
          </button>
        )}
      </td>
    </tr>
  );
}

function GuestCard({
  r,
  showDate,
  onCheckIn,
  isPending,
}: {
  r: Reservation;
  showDate: boolean;
  onCheckIn: () => void;
  isPending: boolean;
}) {
  return (
    <div
      className={`bg-card border rounded-sm p-4 ${
        r.checked_in_at ? "border-green-300 bg-green-50/60" : "border-border"
      } ${r.status === "cancelled" ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-foreground text-sm truncate">{r.name}</span>
            <span className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${STATUS_COLORS[r.status] ?? "bg-muted text-muted-foreground"}`}>
              {r.status}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{r.seats} {r.seats === 1 ? "Platz" : "Plätze"}</span>
            {r.seating_zone && (
              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px]">
                {ZONE_LABELS[r.seating_zone] ?? r.seating_zone}
              </span>
            )}
            {showDate && <span>{formatDateShort(r.reservation_date)}</span>}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            {r.phone && (
              <a href={`tel:${r.phone}`} className="hover:text-primary flex items-center gap-1">
                <Phone size={11} /> {r.phone}
              </a>
            )}
            <a href={`mailto:${r.email}`} className="hover:text-primary flex items-center gap-1 truncate">
              <Mail size={11} /> {r.email}
            </a>
          </div>
        </div>
        {r.status !== "cancelled" && (
          <button
            onClick={onCheckIn}
            disabled={isPending}
            className={`shrink-0 flex items-center justify-center w-12 h-12 rounded-sm transition-colors ${
              r.checked_in_at ? "bg-green-600 text-white" : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground"
            }`}
          >
            {r.checked_in_at ? <UserCheck size={20} /> : <UserX size={20} />}
          </button>
        )}
      </div>
      {r.checked_in_at && (
        <div className="mt-2 text-[10px] text-green-700 font-medium">
          Eingecheckt um {formatTime(r.checked_in_at)}
        </div>
      )}
    </div>
  );
}

export default function EventGuestList() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [hideCancel, setHideCancel] = useState(true);

  const { data: event } = useQuery<VEvent>({
    queryKey: ["admin-event", id],
    queryFn: () => api.get(`/api/events/${id}`),
    enabled: !!id,
  });

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["admin-reservations", id],
    queryFn: () => api.get(`/api/admin/reservations?event_id=${id}`),
    enabled: !!id,
  });

  const checkInMut = useMutation({
    mutationFn: (resId: number) =>
      api.patch<{ checked_in_at: string | null }>(
        `/api/admin/reservations/${resId}/checkin`
      ),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["admin-reservations", id] }),
  });

  const uniqueDates = useMemo(() => {
    const dates = [...new Set(reservations.map((r) => r.reservation_date))];
    dates.sort();
    return dates;
  }, [reservations]);

  const isMultiDay = uniqueDates.length > 1;

  const dayStatsMap = useMemo(() => {
    const map: Record<string, DayStats> = {};
    for (const date of uniqueDates) {
      const dayRes = reservations.filter(
        (r) => r.reservation_date === date && r.status !== "cancelled"
      );
      map[date] = {
        date,
        reserved: dayRes.reduce((s, r) => s + r.seats, 0),
        checkedIn: dayRes.filter((r) => r.checked_in_at).reduce((s, r) => s + r.seats, 0),
        confirmed: dayRes.filter((r) => r.status === "confirmed").reduce((s, r) => s + r.seats, 0),
        pending: dayRes.filter((r) => r.status === "pending").reduce((s, r) => s + r.seats, 0),
        reservationCount: dayRes.length,
      };
    }
    return map;
  }, [reservations, uniqueDates]);

  const filtered = useMemo(() => {
    let list = reservations;
    if (hideCancel) list = list.filter((r) => r.status !== "cancelled");
    if (dateFilter !== "all")
      list = list.filter((r) => r.reservation_date === dateFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          (r.phone && r.phone.includes(q))
      );
    }
    return list;
  }, [reservations, hideCancel, dateFilter, search]);

  const groupedByDate = useMemo(() => {
    if (!isMultiDay || dateFilter !== "all") return null;
    const groups: Record<string, Reservation[]> = {};
    for (const r of filtered) {
      (groups[r.reservation_date] ??= []).push(r);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, isMultiDay, dateFilter]);

  const stats = useMemo(() => {
    const active = filtered.filter((r) => r.status !== "cancelled");
    return {
      totalGuests: active.reduce((sum, r) => sum + r.seats, 0),
      checkedIn: active.filter((r) => r.checked_in_at).reduce((sum, r) => sum + r.seats, 0),
      reservationCount: active.length,
    };
  }, [filtered]);

  const totalSeats = event?.total_seats ?? 40;

  if (!id) return null;

  const showDateColumn = isMultiDay && dateFilter !== "all" && !groupedByDate;

  const renderTableHead = (showDate: boolean) => (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading">Name</th>
        {showDate && <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading">Datum</th>}
        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading">Kontakt</th>
        <th className="text-left px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading">Bereich</th>
        <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading">Plätze</th>
        <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading">Status</th>
        <th className="text-center px-4 py-3 text-xs uppercase tracking-wider text-muted-foreground font-heading">Check-in</th>
      </tr>
    </thead>
  );

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate("/admin/events")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} />
            Zurück zu Veranstaltungen
          </button>
          <button
            onClick={() => navigate("/admin/scan")}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm font-heading uppercase tracking-wider rounded-sm hover:bg-primary/90 transition-colors"
          >
            <QrCode size={14} />
            QR Scanner
          </button>
        </div>
        {event && (
          <div>
            <h1 className="text-2xl uppercase text-foreground">{event.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {event.end_date && event.end_date > event.date
                ? `${formatDate(event.date)} – ${formatDate(event.end_date)}`
                : formatDate(event.date)}{" "}
              · {event.time} Uhr
              {event.total_seats && ` · ${event.total_seats} Plätze gesamt`}
            </p>
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-sm px-4 py-3 text-center">
          <div className="text-2xl font-heading font-bold text-foreground">{stats.totalGuests}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Gäste erwartet</div>
        </div>
        <div className="bg-card border border-border rounded-sm px-4 py-3 text-center">
          <div className="text-2xl font-heading font-bold text-green-600">{stats.checkedIn}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Eingecheckt</div>
        </div>
        <div className="bg-card border border-border rounded-sm px-4 py-3 text-center">
          <div className="text-2xl font-heading font-bold text-foreground">{stats.reservationCount}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Reservierungen</div>
        </div>
      </div>

      {/* Day overview (graphical) */}
      {isMultiDay && uniqueDates.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays size={14} className="text-muted-foreground" />
            <h2 className="text-sm font-heading uppercase tracking-wider text-muted-foreground">Tagesübersicht</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <button
              onClick={() => setDateFilter("all")}
              className={`w-full text-left bg-card border rounded-sm px-3 py-2 text-xs transition-colors ${
                dateFilter === "all" ? "border-primary ring-1 ring-primary/20" : "border-border hover:border-primary/40"
              }`}
            >
              <span className="font-heading font-semibold text-foreground">Alle Tage</span>
            </button>
            {uniqueDates.map((d) => (
              <DayOverviewBar
                key={d}
                day={dayStatsMap[d]}
                totalSeats={totalSeats}
                isSelected={dateFilter === d}
                onClick={() => setDateFilter(dateFilter === d ? "all" : d)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Single-day capacity bar */}
      {!isMultiDay && uniqueDates.length === 1 && (
        <div className="mb-6 bg-card border border-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-heading text-foreground">Auslastung</span>
            <span className="text-xs text-muted-foreground">
              {stats.totalGuests}/{totalSeats} Plätze
            </span>
          </div>
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary/25 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (stats.totalGuests / totalSeats) * 100)}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (stats.checkedIn / totalSeats) * 100)}%` }}
            />
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500" /> {stats.checkedIn} eingecheckt
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-primary/25" /> {stats.totalGuests} reserviert
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-muted border border-border" /> {totalSeats - stats.totalGuests} frei
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Name, E-Mail oder Telefon suchen…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field pl-9 text-sm"
          />
        </div>
        {isMultiDay && (
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="field text-sm w-full sm:w-auto"
          >
            <option value="all">Alle Tage</option>
            {uniqueDates.map((d) => (
              <option key={d} value={d}>{formatDate(d)}</option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap cursor-pointer select-none">
          <input type="checkbox" className="rounded" checked={hideCancel} onChange={(e) => setHideCancel(e.target.checked)} />
          Stornierte ausblenden
        </label>
      </div>

      {/* Guest list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-sm p-8 text-center">
          <Users size={32} className="mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-muted-foreground text-sm">
            {reservations.length === 0
              ? "Noch keine Reservierungen für diese Veranstaltung."
              : "Keine Ergebnisse für die aktuelle Filterung."}
          </p>
        </div>
      ) : groupedByDate ? (
        /* Grouped by day view */
        <div className="space-y-6">
          {groupedByDate.map(([date, dayReservations]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays size={13} className="text-primary" />
                <h3 className="font-heading text-sm uppercase tracking-wider text-foreground">
                  {formatDate(date)}
                </h3>
                <span className="text-xs text-muted-foreground">
                  — {dayReservations.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.seats, 0)} Gäste
                </span>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block bg-card border border-border rounded-sm overflow-hidden">
                <table className="w-full text-sm font-body">
                  {renderTableHead(false)}
                  <tbody>
                    {dayReservations.map((r) => (
                      <GuestRow key={r.id} r={r} showDate={false} onCheckIn={() => checkInMut.mutate(r.id)} isPending={checkInMut.isPending} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden space-y-2">
                {dayReservations.map((r) => (
                  <GuestCard key={r.id} r={r} showDate={false} onCheckIn={() => checkInMut.mutate(r.id)} isPending={checkInMut.isPending} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Flat list (single day or filtered to one day) */
        <>
          <div className="hidden md:block bg-card border border-border rounded-sm overflow-hidden">
            <table className="w-full text-sm font-body">
              {renderTableHead(showDateColumn)}
              <tbody>
                {filtered.map((r) => (
                  <GuestRow key={r.id} r={r} showDate={showDateColumn} onCheckIn={() => checkInMut.mutate(r.id)} isPending={checkInMut.isPending} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-2">
            {filtered.map((r) => (
              <GuestCard key={r.id} r={r} showDate={showDateColumn} onCheckIn={() => checkInMut.mutate(r.id)} isPending={checkInMut.isPending} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
