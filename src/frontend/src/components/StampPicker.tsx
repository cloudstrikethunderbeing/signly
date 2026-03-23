import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface Props {
  onSelect: (text: string) => void;
  onClose: () => void;
}

const stamps = [
  { text: "SIGNED", color: "#DC2626", borderColor: "#DC2626" },
  { text: "APPROVED", color: "#16A34A", borderColor: "#16A34A" },
  { text: "DATED", color: "#1D4ED8", borderColor: "#1D4ED8" },
];

export default function StampPicker({ onSelect, onClose }: Props) {
  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
        role="presentation"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative bg-white w-full max-w-sm rounded-t-2xl md:rounded-2xl shadow-2xl p-5"
          onClick={(e) => e.stopPropagation()}
          data-ocid="stamp.modal"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Choose a Stamp</h2>
            <button
              type="button"
              data-ocid="stamp.close_button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stamps.map((stamp, i) => (
              <button
                type="button"
                key={stamp.text}
                data-ocid={`stamp.item.${i + 1}`}
                onClick={() => onSelect(stamp.text)}
                className="flex flex-col items-center justify-center p-3 rounded-xl border-2 hover:bg-secondary/20 transition-all active:scale-95"
                style={{ borderColor: stamp.borderColor }}
              >
                <div
                  className="border-2 rounded px-2 py-1 font-bold text-sm tracking-widest"
                  style={{ color: stamp.color, borderColor: stamp.borderColor }}
                >
                  {stamp.text}
                </div>
                <span className="text-xs text-muted-foreground mt-2">
                  {stamp.text}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
