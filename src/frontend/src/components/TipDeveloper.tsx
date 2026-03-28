import { Button } from "@/components/ui/button";
import { Check, Copy, ExternalLink } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

type CopyState = "idle" | "copied";
type IcpTipState =
  | "idle"
  | "selecting"
  | "confirming"
  | "sending"
  | "success"
  | "error";

const RECIPIENT_PRINCIPAL =
  "pkt5m-vzera-uztne-or4se-vgejr-xajuz-ulw55-zdxon-3euz7-gvakp-5qe";

// ICRC-1 mainnet canister IDs
const CKUSDC_CANISTER = "xevnm-gaaaa-aaaar-qafnq-cai";
const CKBTC_CANISTER = "mxzaz-hqaaa-aaaar-qaada-cai";

const PAYMENT_OPTIONS = [
  {
    label: "ICP (ckBTC / ckUSDC)",
    value: RECIPIENT_PRINCIPAL,
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
  { label: "PayPal", value: "https://paypal.me/justinjackbear", isLink: true },
];

const TIP_AMOUNTS = [
  { label: "$1", sublabel: "ckUSDC", type: "ckUSDC" as const, amount: 1 },
  { label: "$5", sublabel: "ckUSDC", type: "ckUSDC" as const, amount: 5 },
  { label: "$10", sublabel: "ckUSDC", type: "ckUSDC" as const, amount: 10 },
  {
    label: "0.0001 BTC",
    sublabel: "ckBTC",
    type: "ckBTC" as const,
    amount: 0.0001,
  },
];

type TipOption = (typeof TIP_AMOUNTS)[number];

async function sendIcrcTransfer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  identity: any,
  tipOption: TipOption,
): Promise<void> {
  // Lazy-load heavy ICP libs
  const [{ HttpAgent, Actor }, { IDL }, { Principal }] = await Promise.all([
    import("@dfinity/agent"),
    import("@dfinity/candid"),
    import("@dfinity/principal"),
  ]);

  const canisterId =
    tipOption.type === "ckUSDC" ? CKUSDC_CANISTER : CKBTC_CANISTER;

  // Convert human amounts to smallest units
  // ckUSDC: 6 decimals  ($1 = 1_000_000)
  // ckBTC:  8 decimals  (0.0001 BTC = 10_000)
  const rawAmount =
    tipOption.type === "ckUSDC"
      ? BigInt(Math.round(tipOption.amount * 1_000_000))
      : BigInt(Math.round(tipOption.amount * 100_000_000));

  const agent = await HttpAgent.create({
    identity,
    host: "https://icp-api.io",
  });

  // Minimal ICRC-1 interface
  const icrc1Idl = ({ IDL: I }: { IDL: typeof IDL }) => {
    const Account = I.Record({
      owner: I.Principal,
      subaccount: I.Opt(I.Vec(I.Nat8)),
    });
    const TransferArg = I.Record({
      from_subaccount: I.Opt(I.Vec(I.Nat8)),
      to: Account,
      amount: I.Nat,
      fee: I.Opt(I.Nat),
      memo: I.Opt(I.Vec(I.Nat8)),
      created_at_time: I.Opt(I.Nat64),
    });
    const TransferError = I.Variant({
      BadFee: I.Record({ expected_fee: I.Nat }),
      BadBurn: I.Record({ min_burn_amount: I.Nat }),
      InsufficientFunds: I.Record({ balance: I.Nat }),
      TooOld: I.Null,
      CreatedInFuture: I.Record({ ledger_time: I.Nat64 }),
      Duplicate: I.Record({ duplicate_of: I.Nat }),
      TemporarilyUnavailable: I.Null,
      GenericError: I.Record({ error_code: I.Nat, message: I.Text }),
    });
    return I.Service({
      icrc1_transfer: I.Func(
        [TransferArg],
        [I.Variant({ Ok: I.Nat, Err: TransferError })],
        [],
      ),
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actor = Actor.createActor(icrc1Idl as any, { agent, canisterId });

  const result = (await actor.icrc1_transfer({
    from_subaccount: [],
    to: {
      owner: Principal.fromText(RECIPIENT_PRINCIPAL),
      subaccount: [],
    },
    amount: rawAmount,
    fee: [],
    memo: [],
    created_at_time: [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  })) as any;

  if ("Err" in result) {
    const errKey = Object.keys(result.Err)[0];
    const errVal = result.Err[errKey];
    if (errKey === "InsufficientFunds") {
      throw new Error(
        `Insufficient funds. Balance: ${
          tipOption.type === "ckUSDC"
            ? `${(Number(errVal.balance) / 1_000_000).toFixed(2)} ckUSDC`
            : `${(Number(errVal.balance) / 100_000_000).toFixed(8)} ckBTC`
        }`,
      );
    }
    if (errKey === "BadFee") {
      throw new Error(
        `Unexpected fee required: ${errVal.expected_fee.toString()}`,
      );
    }
    throw new Error(`Transfer failed: ${errKey}`);
  }
}

export default function TipDeveloper() {
  const [expanded, setExpanded] = useState(false);
  const [copyStates, setCopyStates] = useState<Record<string, CopyState>>({});
  const [icpTipState, setIcpTipState] = useState<IcpTipState>("idle");
  const [selectedTip, setSelectedTip] = useState<TipOption | null>(null);
  const [icpError, setIcpError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [identity, setIdentity] = useState<any>(null);

  const handleCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyStates((prev) => ({ ...prev, [key]: "copied" }));
      setTimeout(() => {
        setCopyStates((prev) => ({ ...prev, [key]: "idle" }));
      }, 2000);
    } catch {
      // fallback silent
    }
  };

  const handleIcpTip = async () => {
    try {
      setIcpTipState("selecting");
      setIcpError(null);
      setSelectedTip(null);
      const { AuthClient } = await import("@dfinity/auth-client");
      const client = await AuthClient.create();
      await new Promise<void>((resolve, reject) => {
        client.login({
          identityProvider: "https://identity.ic0.app",
          onSuccess: () => resolve(),
          onError: (err) => reject(new Error(err ?? "Login failed")),
        });
      });
      setIdentity(client.getIdentity());
    } catch (err) {
      setIcpError(err instanceof Error ? err.message : "Authentication failed");
      setIcpTipState("error");
    }
  };

  const handleConfirmTip = async () => {
    if (!selectedTip || !identity) return;
    setIcpTipState("sending");
    try {
      await sendIcrcTransfer(identity, selectedTip);
      setIcpTipState("success");
    } catch (err) {
      setIcpError(
        err instanceof Error
          ? err.message
          : "Transfer failed. Please try again.",
      );
      setIcpTipState("error");
    }
  };

  const handleRetry = () => {
    setIcpTipState("idle");
    setIcpError(null);
    setSelectedTip(null);
    setIdentity(null);
  };

  return (
    <div
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
            <div className="px-4 pb-4 border-t border-border/50 pt-3 flex flex-col gap-2">
              {PAYMENT_OPTIONS.map((opt) => (
                <div key={opt.label} className="flex items-center gap-2 py-1.5">
                  <span className="text-xs font-medium text-muted-foreground w-28 shrink-0">
                    {opt.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    {opt.isLink ? (
                      <a
                        href={opt.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary font-mono flex items-center gap-1 hover:underline truncate"
                        title={opt.value}
                        data-ocid="tip.link"
                      >
                        <span className="truncate">{opt.value}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span
                        className="text-xs font-mono text-foreground/70 truncate block"
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
              ))}

              {/* Divider */}
              <div className="border-t border-border/40 my-1" />

              {/* ICP native tip */}
              {icpTipState === "idle" && (
                <Button
                  data-ocid="tip.secondary_button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-9 border-dashed"
                  onClick={handleIcpTip}
                >
                  Tip with Internet Identity ⚡
                </Button>
              )}

              {icpTipState === "selecting" && !identity && (
                <div
                  className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground"
                  data-ocid="tip.loading_state"
                >
                  <svg
                    className="animate-spin w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <title>Connecting</title>
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
                  Connecting to Internet Identity…
                </div>
              )}

              {icpTipState === "selecting" && identity && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-2"
                >
                  <p className="text-xs text-muted-foreground">
                    Choose an amount:
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {TIP_AMOUNTS.map((t) => (
                      <button
                        key={t.label}
                        type="button"
                        onClick={() => setSelectedTip(t)}
                        data-ocid="tip.toggle"
                        className={`flex flex-col items-center justify-center rounded-lg border px-2 py-2 text-xs transition-all ${
                          selectedTip?.label === t.label
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border hover:border-primary/50 text-foreground/70"
                        }`}
                      >
                        <span className="font-medium">{t.label}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {t.sublabel}
                        </span>
                      </button>
                    ))}
                  </div>
                  {selectedTip !== null && (
                    <Button
                      data-ocid="tip.confirm_button"
                      size="sm"
                      className="w-full h-9 text-xs brand-gradient text-white border-0"
                      onClick={handleConfirmTip}
                    >
                      Confirm & Send {selectedTip.label}
                    </Button>
                  )}
                  <Button
                    data-ocid="tip.cancel_button"
                    variant="ghost"
                    size="sm"
                    className="w-full h-8 text-xs text-muted-foreground"
                    onClick={handleRetry}
                  >
                    Cancel
                  </Button>
                </motion.div>
              )}

              {icpTipState === "sending" && (
                <div
                  className="flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground"
                  data-ocid="tip.loading_state"
                >
                  <svg
                    className="animate-spin w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <title>Sending</title>
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
                  Sending {selectedTip?.label} {selectedTip?.sublabel}…
                </div>
              )}

              {icpTipState === "success" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-3"
                  data-ocid="tip.success_state"
                >
                  <p className="text-sm font-medium text-green-600">
                    Sent! Thank you ❤️
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your support means a lot.
                  </p>
                </motion.div>
              )}

              {icpTipState === "error" && (
                <div
                  className="flex flex-col gap-1.5"
                  data-ocid="tip.error_state"
                >
                  <p className="text-xs text-destructive">
                    {icpError ?? "Something went wrong."}
                  </p>
                  <Button
                    data-ocid="tip.secondary_button"
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs"
                    onClick={handleRetry}
                  >
                    Try again
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
