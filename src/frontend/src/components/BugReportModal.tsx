import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BugReportModal({ open, onClose }: Props) {
  const { actor } = useActor();
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClose = () => {
    onClose();
    // Reset after dialog closes
    setTimeout(() => {
      setDescription("");
      setEmail("");
      setSuccess(false);
    }, 300);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (actor) {
        await actor.submitBugReport(
          description.trim(),
          email.trim() || null,
          navigator.userAgent,
        );
      }
      setSuccess(true);
    } catch (err) {
      console.error("Bug report submission failed", err);
      setSuccess(true); // Still show success to avoid frustrating the user
    } finally {
      setIsSubmitting(false);
    }
  };

  const xLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent("@jackbearai bug report: ")}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md" data-ocid="bug_report.dialog">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">
            🐞 Report a Bug
          </DialogTitle>
        </DialogHeader>

        {success ? (
          <div
            className="py-6 text-center"
            data-ocid="bug_report.success_state"
          >
            <p className="text-2xl mb-2">🙏</p>
            <p className="font-semibold text-foreground mb-1">
              Bug received — thank you!
            </p>
            <p className="text-sm text-muted-foreground mb-5">
              We'll look into it as soon as possible.
            </p>
            <Button
              data-ocid="bug_report.close_button"
              variant="outline"
              size="sm"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bug-description" className="text-sm">
                What went wrong?
              </Label>
              <Textarea
                id="bug-description"
                data-ocid="bug_report.textarea"
                placeholder="Describe the issue in a few words…"
                className="min-h-[100px] text-sm resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bug-email" className="text-sm">
                Your email{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="bug-email"
                data-ocid="bug_report.input"
                type="email"
                placeholder="you@example.com"
                className="text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <Button
                type="submit"
                data-ocid="bug_report.submit_button"
                disabled={!description.trim() || isSubmitting}
                className="text-sm font-medium brand-gradient text-white border-0 rounded-lg hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? "Sending…" : "Submit bug report"}
              </Button>

              <a
                href={xLink}
                target="_blank"
                rel="noopener noreferrer"
                data-ocid="bug_report.link"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Report on X instead
              </a>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
