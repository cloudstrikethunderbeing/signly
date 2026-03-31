import { Toaster } from "@/components/ui/sonner";
import { useEffect, useState } from "react";
import SigningWorkspace from "./components/SigningWorkspace";
import UploadScreen from "./components/UploadScreen";
import { useActor } from "./hooks/useActor";

export interface OverlayItem {
  id: string;
  type: "signature" | "initial" | "datetime" | "stamp" | "text";
  pageIndex: number;
  x: number; // % of page width (0–1)
  y: number; // % of page height (0–1)
  width: number; // % of page width
  height: number; // % of page height
  content: string; // dataUrl for sig/initial, text for datetime/stamp/text
  fontSize?: number; // default 14, for text type
  fontColor?: string; // default "#000000", for text type
  fontFamily?: string; // default "Arial", for text type
}

function RatingStructuredData() {
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (isFetching || !actor) return;
    (async () => {
      try {
        const [avg, count] = await Promise.all([
          actor.getAverageRating(),
          actor.getRatingCount(),
        ]);
        const reviewCount = Number(count);
        if (reviewCount < 5) return;
        const ld = {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "Signly",
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avg.toFixed(1),
            reviewCount,
          },
        };
        let script = document.getElementById(
          "signly-rating-ld",
        ) as HTMLScriptElement | null;
        if (!script) {
          script = document.createElement("script");
          script.id = "signly-rating-ld";
          script.type = "application/ld+json";
          document.head.appendChild(script);
        }
        script.textContent = JSON.stringify(ld);
      } catch {
        // Silent — never affect the app
      }
    })();
  }, [actor, isFetching]);

  return null;
}

export default function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);

  const handleFileSelect = (file: File, bytes: ArrayBuffer) => {
    setPdfFile(file);
    setPdfBytes(bytes);
  };

  const handleNewDocument = () => {
    setPdfFile(null);
    setPdfBytes(null);
  };

  return (
    <>
      <RatingStructuredData />
      {!pdfFile || !pdfBytes ? (
        <UploadScreen onFileSelect={handleFileSelect} />
      ) : (
        <SigningWorkspace
          pdfFile={pdfFile}
          pdfBytes={pdfBytes}
          onNewDocument={handleNewDocument}
        />
      )}
      <Toaster position="top-center" />
    </>
  );
}
