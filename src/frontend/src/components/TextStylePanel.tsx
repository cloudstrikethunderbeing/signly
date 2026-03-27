import type { OverlayItem } from "../App";

interface Props {
  item: OverlayItem;
  onUpdate: (updates: Partial<OverlayItem>) => void;
}

const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36];

const FONT_FAMILIES = [
  { value: "Arial", label: "Arial" },
  { value: "Georgia", label: "Georgia" },
  { value: "Times New Roman", label: "Times" },
  { value: "Helvetica", label: "Helvetica" },
  { value: "Courier New", label: "Courier" },
];

const COLORS = [
  { value: "#000000", label: "Black" },
  { value: "#1E3A5F", label: "Navy" },
  { value: "#374151", label: "Dark Gray" },
  { value: "#DC2626", label: "Red" },
  { value: "#2563EB", label: "Blue" },
  { value: "#16A34A", label: "Green" },
];

export default function TextStylePanel({ item, onUpdate }: Props) {
  const fontSize = item.fontSize ?? 14;
  const fontColor = item.fontColor ?? "#000000";
  const fontFamily = item.fontFamily ?? "Arial";

  return (
    <div
      className="flex items-center gap-2 flex-wrap bg-white border border-border rounded-xl shadow-lg px-3 py-2"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      data-ocid="text_style.panel"
    >
      {/* Font size controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Decrease font size"
          onClick={(e) => {
            e.stopPropagation();
            const idx = FONT_SIZES.indexOf(fontSize);
            if (idx > 0) onUpdate({ fontSize: FONT_SIZES[idx - 1] });
          }}
          className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-foreground text-sm font-bold flex items-center justify-center transition-colors"
          data-ocid="text_style.secondary_button"
        >
          −
        </button>
        <span className="text-xs font-semibold text-foreground min-w-[24px] text-center tabular-nums">
          {fontSize}
        </span>
        <button
          type="button"
          aria-label="Increase font size"
          onClick={(e) => {
            e.stopPropagation();
            const idx = FONT_SIZES.indexOf(fontSize);
            if (idx < FONT_SIZES.length - 1)
              onUpdate({ fontSize: FONT_SIZES[idx + 1] });
          }}
          className="w-6 h-6 rounded-md bg-muted hover:bg-muted/80 text-foreground text-sm font-bold flex items-center justify-center transition-colors"
          data-ocid="text_style.primary_button"
        >
          +
        </button>
      </div>

      <div className="w-px h-5 bg-border" />

      {/* Color swatches */}
      <div className="flex items-center gap-1">
        {COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            aria-label={`Set color ${c.label}`}
            title={c.label}
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ fontColor: c.value });
            }}
            style={{ background: c.value }}
            className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
              fontColor === c.value
                ? "ring-2 ring-offset-1 ring-primary scale-110"
                : ""
            }`}
            data-ocid="text_style.toggle"
          />
        ))}
      </div>

      <div className="w-px h-5 bg-border" />

      {/* Font family select */}
      <div className="flex items-center gap-1">
        {FONT_FAMILIES.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onUpdate({ fontFamily: f.value });
            }}
            style={{ fontFamily: f.value }}
            className={`text-xs px-2 py-0.5 rounded-md transition-colors ${
              fontFamily === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-foreground hover:bg-muted/70"
            }`}
            data-ocid="text_style.tab"
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
