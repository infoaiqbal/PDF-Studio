import { PDFDocument, degrees } from 'pdf-lib';
import { PageNumberConfig, StampItem, Language } from '../types';
import { generatePageNumberText, isPageExcluded } from './numbering';

/**
 * Converts a text string into a high-DPI PNG ArrayBuffer using an offscreen canvas.
 * This guarantees perfect rendering of Bengali (যুক্তবর্ণসহ), Arabic, and English.
 */
export async function renderTextToPngBytes(
  text: string,
  fontSize: number,
  fontColorHex: string,
  opacity: number
): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2d canvas context');

  // Multiplier for crisp retina print quality
  const scale = 3;
  const scaledFontSize = fontSize * scale;

  ctx.font = `300 ${scaledFontSize}px 'Hind Siliguri', 'Inter', sans-serif`;
  const metrics = ctx.measureText(text);

  const paddingX = 20 * scale;
  const paddingY = 16 * scale;
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(scaledFontSize * 1.3);

  canvas.width = textWidth + paddingX * 2;
  canvas.height = textHeight + paddingY * 2;

  // Re-set font after canvas resize
  ctx.font = `300 ${scaledFontSize}px 'Hind Siliguri', 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = fontColorHex;
  ctx.globalAlpha = opacity;

  ctx.fillText(
    text,
    canvas.width / 2,
    canvas.height / 2
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas blob generation failed'));
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        resolve({
          bytes: new Uint8Array(arrayBuffer),
          width: canvas.width / scale,
          height: canvas.height / scale,
        });
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(blob);
    }, 'image/png');
  });
}

/**
 * Loads an image (data URL or object URL) and returns PNG/JPG ArrayBuffer and aspect ratio
 */
export async function loadImageToBytes(
  dataUrl: string
): Promise<{ bytes: Uint8Array; format: 'png' | 'jpg'; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 400;
      canvas.height = img.naturalHeight || img.height || 300;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate image blob'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            bytes: new Uint8Array(reader.result as ArrayBuffer),
            format: 'png',
            width: canvas.width,
            height: canvas.height,
          });
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob);
      }, 'image/png');
    };
    img.onerror = () => reject(new Error('Failed to load image resource'));
    img.src = dataUrl;
  });
}

export interface ProcessPdfOptions {
  pdfBytes: ArrayBuffer;
  numberConfig: PageNumberConfig;
  stamps: StampItem[];
  lang: Language;
  onProgress?: (progress: number, message: string) => void;
}

/**
 * Core processor: applies page numbers & photo stamps to the PDF document offline.
 */
export async function processAndExportPdf({
  pdfBytes,
  numberConfig,
  stamps,
  lang,
  onProgress,
}: ProcessPdfOptions): Promise<Uint8Array> {
  onProgress?.(5, lang === 'bn' ? 'পিডিএফ লোড হচ্ছে...' : 'Loading PDF...');
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const totalPages = pdfDoc.getPageCount();

  // Cache embedded stamp images to prevent re-embedding identical images repeatedly
  const embeddedStampCache = new Map<
    string,
    { image: any; originalWidth: number; originalHeight: number }
  >();

  onProgress?.(15, lang === 'bn' ? 'স্ট্যাম্প প্রস্তুত করা হচ্ছে...' : 'Preparing stamps...');
  for (const stamp of stamps) {
    if (!embeddedStampCache.has(stamp.id)) {
      try {
        const { bytes, format, width, height } = await loadImageToBytes(stamp.dataUrl);
        const embeddedImg =
          format === 'jpg'
            ? await pdfDoc.embedJpg(bytes)
            : await pdfDoc.embedPng(bytes);
        embeddedStampCache.set(stamp.id, {
          image: embeddedImg,
          originalWidth: width,
          originalHeight: height,
        });
      } catch (err) {
        console.error('Error embedding stamp:', stamp.name, err);
      }
    }
  }

  // Process each page
  for (let i = 0; i < totalPages; i++) {
    const pageIndex = i + 1; // 1-indexed
    const page = pdfDoc.getPage(i);
    const { width: pageWidth, height: pageHeight } = page.getSize();

    const progressPercent = 20 + Math.floor((i / totalPages) * 70);
    onProgress?.(
      progressPercent,
      lang === 'bn'
        ? `পৃষ্ঠা ${pageIndex} এর ${totalPages} প্রসেস হচ্ছে...`
        : `Processing page ${pageIndex} of ${totalPages}...`
    );

    // Render Function: Draw Page Number
    const drawPageNumber = async () => {
      if (!numberConfig.enabled) return;

      const skipNumber = isPageExcluded(
        pageIndex,
        numberConfig.excludedPages,
        numberConfig.skipFirstPage,
        numberConfig.pageFilterMode
      );
      if (skipNumber) return;

      const numberText = generatePageNumberText(
        pageIndex,
        totalPages,
        numberConfig.format,
        numberConfig.numeralSystem,
        numberConfig.startFrom,
        lang,
        numberConfig.prefixText || '',
        numberConfig.suffixText || ''
      );

      const { bytes, width: textWidth, height: textHeight } =
        await renderTextToPngBytes(
          numberText,
          numberConfig.fontSize,
          numberConfig.fontColor,
          numberConfig.opacity
        );

      const embeddedTextPng = await pdfDoc.embedPng(bytes);

      // Calculate (x, y) coordinates in PDF coordinate space (origin (0,0) is bottom-left)
      let x = 0;
      let y = 0;
      const margin = numberConfig.margin;

      switch (numberConfig.position) {
        case 'top-left':
          x = margin;
          y = pageHeight - margin - textHeight;
          break;
        case 'top-center':
          x = (pageWidth - textWidth) / 2;
          y = pageHeight - margin - textHeight;
          break;
        case 'top-right':
          x = pageWidth - margin - textWidth;
          y = pageHeight - margin - textHeight;
          break;
        case 'bottom-left':
          x = margin;
          y = margin;
          break;
        case 'bottom-center':
          x = (pageWidth - textWidth) / 2;
          y = margin;
          break;
        case 'bottom-right':
          x = pageWidth - margin - textWidth;
          y = margin;
          break;
        case 'custom':
          x = (numberConfig.customXPercent / 100) * pageWidth - textWidth / 2;
          // customYPercent is from top down in UI (0% is top, 100% is bottom)
          // in PDF, y is from bottom up
          y = pageHeight - (numberConfig.customYPercent / 100) * pageHeight - textHeight / 2;
          break;
      }

      // Clamp to page boundary
      x = Math.max(0, Math.min(x, pageWidth - textWidth));
      y = Math.max(0, Math.min(y, pageHeight - textHeight));

      const rotationDeg = numberConfig.rotation || 0;

      page.drawImage(embeddedTextPng, {
        x,
        y,
        width: textWidth,
        height: textHeight,
        opacity: numberConfig.opacity,
        rotate: degrees(rotationDeg),
      });
    };

    // Render Function: Draw Stamps
    const drawStamps = () => {
      for (const stamp of stamps) {
        const isFilteredOut =
          (stamp.pageFilterMode === 'odd' && pageIndex % 2 === 0) ||
          (stamp.pageFilterMode === 'even' && pageIndex % 2 !== 0);

        const shouldApply = stamp.applyToAll || stamp.targetPage === pageIndex;
        const isExcluded = stamp.excludedPages.includes(pageIndex) || isFilteredOut;

        if (shouldApply && !isExcluded) {
          const cached = embeddedStampCache.get(stamp.id);
          if (cached) {
            const stampWidth = (stamp.widthPercent / 100) * pageWidth;
            const stampHeight = stampWidth / stamp.aspectRatio;

            const centerX = (stamp.xPercent / 100) * pageWidth;
            const centerY = pageHeight - (stamp.yPercent / 100) * pageHeight;

            const x = centerX - stampWidth / 2;
            const y = centerY - stampHeight / 2;

            page.drawImage(cached.image, {
              x,
              y,
              width: stampWidth,
              height: stampHeight,
              opacity: stamp.opacity,
              rotate: degrees(stamp.rotation || 0),
            });
          }
        }
      }
    };

    // Ordering: If layer is 'below_stamps', draw numbers before stamps;
    // Otherwise (default), draw stamps FIRST and numbers SECOND (so page numbers stay on top and are never covered)
    if (numberConfig.layer === 'below_stamps') {
      await drawPageNumber();
      drawStamps();
    } else {
      drawStamps();
      await drawPageNumber();
    }
  }

  onProgress?.(95, lang === 'bn' ? 'চূড়ান্ত পিডিএফ ফাইল সংরক্ষণ করা হচ্ছে...' : 'Saving finalized PDF...');
  const modifiedPdfBytes = await pdfDoc.save();
  onProgress?.(100, lang === 'bn' ? 'সম্পন্ন হয়েছে!' : 'Done!');

  return modifiedPdfBytes;
}

/**
 * Triggers file download in the browser
 */
export function triggerFileDownload(bytes: Uint8Array, fileName: string) {
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
