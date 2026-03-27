import { Baseline, Clock, Download, PenLine, Stamp, Type } from "lucide-react";
import { motion } from "motion/react";

export type ActiveTool =
  | "signature"
  | "initial"
  | "datetime"
  | "stamp"
  | "text"
  | null;

interface Props {
  activeTool: ActiveTool;
  isPlacementMode: boolean;
  isExporting: boolean;
  onToolSelect: (tool: ActiveTool) => void;
  onDownload: () => void;
}

const tools = [
  { id: "signature" as const, icon: PenLine, label: "Signature" },
  { id: "initial" as const, icon: Type, label: "Initial" },
  { id: "datetime" as const, icon: Clock, label: "Date/Time" },
  { id: "stamp" as const, icon: Stamp, label: "Stamp" },
  { id: "text" as const, icon: Baseline, label: "Text" },
];

function SpinnerSvg() {
  return (
    <svg
      className="animate-spin w-5 h-5"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <title>Loading</title>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        strokeOpacity="0.3"
      />
      <path
        d="M12 2a10 10 0 0110 10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Toolbar({
  activeTool,
  isPlacementMode,
  isExporting,
  onToolSelect,
  onDownload,
}: Props) {
  return (
    <>
      {/* Mobile: fixed bottom bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-20 brand-gradient shadow-toolbar"
        data-ocid="toolbar.panel"
      >
        <div className="flex items-center justify-around px-2 py-2">
          {tools.map(({ id, icon: Icon, label }) => {
            const isActive = activeTool === id;
            return (
              <button
                type="button"
                key={id}
                data-ocid={`toolbar.${id}.button`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToolSelect(id);
                }}
                className={`flex flex-col items-center gap-1 min-w-[48px] min-h-[56px] justify-center rounded-xl transition-all ${
                  isActive
                    ? "bg-white/25 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </button>
            );
          })}
          <button
            type="button"
            data-ocid="toolbar.download.button"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            disabled={isExporting}
            className="flex flex-col items-center gap-1 min-w-[48px] min-h-[56px] justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-50"
          >
            {isExporting ? <SpinnerSvg /> : <Download className="w-5 h-5" />}
            <span className="text-[10px] font-medium">Download</span>
          </button>
        </div>
      </nav>

      {/* Desktop: left sidebar */}
      <nav
        className="hidden md:flex flex-col items-center py-5 gap-2 brand-gradient w-20 flex-shrink-0"
        data-ocid="toolbar.panel"
      >
        {/* Logo mark */}
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3 border border-white/20">
          <span className="text-white font-bold text-sm">S</span>
        </div>

        <div className="flex flex-col gap-1 flex-1 w-full px-2">
          {tools.map(({ id, icon: Icon, label }) => {
            const isActive = activeTool === id;
            return (
              <motion.button
                type="button"
                key={id}
                data-ocid={`toolbar.${id}.button`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onToolSelect(id);
                }}
                className={`flex flex-col items-center gap-1 py-3 rounded-xl w-full transition-all ${
                  isActive
                    ? "bg-white/25 text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                } ${isActive && isPlacementMode ? "ring-2 ring-white/50" : ""}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Download at bottom */}
        <div className="w-full px-2 mt-auto">
          <motion.button
            type="button"
            data-ocid="toolbar.download.button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            disabled={isExporting}
            className="flex flex-col items-center gap-1 py-3 rounded-xl w-full bg-white/20 text-white hover:bg-white/30 transition-all disabled:opacity-50"
          >
            {isExporting ? <SpinnerSvg /> : <Download className="w-5 h-5" />}
            <span className="text-[9px] font-medium">Download</span>
          </motion.button>
        </div>
      </nav>
    </>
  );
}
