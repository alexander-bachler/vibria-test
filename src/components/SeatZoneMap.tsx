// Seating zone data type from the /api/events/{id}/zones endpoint
export interface ZoneData {
  reserved: number;
  capacity: number;
  available: number;
  label: string;
}

export type ZoneKey =
  | "vorne-links"  | "vorne-mitte"  | "vorne-rechts"
  | "mitte-links"  | "mitte-mitte"  | "mitte-rechts"
  | "hinten-links" | "hinten-mitte" | "hinten-rechts";

interface SeatZoneMapProps {
  zones: Record<string, ZoneData>;
  selectedZone: ZoneKey | null;
  onSelect: (zone: ZoneKey) => void;
}

const ZONE_GRID: { key: ZoneKey; row: string; col: string }[] = [
  { key: "vorne-links",   row: "Vorne",  col: "Links"  },
  { key: "vorne-mitte",   row: "Vorne",  col: "Mitte"  },
  { key: "vorne-rechts",  row: "Vorne",  col: "Rechts" },
  { key: "mitte-links",   row: "Mitte",  col: "Links"  },
  { key: "mitte-mitte",   row: "Mitte",  col: "Mitte"  },
  { key: "mitte-rechts",  row: "Mitte",  col: "Rechts" },
  { key: "hinten-links",  row: "Hinten", col: "Links"  },
  { key: "hinten-mitte",  row: "Hinten", col: "Mitte"  },
  { key: "hinten-rechts", row: "Hinten", col: "Rechts" },
];

// SVG layout constants
const PAD = 12;       // outer padding
const STAGE_H = 36;   // stage bar height
const GAP = 6;        // gap between zones
const ZONE_W = 110;   // zone rect width
const ZONE_H = 82;    // zone rect height
const COLS = 3;
const ROWS = 3;
const SVG_W = PAD * 2 + ZONE_W * COLS + GAP * (COLS - 1);
const SVG_H = PAD + STAGE_H + GAP * 2 + (ZONE_H + GAP) * ROWS + PAD;

function zoneRect(index: number) {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const x = PAD + col * (ZONE_W + GAP);
  const y = PAD + STAGE_H + GAP * 2 + row * (ZONE_H + GAP);
  return { x, y };
}

function getFill(zone: ZoneData | undefined, isSelected: boolean): string {
  if (!zone) return "hsl(var(--muted))";
  if (isSelected) return "hsl(var(--primary))";
  if (zone.available <= 0) return "hsl(0 40% 25%)";
  if (zone.available <= 1) return "hsl(30 50% 22%)";
  return "hsl(195 70% 18%)";
}

function getTextFill(zone: ZoneData | undefined, isSelected: boolean): string {
  if (!zone) return "hsl(var(--muted-foreground))";
  if (isSelected) return "hsl(var(--primary-foreground))";
  return "hsl(var(--primary-foreground))";
}

function getAvailColor(zone: ZoneData | undefined, isSelected: boolean): string {
  if (!zone || isSelected) return "hsl(var(--primary-foreground))";
  if (zone.available <= 0) return "hsl(0 80% 70%)";
  if (zone.available <= 1) return "hsl(35 90% 65%)";
  return "hsl(145 60% 65%)";
}

export default function SeatZoneMap({ zones, selectedZone, onSelect }: SeatZoneMapProps) {
  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 font-body text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "hsl(145 60% 65%)" }} />
          Frei
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "hsl(35 90% 65%)" }} />
          Letzter Platz
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm inline-block" style={{ background: "hsl(0 80% 70%)" }} />
          Voll
        </span>
      </div>

      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full max-w-sm mx-auto"
        role="img"
        aria-label="Sitzbereich-Plan"
      >
        {/* Stage bar */}
        <rect
          x={PAD}
          y={PAD}
          width={SVG_W - PAD * 2}
          height={STAGE_H}
          rx={4}
          fill="hsl(var(--foreground) / 0.08)"
        />
        <text
          x={SVG_W / 2}
          y={PAD + STAGE_H / 2 + 5}
          textAnchor="middle"
          fontSize={11}
          fontFamily="var(--font-heading, sans-serif)"
          letterSpacing={4}
          fill="hsl(var(--muted-foreground))"
        >
          BÜHNE
        </text>

        {/* Zone rects */}
        {ZONE_GRID.map((zone, i) => {
          const { x, y } = zoneRect(i);
          const data = zones[zone.key];
          const isFull = !!data && data.available <= 0;
          const isSelected = selectedZone === zone.key;
          const fill = getFill(data, isSelected);
          const textFill = getTextFill(data, isSelected);

          return (
            <g
              key={zone.key}
              onClick={() => !isFull && onSelect(zone.key)}
              style={{ cursor: isFull ? "not-allowed" : "pointer", opacity: isFull ? 0.6 : 1 }}
              role="button"
              aria-label={`${zone.row} ${zone.col}`}
              aria-pressed={isSelected}
              aria-disabled={isFull}
            >
              <rect
                x={x}
                y={y}
                width={ZONE_W}
                height={ZONE_H}
                rx={5}
                fill={fill}
                stroke={isSelected ? "hsl(var(--accent))" : "transparent"}
                strokeWidth={isSelected ? 2.5 : 0}
              />

              {/* Row label (small) */}
              <text
                x={x + ZONE_W / 2}
                y={y + 22}
                textAnchor="middle"
                fontSize={9}
                fontFamily="var(--font-body, sans-serif)"
                fill={textFill}
                opacity={0.75}
                letterSpacing={1.5}
              >
                {zone.row.toUpperCase()}
              </text>

              {/* Col label (large) */}
              <text
                x={x + ZONE_W / 2}
                y={y + 38}
                textAnchor="middle"
                fontSize={13}
                fontFamily="var(--font-heading, sans-serif)"
                fontWeight="bold"
                fill={textFill}
              >
                {zone.col}
              </text>

              {/* Available seats */}
              <text
                x={x + ZONE_W / 2}
                y={y + 60}
                textAnchor="middle"
                fontSize={13}
                fontWeight="bold"
                fontFamily="var(--font-heading, sans-serif)"
                fill={getAvailColor(data, isSelected)}
              >
                {data
                  ? data.available <= 0
                    ? "VOLL"
                    : `${data.available}/${data.capacity} frei`
                  : ""}
              </text>
              {data && data.available <= 0 && !isSelected && (
                <line
                  x1={x + 8} y1={y + 8}
                  x2={x + ZONE_W - 8} y2={y + ZONE_H - 8}
                  stroke="hsl(0 60% 50% / 0.3)"
                  strokeWidth={1.5}
                />
              )}
            </g>
          );
        })}

      </svg>
    </div>
  );
}
