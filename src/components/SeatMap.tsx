import { useMemo } from "react";
import { motion } from "framer-motion";

// ─── Seat Layout ─────────────────────────────────────────────────────────────
// Room: rectangular, stage at top, entrance at bottom-right
// 40 seats: 3 left + 3 right per row, center aisle, staggered odd rows
// 6 full rows (6 seats) + 1 back row (4 seats) = 40

const ROW_CONFIG = [
  { row: "A", seatsPerSide: 3 },
  { row: "B", seatsPerSide: 3 },
  { row: "C", seatsPerSide: 3 },
  { row: "D", seatsPerSide: 3 },
  { row: "E", seatsPerSide: 3 },
  { row: "F", seatsPerSide: 3 },
  { row: "G", seatsPerSide: 2 }, // back row, 4 seats
];
// Total: 6×6 + 4 = 40

interface SeatDef {
  id: string;
  row: string;
  num: number;
  cx: number;
  cy: number;
}

function generateSeats(): SeatDef[] {
  const seats: SeatDef[] = [];
  const seatW = 44;
  const seatH = 44;
  const aisleWidth = 30;
  const staggerOffset = seatW / 2;
  const maxPerSide = 3;

  for (let r = 0; r < ROW_CONFIG.length; r++) {
    const { row, seatsPerSide } = ROW_CONFIG[r];
    const isOddRow = r % 2 === 1;
    const rowOffsetX = isOddRow ? staggerOffset : 0;

    // Center narrower rows
    const sideOffset = (maxPerSide - seatsPerSide) * seatW / 2;

    for (let side = 0; side < 2; side++) {
      for (let s = 0; s < seatsPerSide; s++) {
        const seatNum = side * seatsPerSide + s + 1;
        let cx: number;
        if (side === 0) {
          cx = rowOffsetX + sideOffset + s * seatW + seatW / 2;
        } else {
          cx = rowOffsetX + sideOffset + maxPerSide * seatW + aisleWidth + s * seatW + seatW / 2;
        }
        seats.push({
          id: `${row}${seatNum}`,
          row,
          num: seatNum,
          cx,
          cy: r * seatH + seatH / 2,
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

  const seatW = 44;
  const aisleWidth = 30;
  const svgWidth = 6 * seatW + aisleWidth + seatW; // 3+3 seats + aisle + stagger
  const svgHeight = 7 * 44 + 80;

  const stageY = -30;
  const seatsOffsetY = 50;

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 font-body text-xs text-muted-foreground">
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
        viewBox={`-10 ${stageY} ${svgWidth + 20} ${svgHeight + 10}`}
        className="w-full max-w-md mx-auto"
        role="img"
        aria-label="Sitzplan – wählen Sie Ihre Plätze"
      >
        {/* Stage */}
        <rect
          x={svgWidth * 0.1}
          y={stageY}
          width={svgWidth * 0.8}
          height={28}
          rx={4}
          className="fill-primary/15 stroke-primary/40"
          strokeWidth={1.5}
        />
        <text
          x={svgWidth / 2}
          y={stageY + 18}
          textAnchor="middle"
          className="fill-primary/60 text-[11px] font-heading uppercase tracking-widest"
        >
          Bühne
        </text>

        {/* Room outline */}
        <rect
          x={-6}
          y={seatsOffsetY - 18}
          width={svgWidth + 12}
          height={7 * 44 + 24}
          rx={8}
          className="fill-none stroke-border"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* Entrance indicator bottom-right */}
        <g transform={`translate(${svgWidth - 40}, ${seatsOffsetY + 7 * 44 - 4})`}>
          <rect x={0} y={0} width={42} height={14} rx={3} className="fill-muted stroke-border" strokeWidth={1} />
          <text x={21} y={10.5} textAnchor="middle" className="fill-muted-foreground text-[7px] font-body">
            Eingang
          </text>
        </g>

        {/* Seats */}
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
                x={seat.cx - 16}
                y={seat.cy + seatsOffsetY - 16}
                width={32}
                height={32}
                rx={6}
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
                y={seat.cy + seatsOffsetY + 1}
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
