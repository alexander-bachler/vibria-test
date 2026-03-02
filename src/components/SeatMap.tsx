import { useMemo } from "react";
import { motion } from "framer-motion";

// ─── Seat Layout ─────────────────────────────────────────────────────────────
// Room based on sketch: rectangular, stage at top, stairs + entrance bottom-right
// 40 seats: 3 left + 3 right per row, center aisle (Fluchtweg)
// 6 full rows (6 seats) + 1 back row (4 seats) = 40
// No stagger – seats directly aligned vertically

const ROW_CONFIG = [
  { row: "A", seatsPerSide: 3 },
  { row: "B", seatsPerSide: 3 },
  { row: "C", seatsPerSide: 3 },
  { row: "D", seatsPerSide: 3 },
  { row: "E", seatsPerSide: 3 },
  { row: "F", seatsPerSide: 3 },
  { row: "G", seatsPerSide: 2 },
];

interface SeatDef {
  id: string;
  row: string;
  num: number;
  cx: number;
  cy: number;
}

const SEAT_W = 42;
const SEAT_H = 42;
const AISLE_W = 52;
const MAX_PER_SIDE = 3;
const NUM_ROWS = ROW_CONFIG.length;
const ROOM_W = MAX_PER_SIDE * SEAT_W * 2 + AISLE_W;
const ROOM_H = NUM_ROWS * SEAT_H;

function generateSeats(): SeatDef[] {
  const seats: SeatDef[] = [];

  for (let r = 0; r < ROW_CONFIG.length; r++) {
    const { row, seatsPerSide } = ROW_CONFIG[r];
    const sideOffset = (MAX_PER_SIDE - seatsPerSide) * SEAT_W / 2;

    for (let side = 0; side < 2; side++) {
      for (let s = 0; s < seatsPerSide; s++) {
        const seatNum = side * seatsPerSide + s + 1;
        let cx: number;
        if (side === 0) {
          cx = sideOffset + s * SEAT_W + SEAT_W / 2;
        } else {
          cx = MAX_PER_SIDE * SEAT_W + AISLE_W + sideOffset + s * SEAT_W + SEAT_W / 2;
        }
        seats.push({
          id: `${row}${seatNum}`,
          row,
          num: seatNum,
          cx,
          cy: r * SEAT_H + SEAT_H / 2,
        });
      }
    }
  }
  return seats;
}

const ALL_SEATS = generateSeats();

// ─── Component ───────────────────────────────────────────────────────────────

interface SeatMapProps {
  bookedSeatIds: string[];
  selectedSeatIds: string[];
  onToggleSeat: (seatId: string) => void;
}

