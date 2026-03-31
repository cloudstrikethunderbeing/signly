import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type CopyState = "idle" | "copied";

const PAYMENT_OPTIONS = [
  {
    label: "ICP / ckBTC / ckUSDC",
    value: "pkt5m-vzera-uztne-or4se-vgejr-xajuz-ulw55-zdxon-3euz7-gvakp-5qe",
    isLink: false,
  },
  {
    label: "ETH / USDC",
    value: "0xdE563904A73fD96Ca3c2dcC2EeA290659E448cD2",
    isLink: false,
  },
  {
    label: "BTC",
    value: "bc1qp0dgwesnug7yuwx93hrgyjj2gxtx7cww5x7z2e",
    isLink: false,
  },
  {
    label: "PayPal",
    value: "paypal.me/justinjackbear",
    href: "https://paypal.me/justinjackbear",
    isLink: true,
  },
];

export default function TipDeveloper() {
  const [expanded, setExpanded] = useState(false);
  const [copyStates, setCopyStates] = useState<Record<string, CopyState>>({});

  const handleCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStates((prev) => ({ ...prev, [key]: "copied" }));
      setTimeout(() => {
        setCopyStates((prev) => ({ ...prev, [key]: "idle" }));
      }, 2000);
    } catch {
      // silent fallback
    }
  };

  return (
    <div
      id="tip-section"
      className="rounded-xl border border-border bg-muted/40 overflow-hidden"
      data-ocid="tip.card"
    >
      {/* Collapsed header — always visible */}
      <div className="px-4 py-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground/80">
            Support Signly ☕
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Free. Private. No accounts. If this saved you time, support the dev.
          </p>
        </div>
        {!expanded && (
          <Button
            data-ocid="tip.open_modal_button"
            variant="outline"
            size="sm"
            className="shrink-0 text-xs h-8 px-3"
            onClick={() => setExpanded(true)}
          >
            Buy me a coffee
          </Button>
        )}
        {expanded && (
          <Button
            data-ocid="tip.close_button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-xs h-8 px-2 text-muted-foreground"
            onClick={() => setExpanded(false)}
          >
            ✕
          </Button>
        )}
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            key="tip-expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/50 pt-3 flex flex-col gap-3">
              {PAYMENT_OPTIONS.map((opt) => (
                <div key={opt.label} className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-foreground/70">
                    {opt.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      {opt.isLink ? (
                        <a
                          href={opt.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary font-mono flex items-center gap-1 hover:underline"
                          title={opt.value}
                          data-ocid="tip.link"
                        >
                          <span className="truncate">{opt.value}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      ) : (
                        <span
                          className="text-xs font-mono text-foreground/70 break-all block"
                          title={opt.value}
                        >
                          {opt.value}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(opt.value, opt.label)}
                      className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Copy"
                      data-ocid="tip.button"
                    >
                      {copyStates[opt.label] === "copied" ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-border/40 pt-2">
                <p className="text-xs font-semibold text-foreground/70 mb-1">
                  Tip with Internet Identity ⚡
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  On-chain tipping via Internet Identity is coming soon. Use the
                  addresses above to tip directly on-chain.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
