import { useMemo } from "react";
import { motion } from "framer-motion";

// ─── Seat Layout ─────────────────────────────────────────────────────────────
// Room: rectangular, stage at top, entrance at bottom-right
// 40 seats arranged in 5 rows of 8, slight curve toward stage

const ROWS = [
  { row: "A", seats: 6, y: 0, offsetX: 1 },   // closest to stage, narrower
  { row: "B", seats: 8, y: 1, offsetX: 0 },
  { row: "C", seats: 8, y: 2, offsetX: 0 },
  { row: "D", seats: 8, y: 3, offsetX: 0 },
  { row: "E", seats: 6, y: 4, offsetX: 1 },   // back row near entrance, narrower
  { row: "F", seats: 4, y: 5, offsetX: 2 },   // very back, fewest
];
// Total: 6+8+8+8+6+4 = 40

interface SeatDef {
  id: string;    // e.g. "A1"
  row: string;
  num: number;
  cx: number;
  cy: number;
}

function generateSeats(): SeatDef[] {
  const seats: SeatDef[] = [];
  const seatW = 44;
  const seatH = 48;
  const maxCols = 8;

  for (const r of ROWS) {
    const totalRowWidth = r.seats * seatW;
    const maxRowWidth = maxCols * seatW;
    const startX = (maxRowWidth - totalRowWidth) / 2;

    for (let i = 0; i < r.seats; i++) {
      seats.push({
        id: `${r.row}${i + 1}`,
        row: r.row,
        num: i + 1,
        cx: startX + i * seatW + seatW / 2,
        cy: r.y * seatH + seatH / 2,
      });
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

  const svgWidth = 8 * 44;   // 352
  const svgHeight = 6 * 48 + 80; // rows + stage area

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
          height={6 * 48 + 24}
          rx={8}
          className="fill-none stroke-border"
          strokeWidth={1}
          strokeDasharray="4 3"
        />

        {/* Entrance indicator bottom-right */}
        <g transform={`translate(${svgWidth - 40}, ${seatsOffsetY + 6 * 48 - 4})`}>
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