export default function SeatMap({ bookedSeatIds, selectedSeatIds, onToggleSeat }: SeatMapProps) {
  const bookedSet = useMemo(() => new Set(bookedSeatIds), [bookedSeatIds]);
  const selectedSet = useMemo(() => new Set(selectedSeatIds), [selectedSeatIds]);

  const stageH = 30;
  const stageGap = 20;
  const seatsY = stageH + stageGap;
  const stairsH = 40;
  const techW = 60;
  const techH = 30;
  const totalH = seatsY + ROOM_H + stairsH + 30;
  const margin = 16;

  // Stairs area dimensions (bottom-right, outside room)
  const stairsW = 50;
  const stairsX = ROOM_W - stairsW;
  const stairsY = seatsY + ROOM_H;

  // Tech area (below stairs)
  const techX = ROOM_W - techW - 5;
  const techY = stairsY + stairsH + 4;

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mb-4 font-body text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm border border-border bg-card" /> Frei
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-primary" /> Ausgewählt
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm bg-muted-foreground/30" /> Reserviert
        </span>
      </div>

      <svg
        viewBox={`${-margin} ${-margin} ${ROOM_W + margin * 2} ${totalH + margin * 2}`}
        className="w-full max-w-sm mx-auto"
        role="img"
        aria-label="Sitzplan – wählen Sie Ihre Plätze"
      >
        {/* ── Stage ── */}
        <rect
          x={ROOM_W * 0.08}
          y={0}
          width={ROOM_W * 0.84}
          height={stageH}
          rx={4}
          className="fill-primary/15 stroke-primary/40"
          strokeWidth={1.5}
        />
        <text
          x={ROOM_W / 2}
          y={stageH / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-primary/60 text-[11px] font-heading uppercase tracking-[0.2em]"
        >
          Bühne
        </text>

        {/* ── Room outline ── */}
        <rect
          x={-4}
          y={seatsY - 10}
          width={ROOM_W + 8}
          height={ROOM_H + 16}
          rx={6}
          className="fill-none stroke-border"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* ── Center aisle (Fluchtweg) – solid gray fill ── */}
        <rect
          x={MAX_PER_SIDE * SEAT_W}
          y={seatsY - 8}
          width={AISLE_W}
          height={ROOM_H + 12}
          rx={3}
          className="fill-muted/60"
        />
        <text
          x={MAX_PER_SIDE * SEAT_W + AISLE_W / 2}
          y={seatsY + ROOM_H + 12}
          textAnchor="middle"
          className="fill-muted-foreground/50 text-[7px] font-body uppercase tracking-[0.15em]"
        >
          Fluchtweg
        </text>
        {/* Small arrows in aisle */}
        {[0, 1, 2].map((i) => {
          const ax = MAX_PER_SIDE * SEAT_W + AISLE_W / 2;
          const ay = seatsY + 30 + i * (ROOM_H / 3);
          return (
            <polygon
              key={`arrow-${i}`}
              points={`${ax},${ay + 8} ${ax - 4},${ay} ${ax + 4},${ay}`}
              className="fill-muted-foreground/20"
            />
          );
        })}

        {/* ── Seats ── */}
        {ALL_SEATS.map((seat, i) => {
          const isBooked = bookedSet.has(seat.id);
          const isSelected = selectedSet.has(seat.id);

          return (
            <motion.g
              key={seat.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.012, duration: 0.25 }}
            >
              <rect
                x={seat.cx - 15}
                y={seat.cy + seatsY - 15}
                width={30}
                height={30}
                rx={5}
                className={
                  isBooked
                    ? "fill-muted-foreground/25 stroke-muted-foreground/20 cursor-not-allowed"
                    : isSelected
                      ? "fill-primary stroke-primary cursor-pointer"
                      : "fill-card stroke-border hover:stroke-primary/60 hover:fill-primary/10 cursor-pointer transition-colors"
                }
                strokeWidth={1.5}
                onClick={() => !isBooked && onToggleSeat(seat.id)}
                role="button"
                aria-label={`Platz ${seat.id}${isBooked ? " (reserviert)" : isSelected ? " (ausgewählt)" : ""}`}
                tabIndex={isBooked ? -1 : 0}
                onKeyDown={(e) => {
                  if (!isBooked && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onToggleSeat(seat.id);
                  }
                }}
              />
              <text
                x={seat.cx}
                y={seat.cy + seatsY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-[9px] font-body pointer-events-none select-none ${
                  isBooked
                    ? "fill-muted-foreground/40"
                    : isSelected
                      ? "fill-primary-foreground"
                      : "fill-muted-foreground"
                }`}
              >
                {seat.id}
              </text>
            </motion.g>
          );
        })}

        {/* ── Stairs (bottom-right, outside room) ── */}
        <rect
          x={stairsX}
          y={stairsY + 8}
          width={stairsW + 4}
          height={stairsH - 4}
          rx={3}
          className="fill-muted stroke-border"
          strokeWidth={1}
        />
        {/* Stair lines */}
        {[0, 1, 2, 3].map((i) => (
          <line
            key={`stair-${i}`}
            x1={stairsX + 6}
            y1={stairsY + 14 + i * 7}
            x2={stairsX + stairsW - 2}
            y2={stairsY + 14 + i * 7}
            className="stroke-muted-foreground/30"
            strokeWidth={1}
          />
        ))}
        <text
          x={stairsX + (stairsW + 4) / 2}
          y={stairsY + stairsH + 10}
          textAnchor="middle"
          className="fill-muted-foreground/60 text-[7px] font-body"
        >
          Stiegen
        </text>

        {/* ── Entrance arrow on right side ── */}
        <g transform={`translate(${ROOM_W + 6}, ${stairsY - 10})`}>
          <text
            x={0}
            y={0}
            textAnchor="start"
            className="fill-muted-foreground/50 text-[7px] font-body"
            transform="rotate(90)"
          >
            Eingang →
          </text>
        </g>

        {/* ── Technik area (bottom-center-right) ── */}
        <rect
          x={0}
          y={stairsY + 8}
          width={stairsX - 8}
          height={18}
          rx={3}
          className="fill-muted/40 stroke-border"
          strokeWidth={0.5}
          strokeDasharray="3 2"
        />
        <text
          x={(stairsX - 8) / 2}
          y={stairsY + 20}
          textAnchor="middle"
          className="fill-muted-foreground/40 text-[7px] font-body"
        >
          Technik
        </text>
      </svg>

      {/* Selection count */}
      {selectedSeatIds.length > 0 && (
        <p className="text-center font-body text-sm text-foreground mt-3">
          <span className="font-bold">{selectedSeatIds.length}</span>{" "}
          <span className="text-muted-foreground">
            {selectedSeatIds.length === 1 ? "Platz" : "Plätze"} ausgewählt: {selectedSeatIds.join(", ")}
          </span>
        </p>
      )}
    </div>
  );
}
