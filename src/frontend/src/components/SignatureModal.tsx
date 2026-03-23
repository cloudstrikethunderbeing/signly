import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, RotateCcw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";

interface Props {
  mode: "signature" | "initial";
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

export default function SignatureModal({ mode, onSave, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [typedText, setTypedText] = useState("");
  const [activeTab, setActiveTab] = useState<"draw" | "type">("draw");

  useEffect(() => {
    if (activeTab !== "draw" || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const container = canvas.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const w = container.clientWidth || 320;
    const h = 160;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);

    padRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgba(0,0,0,0)",
      penColor: "#1a1a2e",
      minWidth: 1,
      maxWidth: 2.5,
    });

    return () => {
      padRef.current?.off();
      padRef.current = null;
    };
  }, [activeTab]);

  const handleClear = () => {
    padRef.current?.clear();
  };

  const renderTypeToCanvas = (text: string): string => {
    const canvas = document.createElement("canvas");
    const fontSize = mode === "signature" ? 52 : 40;
    canvas.width = 400;
    canvas.height = 100;
    const ctx = canvas.getContext("2d")!;
    ctx.font = `${fontSize}px 'Dancing Script', cursive`;
    ctx.fillStyle = "#1a1a2e";
    ctx.textBaseline = "middle";
    const measured = ctx.measureText(text);
    const x = Math.max(10, (canvas.width - measured.width) / 2);
    ctx.fillText(text, x, canvas.height / 2);
    return canvas.toDataURL("image/png");
  };

  const handleSave = () => {
    if (activeTab === "draw") {
      if (!padRef.current || padRef.current.isEmpty()) return;
      onSave(padRef.current.toDataURL("image/png"));
    } else {
      if (!typedText.trim()) return;
      onSave(renderTypeToCanvas(typedText.trim()));
    }
  };

  const canSave = activeTab === "type" ? typedText.trim().length > 0 : true;

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
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="relative bg-white w-full max-w-lg rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          data-ocid="signature.modal"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 className="font-semibold text-foreground text-lg">
                {mode === "signature" ? "Add Signature" : "Add Initials"}
              </h2>
              <p className="text-muted-foreground text-xs mt-0.5">
                {mode === "signature"
                  ? "Draw or type your signature"
                  : "Draw or type your initials"}
              </p>
            </div>
            <button
              type="button"
              data-ocid="signature.close_button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-5 pb-5">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "draw" | "type")}
            >
              <TabsList className="w-full mb-4">
                <TabsTrigger
                  value="draw"
                  className="flex-1"
                  data-ocid="signature.draw.tab"
                >
                  Draw
                </TabsTrigger>
                <TabsTrigger
                  value="type"
                  className="flex-1"
                  data-ocid="signature.type.tab"
                >
                  Type
                </TabsTrigger>
              </TabsList>

              <TabsContent value="draw">
                <div className="border-2 border-border rounded-xl overflow-hidden bg-white">
                  <canvas
                    ref={canvasRef}
                    className="block w-full touch-none"
                    style={{ height: "160px" }}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Draw your {mode === "signature" ? "signature" : "initials"}{" "}
                  above
                </p>
              </TabsContent>

              <TabsContent value="type">
                <Input
                  data-ocid="signature.type.input"
                  placeholder={
                    mode === "signature"
                      ? "Type your full name"
                      : "Type your initials"
                  }
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  className="mb-3"
                />
                {typedText && (
                  <div className="border-2 border-border rounded-xl p-4 bg-gray-50 min-h-[80px] flex items-center justify-center">
                    <span
                      className="font-signature text-foreground"
                      style={{
                        fontSize: mode === "signature" ? "2.5rem" : "2rem",
                      }}
                    >
                      {typedText}
                    </span>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              {activeTab === "draw" && (
                <Button
                  data-ocid="signature.clear_button"
                  variant="outline"
                  onClick={handleClear}
                  className="flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </Button>
              )}
              <Button
                data-ocid="signature.save_button"
                onClick={handleSave}
                disabled={!canSave}
                className="flex-1 brand-gradient text-white border-0 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Use {mode === "signature" ? "Signature" : "Initials"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
