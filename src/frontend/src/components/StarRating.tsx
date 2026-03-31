import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

export default function StarRating() {
  const { actor } = useActor();
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(
    () => !!localStorage.getItem("signly_rated"),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (submitted) {
    return (
      <div
        className="w-full rounded-xl border border-border bg-muted/40 px-5 py-4 text-center"
        data-ocid="rating.success_state"
      >
        <p className="text-sm text-muted-foreground">
          ⭐ You've already rated Signly — thanks!
        </p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (actor) {
        await actor.submitRating(BigInt(selected));
      }
      localStorage.setItem("signly_rated", "1");
      setSubmitted(true);
    } catch (e) {
      console.error("Rating submission failed", e);
      // Still mark as submitted to avoid stuck state
      localStorage.setItem("signly_rated", "1");
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full rounded-xl border border-border bg-muted/40 px-5 py-4"
      data-ocid="rating.panel"
    >
      <p className="text-sm font-semibold text-foreground mb-0.5">
        Rate Signly
      </p>
      <p className="text-xs text-muted-foreground mb-3">
        Takes 2 seconds — helps keep this free
      </p>
      <div className="flex items-center gap-1 mb-3" data-ocid="rating.toggle">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            data-ocid={`rating.item.${star}`}
            className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setSelected(star)}
            aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
          >
            <Star
              className="w-7 h-7 transition-colors"
              style={{
                fill: star <= (hovered || selected) ? "#4B1D95" : "transparent",
                stroke:
                  star <= (hovered || selected) ? "#4B1D95" : "currentColor",
                color: "#9ca3af",
              }}
            />
          </button>
        ))}
      </div>
      {selected > 0 && (
        <Button
          data-ocid="rating.submit_button"
          size="sm"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="text-xs font-medium brand-gradient text-white border-0 rounded-lg hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? "Submitting…" : "Submit rating"}
        </Button>
      )}
    </div>
  );
}
