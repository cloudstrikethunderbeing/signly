import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import SigningWorkspace from "./components/SigningWorkspace";
import UploadScreen from "./components/UploadScreen";

export interface OverlayItem {
  id: string;
  type: "signature" | "initial" | "datetime" | "stamp";
  pageIndex: number;
  x: number; // % of page width (0–1)
  y: number; // % of page height (0–1)
  width: number; // % of page width
  height: number; // % of page height
  content: string; // dataUrl for sig/initial, text for datetime/stamp
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
