import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { OverlayItem } from "../App";

interface PageDimension {
  width: number;
  height: number;
}

function dataUrlToBytes(dataUrl: string): Uint8Array<ArrayBuffer> {
  const base64 = dataUrl.split(",")[1];
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: Number.parseInt(result[1], 16) / 255,
        g: Number.parseInt(result[2], 16) / 255,
        b: Number.parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

const stampHexColors: Record<string, string> = {
  SIGNED: "#DC2626",
  APPROVED: "#16A34A",
  DATED: "#1D4ED8",
};

function fontFamilyToStandardFont(fontFamily: string): StandardFonts {
  const lower = fontFamily.toLowerCase();
  if (lower.includes("georgia") || lower.includes("times")) {
    return StandardFonts.TimesRoman;
  }
  if (lower.includes("courier")) {
    return StandardFonts.Courier;
  }
  // Arial, Helvetica, and everything else → Helvetica
  return StandardFonts.Helvetica;
}

export async function exportSignedPdf(
  originalBytes: ArrayBuffer,
  overlays: OverlayItem[],
  _renderedDimensions: PageDimension[],
): Promise<void> {
  const pdfDoc = await PDFDocument.load(originalBytes);
  const pages = pdfDoc.getPages();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Pre-embed fonts needed for text overlays (cache by StandardFonts key)
  const fontCache = new Map<
    StandardFonts,
    Awaited<ReturnType<typeof pdfDoc.embedFont>>
  >();
  fontCache.set(StandardFonts.Helvetica, helvetica);
  fontCache.set(StandardFonts.HelveticaBold, helveticaBold);

  const getFont = async (sf: StandardFonts) => {
    if (!fontCache.has(sf)) {
      fontCache.set(sf, await pdfDoc.embedFont(sf));
    }
    return fontCache.get(sf)!;
  };

  for (const item of overlays) {
    const page = pages[item.pageIndex];
    if (!page) continue;

    const { width: pdfW, height: pdfH } = page.getSize();

    const absX = item.x * pdfW;
    const absW = item.width * pdfW;
    const absH = item.height * pdfH;
    // pdf-lib origin is bottom-left, flip Y
    const absY = pdfH - item.y * pdfH - absH;

    if (item.type === "signature" || item.type === "initial") {
      try {
        const imgBytes = dataUrlToBytes(item.content);
        const pngImage = await pdfDoc.embedPng(imgBytes);
        page.drawImage(pngImage, {
          x: absX,
          y: absY,
          width: absW,
          height: absH,
        });
      } catch (err) {
        console.error("Failed to embed image:", err);
      }
    } else if (item.type === "datetime") {
      const fontSize = Math.round(absH * 0.65);
      page.drawText(item.content, {
        x: absX,
        y: absY + absH * 0.2,
        size: Math.max(6, Math.min(fontSize, 14)),
        font: helvetica,
        color: rgb(0.1, 0.1, 0.1),
      });
    } else if (item.type === "stamp") {
      const hexColor = stampHexColors[item.content] ?? "#DC2626";
      const { r, g, b } = hexToRgb(hexColor);
      const stampColor = rgb(r, g, b);
      const borderWidth = Math.max(1, absH * 0.08);
      const fontSize = Math.max(7, Math.min(Math.round(absH * 0.5), 18));

      page.drawRectangle({
        x: absX,
        y: absY,
        width: absW,
        height: absH,
        borderColor: stampColor,
        borderWidth,
        opacity: 0,
        borderOpacity: 0.85,
      });

      const textWidth = helveticaBold.widthOfTextAtSize(item.content, fontSize);
      const textX = absX + (absW - textWidth) / 2;
      const textY = absY + (absH - fontSize) / 2;

      page.drawText(item.content, {
        x: textX,
        y: textY,
        size: fontSize,
        font: helveticaBold,
        color: stampColor,
        opacity: 0.85,
      });
    } else if (item.type === "text") {
      const textContent = item.content?.trim();
      if (!textContent || textContent === "Type here") continue;

      const sf = fontFamilyToStandardFont(item.fontFamily ?? "Arial");
      const font = await getFont(sf);
      const fontSize = Math.max(6, Math.min(item.fontSize ?? 14, 72));
      const { r, g, b } = hexToRgb(item.fontColor ?? "#000000");

      // Handle multi-line text
      const lines = textContent.split("\n");
      const lineHeight = fontSize * 1.3;
      // Start from top of the box (pdf coords: top = absY + absH)
      let currentY = absY + absH - fontSize;

      for (const line of lines) {
        if (!line) {
          currentY -= lineHeight;
          continue;
        }
        if (currentY < absY) break; // clip to box
        page.drawText(line, {
          x: absX + 2,
          y: currentY,
          size: fontSize,
          font,
          color: rgb(r, g, b),
        });
        currentY -= lineHeight;
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], {
    type: "application/pdf",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "signed-document.pdf";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
