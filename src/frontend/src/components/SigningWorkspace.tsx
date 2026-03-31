/// <reference types="vite/client" />
import { Button } from "@/components/ui/button";
import { Redo2, Undo2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { toast } from "sonner";
import type { OverlayItem } from "../App";
import { exportSignedPdf } from "../utils/pdfExport";
import OverlayElement from "./OverlayElement";
import SignatureModal from "./SignatureModal";
import StampPicker from "./StampPicker";
import StarRating from "./StarRating";
import TextStylePanel from "./TextStylePanel";
import TipDeveloper from "./TipDeveloper";
import Toolbar from "./Toolbar";
import type { ActiveTool } from "./Toolbar";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import PDFWorkerInline from "pdfjs-dist/build/pdf.worker.min.mjs?worker&inline";

let workerInitialized = false;

function initWorker() {
  if (workerInitialized) return;
  workerInitialized = true;
  try {
    const worker = new PDFWorkerInline();
    pdfjs.GlobalWorkerOptions.workerPort = worker as unknown as Worker;
  } catch (e) {
    console.error("Failed to init PDF worker", e);
  }
}

initWorker();

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
  const [_downloadSuccess, setDownloadSuccess] = useState(false);

  // Undo/redo history
  const [overlayHistory, setOverlayHistory] = useState<OverlayItem[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pdfUrl = useRef<string>(URL.createObjectURL(pdfFile)).current;

  const pushHistory = useCallback(
    (newOverlays: OverlayItem[]) => {
      setOverlayHistory((prev) => [
        ...prev.slice(0, historyIndex + 1),
        newOverlays,
      ]);
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex],
  );

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setOverlays(overlayHistory[newIndex]);
    setSelectedId(null);
  };

  const handleRedo = () => {
    if (historyIndex >= overlayHistory.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    setOverlays(overlayHistory[newIndex]);
    setSelectedId(null);
  };

  // Derive the currently selected overlay
  const selectedOverlay = overlays.find((o) => o.id === selectedId) ?? null;
  const showTextStylePanel =
    selectedOverlay !== null && selectedOverlay.type === "text";

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
    } else if (tool === "stamp") {
      setActiveTool("stamp");
      setShowStampPicker(true);
    } else if (tool === "text") {
      enterPlacementMode("text", "");
    } else {
      setActiveTool(null);
      setIsPlacementMode(false);
    }
  };

  const handleSignatureSave = (dataUrl: string) => {
    setShowSignatureModal(false);
    enterPlacementMode(activeTool, dataUrl);
  };

  const handleStampSelect = (text: string) => {
    setShowStampPicker(false);
    enterPlacementMode("stamp", text);
  };

  const defaultSizes: Record<string, { w: number; h: number }> = {
    signature: { w: 0.25, h: 0.08 },
    initial: { w: 0.12, h: 0.06 },
    datetime: { w: 0.38, h: 0.045 },
    stamp: { w: 0.22, h: 0.09 },
    text: { w: 0.25, h: 0.06 },
  };

  const handlePageClick = (
    e: React.MouseEvent<HTMLDivElement>,
    pageIndex: number,
  ) => {
    if (!isPlacementMode || !activeTool) return;
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width;
    const yPct = (e.clientY - rect.top) / rect.height;

    const size = defaultSizes[activeTool] ?? { w: 0.2, h: 0.08 };
    const newItem: OverlayItem = {
      id: `${activeTool}-${Date.now()}`,
      type: activeTool as OverlayItem["type"],
      pageIndex,
      x: Math.max(0, xPct - size.w / 2),
      y: Math.max(0, yPct - size.h / 2),
      width: size.w,
      height: size.h,
      content: pendingContent,
      ...(activeTool === "text" && {
        fontSize: 14,
        fontColor: "#000000",
        fontFamily: "Arial",
      }),
    };

    const newOverlays = [...overlays, newItem];
    setOverlays(newOverlays);
    pushHistory(newOverlays);
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
    const newOverlays = overlays.filter((o) => o.id !== id);
    setOverlays(newOverlays);
    pushHistory(newOverlays);
    setSelectedId(null);
  };

  const handleDragEnd = useCallback(() => {
    setOverlays((current) => {
      pushHistory(current);
      return current;
    });
  }, [pushHistory]);

  const handleTextBlur = useCallback(() => {
    setOverlays((current) => {
      pushHistory(current);
      return current;
    });
  }, [pushHistory]);

  const handleDownload = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportSignedPdf(pdfBytes, overlays, pageDimensions);
      toast.success("Signed PDF downloaded!");
      setDownloadSuccess(true);
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

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < overlayHistory.length - 1;

  return (
    <div
      className="h-screen flex flex-col md:flex-row bg-background overflow-hidden"
      role="presentation"
      onClick={() => setSelectedId(null)}
      onKeyDown={(e) => {
        if (e.key === "Escape") setSelectedId(null);
        if ((e.metaKey || e.ctrlKey) && e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) handleRedo();
          else handleUndo();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "y") {
          e.preventDefault();
          handleRedo();
        }
      }}
      tabIndex={-1}
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
          {/* Logo: same icon style as landing page — white square + dark purple SVG mark + wordmark */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-xl flex-shrink-0"
              style={{
                width: "38px",
                height: "38px",
                background: "#ffffff",
                boxShadow:
                  "0 0 0 1.5px rgba(75,29,149,0.25), 0 1px 4px rgba(0,0,0,0.07)",
              }}
            >
              <svg
                viewBox="0 0 52 52"
                width="24"
                height="24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 36 C14 25 18 19 22 27 C26 35 28 18 39 22"
                  stroke="#4B1D95"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span
              className="font-black tracking-tight text-foreground"
              style={{
                fontSize: "1.5rem",
                lineHeight: 1,
                letterSpacing: "-0.03em",
              }}
            >
              Signly
            </span>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <Button
              data-ocid="workspace.undo.button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleUndo();
              }}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
              className="px-2"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              data-ocid="workspace.redo.button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRedo();
              }}
              disabled={!canRedo}
              title="Redo (Ctrl+Shift+Z)"
              className="px-2"
            >
              <Redo2 className="w-4 h-4" />
            </Button>
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

        {/* Floating Text Style Panel */}
        <AnimatePresence>
          {showTextStylePanel && selectedOverlay && (
            <motion.div
              key="text-style-panel"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute top-[56px] left-1/2 -translate-x-1/2 z-30 md:left-24 md:translate-x-0"
              style={{ pointerEvents: "auto" }}
              data-ocid="text_style.panel"
            >
              <TextStylePanel
                item={selectedOverlay}
                onUpdate={(updates) =>
                  handleOverlayUpdate(selectedOverlay.id, updates)
                }
              />
            </motion.div>
          )}
        </AnimatePresence>

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
                      onDragEnd={handleDragEnd}
                      onTextBlur={handleTextBlur}
                      data-ocid={`overlay.item.${idx + 1}`}
                    />
                  ))}
                </div>
              ))}
            </Document>

            {numPages > 0 && (
              <div className="w-full max-w-[800px] mt-2 mb-4">
                <TipDeveloper />
              </div>
            )}
            {numPages > 0 && (
              <div className="w-full max-w-[800px] mt-2 mb-6">
                <StarRating />
              </div>
            )}
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
