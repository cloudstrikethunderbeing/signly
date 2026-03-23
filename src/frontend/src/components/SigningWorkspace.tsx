import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { toast } from "sonner";
import type { OverlayItem } from "../App";
import { exportSignedPdf } from "../utils/pdfExport";
import OverlayElement from "./OverlayElement";
import SignatureModal from "./SignatureModal";
import StampPicker from "./StampPicker";
import Toolbar from "./Toolbar";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Use Vite's ?worker&inline to bundle the PDF.js worker directly into the
// main JS bundle as a data URL. This makes zero network requests for the
// worker, completely bypassing server MIME type restrictions.
import PDFWorker from "pdfjs-dist/build/pdf.worker.min.mjs?worker&inline";

let workerInitialized = false;

function initWorker() {
  if (workerInitialized) return;
  workerInitialized = true;
  try {
    // @ts-ignore – workerPort accepts a Worker instance
    pdfjs.GlobalWorkerOptions.workerPort = new PDFWorker();
  } catch (e) {
    console.error("Failed to init PDF worker", e);
  }
}

type ActiveTool = "signature" | "initial" | "datetime" | "stamp" | null;

interface PageDimension {
  width: number;
  height: number;
}

interface Props {
  pdfFile: File;
  pdfBytes: ArrayBuffer;
  onNewDocument: () => void;
}

