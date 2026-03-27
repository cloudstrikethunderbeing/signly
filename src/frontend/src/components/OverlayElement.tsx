import { X } from "lucide-react";
import { useRef } from "react";
import type { OverlayItem } from "../App";

interface DragState {
  startClientX: number;
  startClientY: number;
  startItemX: number;
  startItemY: number;
  startItemW: number;
  startItemH: number;
  parentW: number;
  parentH: number;
  mode: "move" | "resize";
}

interface Props {
  item: OverlayItem;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onUpdate: (updates: Partial<OverlayItem>) => void;
  onDelete: () => void;
  onDragEnd?: () => void;
  onTextBlur?: () => void;
  "data-ocid"?: string;
}

const stampColors: Record<string, string> = {
  SIGNED: "#DC2626",
  APPROVED: "#16A34A",
  DATED: "#1D4ED8",
};

export default function OverlayElement({
  item,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDragEnd,
  onTextBlur,
}: Props) {
  const dragRef = useRef<DragState | null>(null);
  const didDragRef = useRef(false);

  const getParentDimensions = (el: HTMLElement): { w: number; h: number } => {
    let current: HTMLElement | null = el.parentElement;
    while (current) {
      const style = window.getComputedStyle(current);
      if (style.position === "relative") {
        const rect = current.getBoundingClientRect();
        return { w: rect.width, h: rect.height };
      }
      current = current.parentElement;
    }
    return { w: window.innerWidth, h: window.innerHeight };
  };

  const startDrag = (
    e: React.PointerEvent<HTMLElement>,
    mode: "move" | "resize",
  ) => {
    e.stopPropagation();
    e.preventDefault();
    didDragRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const { w, h } = getParentDimensions(e.currentTarget as HTMLElement);
    dragRef.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startItemX: item.x,
      startItemY: item.y,
      startItemW: item.width,
      startItemH: item.height,
      parentW: w,
      parentH: h,
      mode,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    const d = dragRef.current;
    const dx = (e.clientX - d.startClientX) / d.parentW;
    const dy = (e.clientY - d.startClientY) / d.parentH;

    if (Math.abs(dx) > 0.002 || Math.abs(dy) > 0.002) {
      didDragRef.current = true;
    }

    if (d.mode === "move") {
      onUpdate({
        x: Math.max(0, Math.min(1 - item.width, d.startItemX + dx)),
        y: Math.max(0, Math.min(1 - item.height, d.startItemY + dy)),
      });
    } else {
      onUpdate({
        width: Math.max(0.05, d.startItemW + dx),
        height: Math.max(0.02, d.startItemH + dy),
      });
    }
  };

  const handlePointerUp = () => {
    if (dragRef.current) {
      dragRef.current = null;
      onDragEnd?.();
    }
  };

  const renderContent = () => {
    switch (item.type) {
      case "signature":
      case "initial":
        return (
          <img
            src={item.content}
            alt={item.type}
            className="w-full h-full object-contain no-select pointer-events-none"
            draggable={false}
          />
        );
      case "datetime":
        return (
          <span
            className="text-foreground no-select pointer-events-none"
            style={{
              fontSize: "clamp(8px, 1.8vh, 14px)",
              fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            {item.content}
          </span>
        );
      case "stamp": {
        const color = stampColors[item.content] ?? "#DC2626";
        return (
          <div
            className="w-full h-full flex items-center justify-center no-select pointer-events-none"
            style={{ border: `2px solid ${color}`, borderRadius: "3px" }}
          >
            <span
              className="font-bold tracking-widest"
              style={{
                color,
                fontSize: "clamp(9px, 1.6vh, 13px)",
                letterSpacing: "0.15em",
              }}
            >
              {item.content}
            </span>
          </div>
        );
      }
      case "text":
        return null;
    }
  };

  const isText = item.type === "text";

  const sharedOutlineClass = isSelected
    ? "outline outline-2 outline-offset-1 outline-primary/70"
    : "";

  return (
    <div
      style={{
        position: "absolute",
        left: `${item.x * 100}%`,
        top: `${item.y * 100}%`,
        width: `${item.width * 100}%`,
        height: `${item.height * 100}%`,
        zIndex: isSelected ? 10 : 5,
        boxSizing: "border-box",
      }}
    >
      {isText ? (
        /* Text overlay: draggable container with inline-editable textarea */
        <div
          className={`no-select ${sharedOutlineClass}`}
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "transparent",
            cursor: "grab",
            touchAction: "none",
          }}
          role="presentation"
          onPointerDown={(e) => {
            // Don't start drag if clicking the textarea itself
            if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
            startDrag(e, "move");
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={(e) => {
            if (!didDragRef.current) onSelect(e);
          }}
          onKeyDown={() => {}}
        >
          {/* Textarea */}
          <textarea
            value={item.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            onClick={(e) => e.stopPropagation()}
            onKeyUp={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onFocus={(e) => e.stopPropagation()}
            onBlur={() => onTextBlur?.()}
            placeholder="Type here"
            style={{
              flex: 1,
              width: "100%",
              height: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              overflow: "hidden",
              padding: "2px 4px",
              boxSizing: "border-box",
              fontSize: item.fontSize ?? 14,
              color: item.fontColor ?? "#000000",
              fontFamily: item.fontFamily ?? "Arial",
              lineHeight: 1.3,
              cursor: "text",
              caretColor: item.fontColor ?? "#000000",
              pointerEvents: isSelected ? "auto" : "none",
            }}
            data-ocid="overlay.editor"
          />
        </div>
      ) : (
        /* Non-text: button wrapper */
        <button
          type="button"
          aria-label={`${item.type} element`}
          style={{
            cursor: "grab",
            width: "100%",
            height: "100%",
            padding: 0,
            background: "none",
            border: "none",
            display: "block",
          }}
          className={`no-select ${sharedOutlineClass}`}
          onClick={onSelect}
          onPointerDown={(e) => startDrag(e, "move")}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {renderContent()}
        </button>
      )}

      {/* Delete button */}
      {isSelected && (
        <button
          type="button"
          aria-label="Delete element"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-3 -right-3 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-md z-20 hover:scale-110 transition-transform"
          data-ocid="overlay.delete_button"
        >
          <X className="w-3 h-3" />
        </button>
      )}

      {/* Resize handle */}
      {isSelected && (
        <button
          type="button"
          aria-label="Resize element"
          onPointerDown={(e) => {
            e.stopPropagation();
            startDrag(e, "resize");
          }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary rounded-sm z-20 flex items-center justify-center p-0 border-0"
          style={{ cursor: "se-resize" }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            aria-hidden="true"
          >
            <title>Resize</title>
            <path
              d="M1 7L7 1M4 7L7 4"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
