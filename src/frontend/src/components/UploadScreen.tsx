import { Button } from "@/components/ui/button";
import { FileText, Lock, Shield, Upload, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

interface Props {
  onFileSelect: (file: File, bytes: ArrayBuffer) => void;
}

export default function UploadScreen({ onFileSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        toast.error("Please upload a PDF file.");
        return;
      }
      setIsLoading(true);
      try {
        const bytes = await file.arrayBuffer();
        onFileSelect(file, bytes);
      } catch {
        toast.error("Failed to read file. Please try again.");
        setIsLoading(false);
      }
    },
    [onFileSelect],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const features = [
    { icon: Zap, text: "Sign in seconds" },
    { icon: Shield, text: "100% private" },
    { icon: Lock, text: "No account needed" },
  ];

  return (
    <div className="min-h-screen brand-gradient flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10 text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-3">
          <img
            src="/assets/uploads/signly-019d2e87-2375-704f-8372-0ce142d03f42-1.png"
            alt="Signly"
            fetchPriority="high"
            decoding="sync"
            className="h-40 w-auto object-contain rounded-xl"
            style={{ imageRendering: "auto" }}
          />
        </div>
        <p className="text-white/70 text-sm font-medium tracking-wide uppercase">
          Free · Private · Instant
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Upload your document
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Sign documents in seconds. Free. Private. No account needed.
          </p>

          {/* Drop zone — using label so it natively activates the file input */}
          <label
            htmlFor="pdf-file-input"
            data-ocid="upload.dropzone"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-primary bg-secondary/40 scale-[1.01]"
                : "border-border bg-background hover:border-primary/50 hover:bg-secondary/20"
            }`}
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
                isDragging
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-primary"
              }`}
            >
              <Upload className="w-6 h-6" />
            </div>
            <p className="font-semibold text-foreground text-sm mb-1">
              {isDragging ? "Drop your PDF here" : "Tap to upload PDF"}
            </p>
            <p className="text-muted-foreground text-xs">
              or drag and drop from your desktop
            </p>
            <input
              id="pdf-file-input"
              ref={inputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
              data-ocid="upload.input"
            />
          </label>

          <Button
            data-ocid="upload.primary_button"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="w-full mt-5 h-12 text-base font-semibold brand-gradient text-white border-0 rounded-xl hover:opacity-90 transition-opacity shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
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
                Loading…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Document
              </span>
            )}
          </Button>

          <div className="flex justify-center gap-4 mt-5">
            {features.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-10 text-white/40 text-xs text-center"
      >
        © {new Date().getFullYear()}. Built with ♥ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-white/70 transition-colors"
        >
          caffeine.ai
        </a>
      </motion.p>
    </div>
  );
}