export default function SigningWorkspace({
  pdfFile,
  pdfBytes,
  onNewDocument,
}: Props) {
  const [numPages, setNumPages] = useState(0);
  const [pageDimensions, setPageDimensions] = useState<PageDimension[]>([]);
  const [overlays, setOverlays] = useState<OverlayItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [pendingContent, setPendingContent] = useState<string>("");
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureModalMode, setSignatureModalMode] = useState<
    "signature" | "initial"
  >("signature");
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pdfUrl = useRef<string>(URL.createObjectURL(pdfFile)).current;

  useEffect(() => {
    initWorker();
  }, []);

  const handleDocumentLoad = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPageDimensions(new Array(n).fill({ width: 0, height: 0 }));
  };

  const handlePageRenderSuccess = useCallback(
    (pageIndex: number, page: { width: number; height: number }) => {
      setPageDimensions((prev) => {
        const next = [...prev];
        next[pageIndex] = { width: page.width, height: page.height };
        return next;
      });
    },
    [],
  );

  const enterPlacementMode = (tool: ActiveTool, content: string) => {
    setActiveTool(tool);
    setPendingContent(content);
    setIsPlacementMode(true);
    setSelectedId(null);
  };

  const handleToolSelect = (tool: ActiveTool) => {
    setSelectedId(null);
    if (tool === "signature" || tool === "initial") {
      setSignatureModalMode(tool);
      setShowSignatureModal(true);
      setActiveTool(tool);
    } else if (tool === "datetime") {
      const now = new Date();
      const content = `${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}, ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
      enterPlacementMode("datetime", content);
      toast("Tap on the document to place the date/time stamp", { icon: "📅" });
    } else if (tool === "stamp") {
      setActiveTool("stamp");
      setShowStampPicker(true);
    } else {
      setActiveTool(null);
      setIsPlacementMode(false);
    }
  };

  const handleSignatureSave = (dataUrl: string) => {
    setShowSignatureModal(false);
    enterPlacementMode(activeTool, dataUrl);
    toast(
      activeTool === "signature"
        ? "Tap on the document to place your signature"
        : "Tap on the document to place your initials",
      { icon: "✍️" },
    );
  };

  const handleStampSelect = (text: string) => {
    setShowStampPicker(false);
    enterPlacementMode("stamp", text);
    toast("Tap on the document to place the stamp", { icon: "🔖" });
  };

  const defaultSizes: Record<string, { w: number; h: number }> = {
    signature: { w: 0.25, h: 0.08 },
    initial: { w: 0.12, h: 0.06 },
    datetime: { w: 0.38, h: 0.045 },
    stamp: { w: 0.22, h: 0.09 },
  };

  const handlePageClick = (
    e: React.MouseEvent<HTMLDivElement>,
    pageIndex: number,
  ) => {
    if (!isPlacementMode || !activeTool || !pendingContent) return;
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    const size = defaultSizes[activeTool] ?? { w: 0.2, h: 0.08 };
    const newItem: OverlayItem = {
      id: `${activeTool}-${Date.now()}`,
      type: activeTool,
      pageIndex,
      x: Math.max(0, xPct - size.w / 2),
      y: Math.max(0, yPct - size.h / 2),
      width: size.w,
      height: size.h,
      content: pendingContent,
    };

    setOverlays((prev) => [...prev, newItem]);
    setSelectedId(newItem.id);
    setIsPlacementMode(false);
    setActiveTool(null);
    setPendingContent("");
  };

  const handleOverlayUpdate = (id: string, updates: Partial<OverlayItem>) => {
    setOverlays((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    );
  };

  const handleOverlayDelete = (id: string) => {
    setOverlays((prev) => prev.filter((o) => o.id !== id));
    setSelectedId(null);
  };

  const handleDownload = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportSignedPdf(pdfBytes, overlays, pageDimensions);
      toast.success("Signed PDF downloaded!");
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const getPageWidth = () => {
    if (typeof window === "undefined") return 600;
    return Math.min(window.innerWidth - 48, 800);
  };

  const overlaysForPage = (pageIndex: number) =>
    overlays.filter((o) => o.pageIndex === pageIndex);

  const pageNumbers = Array.from({ length: numPages }, (_, i) => i);

  return (
    <div
      className="h-screen flex flex-col md:flex-row bg-background overflow-hidden"
      role="presentation"
      onClick={() => setSelectedId(null)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setSelectedId(null);
      }}
    >
      <Toolbar
        activeTool={activeTool}
        isPlacementMode={isPlacementMode}
        isExporting={isExporting}
        onToolSelect={handleToolSelect}
        onDownload={handleDownload}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-border shadow-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 brand-gradient rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-foreground text-lg">Signly</span>
          </div>
          <div className="flex items-center gap-2">
            {isPlacementMode && (
              <span className="hidden sm:block text-xs text-muted-foreground bg-secondary/60 px-3 py-1 rounded-full animate-pulse">
                Tap the document to place
              </span>
            )}
            <Button
              data-ocid="workspace.secondary_button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onNewDocument();
              }}
              className="text-xs"
            >
              New Document
            </Button>
          </div>
        </header>

        <main
          className="flex-1 overflow-y-auto pb-20 md:pb-6 px-4 md:px-8"
          role="presentation"
          onClick={(e) => {
            if (!isPlacementMode) setSelectedId(null);
            e.stopPropagation();
          }}
          onKeyDown={() => {}}
        >
          {isPlacementMode && (
            <div className="sticky top-2 z-10 flex justify-center mb-2">
              <div className="bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-full shadow-md animate-fade-in">
                ✍️ Tap on the document to place it
              </div>
            </div>
          )}

          {numPages === 0 && (
            <div
              className="flex justify-center items-center py-20"
              data-ocid="workspace.loading_state"
            >
              <div className="text-muted-foreground text-sm">
                Loading document…
              </div>
            </div>
          )}

          <div className="flex flex-col items-center gap-4 py-4">
            <Document
              file={pdfUrl}
              onLoadSuccess={handleDocumentLoad}
              onLoadError={(err) => {
                console.error(err);
                toast.error("Failed to load PDF.");
              }}
              loading={null}
            >
              {pageNumbers.map((i) => (
                <div
                  key={`page-${i}`}
                  ref={(el) => {
                    if (el) pageRefs.current.set(i, el);
                  }}
                  className={`relative bg-white shadow-page rounded-sm overflow-hidden ${
                    isPlacementMode ? "cursor-crosshair" : "cursor-default"
                  }`}
                  style={{ marginBottom: "16px" }}
                  role="presentation"
                  onClick={(e) => handlePageClick(e, i)}
                  onKeyDown={() => {}}
                  data-ocid={`workspace.item.${i + 1}`}
                >
                  <Page
                    pageNumber={i + 1}
                    width={getPageWidth()}
                    renderAnnotationLayer={false}
                    renderTextLayer={false}
                    onRenderSuccess={(page) =>
                      handlePageRenderSuccess(i, {
                        width: page.width,
                        height: page.height,
                      })
                    }
                  />
                  {overlaysForPage(i).map((overlay, idx) => (
                    <OverlayElement
                      key={overlay.id}
                      item={overlay}
                      isSelected={selectedId === overlay.id}
                      onSelect={(e) => {
                        e.stopPropagation();
                        setSelectedId(overlay.id);
                      }}
                      onUpdate={(updates) =>
                        handleOverlayUpdate(overlay.id, updates)
                      }
                      onDelete={() => handleOverlayDelete(overlay.id)}
                      data-ocid={`overlay.item.${idx + 1}`}
                    />
                  ))}
                </div>
              ))}
            </Document>
          </div>
        </main>
      </div>

      {showSignatureModal && (
        <SignatureModal
          mode={signatureModalMode}
          onSave={handleSignatureSave}
          onClose={() => {
            setShowSignatureModal(false);
            setActiveTool(null);
          }}
        />
      )}

      {showStampPicker && (
        <StampPicker
          onSelect={handleStampSelect}
          onClose={() => {
            setShowStampPicker(false);
            setActiveTool(null);
          }}
        />
      )}
    </div>
  );
}
