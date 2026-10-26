import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faChevronLeft,
  faChevronRight,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faArrowsUpDownLeftRight,
  faTrashCan,
  faArrowsRotate,
  faEyeSlash,
  faEye,
  faHand,
  faMagnet,
} from '@fortawesome/free-solid-svg-icons';
import { PageNumberConfig, StampItem, Language } from '../types';
import { generatePageNumberText, isPageExcluded, formatNumeral } from '../utils/numbering';
import { translations } from '../translations';

// Configure PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

interface PDFCanvasViewerProps {
  pdfDocProxy: any;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  numberConfig: PageNumberConfig;
  onUpdateNumberConfig: (config: PageNumberConfig) => void;
  stamps: StampItem[];
  selectedStampId: string | null;
  onSelectStamp: (id: string | null) => void;
  onUpdateStamp: (stamp: StampItem) => void;
  onDeleteStamp: (id: string) => void;
  lang: Language;
}

export const PDFCanvasViewer: React.FC<PDFCanvasViewerProps> = ({
  pdfDocProxy,
  currentPage,
  totalPages,
  onPageChange,
  numberConfig,
  onUpdateNumberConfig,
  stamps,
  selectedStampId,
  onSelectStamp,
  onUpdateStamp,
  onDeleteStamp,
  lang,
}) => {
  const t = translations[lang];
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(0.35);
  const [renderSize, setRenderSize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 840,
  });
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Initial mount zoom: locked to 35% as requested ("পিডিএফ ক্যানভাসে পৃষ্ঠা ৩৫% এ রেখে")
  useEffect(() => {
    setZoom(0.35);
  }, []);

  const handleFitWidth = () => {
    if (typeof window !== 'undefined') {
      const screenWidth = window.innerWidth;
      const targetWidth = screenWidth < 640 ? screenWidth - 48 : 560;
      const optimalZoom = Math.max(0.45, Math.min(2.0, targetWidth / 595));
      setZoom(Math.round(optimalZoom * 100) / 100);
    }
  };

  // 5 vertical dividing lines across width (dividing into 6 columns: 16.67%, 33.33%, 50.0%, 66.67%, 83.33%)
  // Notice Line 3 is exactly 50% (dead center) as requested by user
  const VERTICAL_GRID_LINES = [16.67, 33.33, 50.0, 66.67, 83.33];
  // 7 horizontal dividing lines across height (dividing into 8 rows: 12.5%, 25%, 37.5%, 50%, 62.5%, 75%, 87.5%)
  // Notice Line 4 is exactly 50% (dead center) as requested by user
  const HORIZONTAL_GRID_LINES = [12.5, 25.0, 37.5, 50.0, 62.5, 75.0, 87.5];

  // All snap targets
  const ALL_VERT_SNAPS = [16.67, 33.33, 50.0, 66.67, 83.33];
  const ALL_HORIZ_SNAPS = [12.5, 25.0, 37.5, 50.0, 62.5, 75.0, 87.5];

  function snapToGrid(
    val: number,
    gridLines: number[],
    threshold: number = 2.8
  ): { value: number; snapped: boolean; line?: number } {
    // Generous center lock: 50% center axis has a wider magnetic radius so items snap easily right to the center
    if (gridLines.includes(50.0) && Math.abs(val - 50.0) <= 3.8) {
      return { value: 50.0, snapped: true, line: 50.0 };
    }
    for (const line of gridLines) {
      if (Math.abs(val - line) <= threshold) {
        return { value: line, snapped: true, line };
      }
    }
    return { value: val, snapped: false };
  }

  // Magnetic Grid State
  const [magneticGridEnabled, setMagneticGridEnabled] = useState<boolean>(true);
  const [activeSnapLine, setActiveSnapLine] = useState<{ x?: number; y?: number }>({});

  // Dragging state for stamp & page number
  const [draggingStampId, setDraggingStampId] = useState<string | null>(null);
  const [resizingStampId, setResizingStampId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingNumber, setDraggingNumber] = useState<boolean>(false);
  const [numberDragOffset, setNumberDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Render current PDF page
  useEffect(() => {
    let cancelRender = false;
    let renderTask: any = null;

    async function renderPage() {
      if (!pdfDocProxy || !canvasRef.current) return;
      try {
        setIsRendering(true);
        const page = await pdfDocProxy.getPage(currentPage);
        if (cancelRender) return;

        const viewport = page.getViewport({ scale: zoom });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Retina multiplier
        const dpr = window.devicePixelRatio || 1;
        canvas.width = viewport.width * dpr;
        canvas.height = viewport.height * dpr;
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        setRenderSize({ width: viewport.width, height: viewport.height });

        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      } finally {
        if (!cancelRender) setIsRendering(false);
      }
    }

    renderPage();

    return () => {
      cancelRender = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDocProxy, currentPage, zoom]);

  // Handle stamp mouse drag: automatically brings stamp on top of page number
  const handleStampMouseDown = (
    e: React.MouseEvent,
    stamp: StampItem
  ) => {
    e.stopPropagation();
    onSelectStamp(stamp.id);
    setDraggingStampId(stamp.id);
    if (numberConfig.layer !== 'below_stamps') {
      onUpdateNumberConfig({ ...numberConfig, layer: 'below_stamps' });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickXPercent = ((e.clientX - rect.left) / renderSize.width) * 100;
      const clickYPercent = ((e.clientY - rect.top) / renderSize.height) * 100;
      setDragOffset({
        x: clickXPercent - stamp.xPercent,
        y: clickYPercent - stamp.yPercent,
      });
    }
  };

  // Handle stamp touch drag on mobile: automatically brings stamp on top of page number
  const handleStampTouchStart = (
    e: React.TouchEvent,
    stamp: StampItem
  ) => {
    e.stopPropagation();
    onSelectStamp(stamp.id);
    setDraggingStampId(stamp.id);
    if (numberConfig.layer !== 'below_stamps') {
      onUpdateNumberConfig({ ...numberConfig, layer: 'below_stamps' });
    }

    if (containerRef.current && e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const touchXPercent = ((touch.clientX - rect.left) / renderSize.width) * 100;
      const touchYPercent = ((touch.clientY - rect.top) / renderSize.height) * 100;
      setDragOffset({
        x: touchXPercent - stamp.xPercent,
        y: touchYPercent - stamp.yPercent,
      });
    }
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    stamp: StampItem
  ) => {
    e.stopPropagation();
    onSelectStamp(stamp.id);
    setResizingStampId(stamp.id);
  };

  const handleResizeTouchStart = (
    e: React.TouchEvent,
    stamp: StampItem
  ) => {
    e.stopPropagation();
    onSelectStamp(stamp.id);
    setResizingStampId(stamp.id);
  };

  // Dragging page number overlay: automatically brings page number on top of stamp/photo
  const handleNumberMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNumber(true);
    if (numberConfig.layer !== 'above_stamps') {
      onUpdateNumberConfig({ ...numberConfig, layer: 'above_stamps' });
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = numberConfig.position === 'custom' ? numberConfig.customXPercent : 50;
      const currentY = numberConfig.position === 'custom' ? numberConfig.customYPercent : 92;
      const clickXPercent = ((e.clientX - rect.left) / renderSize.width) * 100;
      const clickYPercent = ((e.clientY - rect.top) / renderSize.height) * 100;
      setNumberDragOffset({
        x: clickXPercent - currentX,
        y: clickYPercent - currentY,
      });
    }
  };

  const handleNumberTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    setDraggingNumber(true);
    if (numberConfig.layer !== 'above_stamps') {
      onUpdateNumberConfig({ ...numberConfig, layer: 'above_stamps' });
    }

    if (containerRef.current && e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const currentX = numberConfig.position === 'custom' ? numberConfig.customXPercent : 50;
      const currentY = numberConfig.position === 'custom' ? numberConfig.customYPercent : 92;
      const touchXPercent = ((touch.clientX - rect.left) / renderSize.width) * 100;
      const touchYPercent = ((touch.clientY - rect.top) / renderSize.height) * 100;
      setNumberDragOffset({
        x: touchXPercent - currentX,
        y: touchYPercent - currentY,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (draggingStampId) {
      const stamp = stamps.find((s) => s.id === draggingStampId);
      if (!stamp) return;

      const mouseXPercent = ((e.clientX - rect.left) / renderSize.width) * 100;
      const mouseYPercent = ((e.clientY - rect.top) / renderSize.height) * 100;

      const rawX = mouseXPercent - dragOffset.x;
      const rawY = mouseYPercent - dragOffset.y;

      let finalX = rawX;
      let finalY = rawY;
      let snapXLine: number | undefined;
      let snapYLine: number | undefined;

      if (magneticGridEnabled) {
        const sx = snapToGrid(rawX, ALL_VERT_SNAPS, 2.8);
        if (sx.snapped) {
          finalX = sx.value;
          snapXLine = sx.line;
        }
        const sy = snapToGrid(rawY, ALL_HORIZ_SNAPS, 2.8);
        if (sy.snapped) {
          finalY = sy.value;
          snapYLine = sy.line;
        }
      }
      setActiveSnapLine({ x: snapXLine, y: snapYLine });

      const newXPercent = Math.max(5, Math.min(95, finalX));
      const newYPercent = Math.max(5, Math.min(95, finalY));

      onUpdateStamp({
        ...stamp,
        xPercent: Math.round(newXPercent * 10) / 10,
        yPercent: Math.round(newYPercent * 10) / 10,
      });
    } else if (draggingNumber) {
      const mouseXPercent = ((e.clientX - rect.left) / renderSize.width) * 100;
      const mouseYPercent = ((e.clientY - rect.top) / renderSize.height) * 100;

      const rawX = mouseXPercent - numberDragOffset.x;
      const rawY = mouseYPercent - numberDragOffset.y;

      let finalX = rawX;
      let finalY = rawY;
      let snapXLine: number | undefined;
      let snapYLine: number | undefined;

      if (magneticGridEnabled) {
        const sx = snapToGrid(rawX, ALL_VERT_SNAPS, 2.8);
        if (sx.snapped) {
          finalX = sx.value;
          snapXLine = sx.line;
        }
        const sy = snapToGrid(rawY, ALL_HORIZ_SNAPS, 2.8);
        if (sy.snapped) {
          finalY = sy.value;
          snapYLine = sy.line;
        }
      }
      setActiveSnapLine({ x: snapXLine, y: snapYLine });

      const newXPercent = Math.max(4, Math.min(96, finalX));
      const newYPercent = Math.max(4, Math.min(96, finalY));

      onUpdateNumberConfig({
        ...numberConfig,
        position: 'custom',
        customXPercent: Math.round(newXPercent * 10) / 10,
        customYPercent: Math.round(newYPercent * 10) / 10,
      });
    } else if (resizingStampId) {
      const stamp = stamps.find((s) => s.id === resizingStampId);
      if (!stamp) return;

      const mouseXPercent = ((e.clientX - rect.left) / renderSize.width) * 100;
      const widthDiff = Math.abs(mouseXPercent - stamp.xPercent) * 2;
      const clampedWidth = Math.max(10, Math.min(80, Math.round(widthDiff)));

      onUpdateStamp({
        ...stamp,
        widthPercent: clampedWidth,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current || e.touches.length === 0) return;
    if (draggingStampId || resizingStampId || draggingNumber) {
      if (e.cancelable) e.preventDefault();
    }
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();

    if (draggingStampId) {
      const stamp = stamps.find((s) => s.id === draggingStampId);
      if (!stamp) return;

      const touchXPercent = ((touch.clientX - rect.left) / renderSize.width) * 100;
      const touchYPercent = ((touch.clientY - rect.top) / renderSize.height) * 100;

      const rawX = touchXPercent - dragOffset.x;
      const rawY = touchYPercent - dragOffset.y;

      let finalX = rawX;
      let finalY = rawY;
      let snapXLine: number | undefined;
      let snapYLine: number | undefined;

      if (magneticGridEnabled) {
        const sx = snapToGrid(rawX, ALL_VERT_SNAPS, 2.8);
        if (sx.snapped) {
          finalX = sx.value;
          snapXLine = sx.line;
        }
        const sy = snapToGrid(rawY, ALL_HORIZ_SNAPS, 2.8);
        if (sy.snapped) {
          finalY = sy.value;
          snapYLine = sy.line;
        }
      }
      setActiveSnapLine({ x: snapXLine, y: snapYLine });

      const newXPercent = Math.max(5, Math.min(95, finalX));
      const newYPercent = Math.max(5, Math.min(95, finalY));

      onUpdateStamp({
        ...stamp,
        xPercent: Math.round(newXPercent * 10) / 10,
        yPercent: Math.round(newYPercent * 10) / 10,
      });
    } else if (draggingNumber) {
      const touchXPercent = ((touch.clientX - rect.left) / renderSize.width) * 100;
      const touchYPercent = ((touch.clientY - rect.top) / renderSize.height) * 100;

      const rawX = touchXPercent - numberDragOffset.x;
      const rawY = touchYPercent - numberDragOffset.y;

      let finalX = rawX;
      let finalY = rawY;
      let snapXLine: number | undefined;
      let snapYLine: number | undefined;

      if (magneticGridEnabled) {
        const sx = snapToGrid(rawX, ALL_VERT_SNAPS, 2.8);
        if (sx.snapped) {
          finalX = sx.value;
          snapXLine = sx.line;
        }
        const sy = snapToGrid(rawY, ALL_HORIZ_SNAPS, 2.8);
        if (sy.snapped) {
          finalY = sy.value;
          snapYLine = sy.line;
        }
      }
      setActiveSnapLine({ x: snapXLine, y: snapYLine });

      const newXPercent = Math.max(4, Math.min(96, finalX));
      const newYPercent = Math.max(4, Math.min(96, finalY));

      onUpdateNumberConfig({
        ...numberConfig,
        position: 'custom',
        customXPercent: Math.round(newXPercent * 10) / 10,
        customYPercent: Math.round(newYPercent * 10) / 10,
      });
    } else if (resizingStampId) {
      const stamp = stamps.find((s) => s.id === resizingStampId);
      if (!stamp) return;

      const touchXPercent = ((touch.clientX - rect.left) / renderSize.width) * 100;
      const widthDiff = Math.abs(touchXPercent - stamp.xPercent) * 2;
      const clampedWidth = Math.max(10, Math.min(80, Math.round(widthDiff)));

      onUpdateStamp({
        ...stamp,
        widthPercent: clampedWidth,
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingStampId(null);
    setResizingStampId(null);
    setDraggingNumber(false);
    setActiveSnapLine({});
  };

  const handleTouchEnd = () => {
    setDraggingStampId(null);
    setResizingStampId(null);
    setDraggingNumber(false);
    setActiveSnapLine({});
  };

  // Check if numbering should be excluded on current page
  const isNumberingExcludedOnCurrent = isPageExcluded(
    currentPage,
    numberConfig.excludedPages,
    numberConfig.skipFirstPage,
    numberConfig.pageFilterMode
  );

  const toggleCurrentPageExclusion = () => {
    const isExcluded = numberConfig.excludedPages.includes(currentPage);
    let nextExcluded: number[];
    if (isExcluded) {
      nextExcluded = numberConfig.excludedPages.filter((p) => p !== currentPage);
    } else {
      nextExcluded = [...numberConfig.excludedPages, currentPage].sort((a, b) => a - b);
    }
    onUpdateNumberConfig({
      ...numberConfig,
      excludedPages: nextExcluded,
    });
  };

  // Calculate live preview number position in CSS percentage
  const getNumberPreviewStyle = (): React.CSSProperties => {
    const margin = 20; // px
    const rotation = numberConfig.rotation || 0;
    const rot = rotation !== 0 ? ` rotate(${rotation}deg)` : '';
    switch (numberConfig.position) {
      case 'top-left':
        return { top: `${margin}px`, left: `${margin}px`, transform: `none${rot}` };
      case 'top-center':
        return { top: `${margin}px`, left: '50%', transform: `translateX(-50%)${rot}` };
      case 'top-right':
        return { top: `${margin}px`, right: `${margin}px`, transform: `none${rot}` };
      case 'bottom-left':
        return { bottom: `${margin}px`, left: `${margin}px`, transform: `none${rot}` };
      case 'bottom-center':
        return { bottom: `${margin}px`, left: '50%', transform: `translateX(-50%)${rot}` };
      case 'bottom-right':
        return { bottom: `${margin}px`, right: `${margin}px`, transform: `none${rot}` };
      case 'custom':
        return {
          top: `${numberConfig.customYPercent}%`,
          left: `${numberConfig.customXPercent}%`,
          transform: `translate(-50%, -50%)${rot}`,
        };
    }
  };

  const currentNumberText = generatePageNumberText(
    currentPage,
    totalPages,
    numberConfig.format,
    numberConfig.numeralSystem,
    numberConfig.startFrom,
    lang,
    numberConfig.prefixText || '',
    numberConfig.suffixText || ''
  );

  return (
    <div
      className="flex flex-col items-center select-none w-full"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Top Controls Toolbar */}
      <div className="w-full max-w-4xl mb-2 flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        {/* Left: Page nav (17/30 format) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            aria-label="Previous Page"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          </button>

          {/* ১৭/৩০ format exactly as requested: "পৃষ্ঠা ১৭ এর ৩০ এর জায়গায় ১৭/৩০" */}
          <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
            {`${formatNumeral(currentPage, numberConfig.numeralSystem)}/${formatNumeral(totalPages, numberConfig.numeralSystem)}`}
          </span>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            aria-label="Next Page"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          </button>
        </div>

        {/* Right: Quick Exclude Page & Magnet (Icon-only) */}
        <div className="flex items-center gap-1.5">
          {/* Quick Exclude Current Page Toggle */}
          <button
            onClick={toggleCurrentPageExclusion}
            aria-label="Toggle Page Exclusion"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all cursor-pointer border truncate ${
              isNumberingExcludedOnCurrent
                ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <FontAwesomeIcon
              icon={isNumberingExcludedOnCurrent ? faEyeSlash : faEye}
              className="text-xs shrink-0"
            />
            <span className="truncate">
              {isNumberingExcludedOnCurrent
                ? lang === 'bn' ? 'বাদ' : 'Ignored'
                : lang === 'bn' ? 'সক্রিয়' : 'Active'}
            </span>
          </button>

          {/* Magnetic Grid Toggle Button - Icon ONLY as requested ("ম্যাগনেট আইকন থাকলে হবে ম্যাগনেট লেখা থাকতে হবে না") */}
          <button
            type="button"
            onClick={() => setMagneticGridEnabled(!magneticGridEnabled)}
            aria-label={t.magneticGrid}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-xs font-medium transition-all cursor-pointer border shrink-0 ${
              magneticGridEnabled
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 shadow-2xs font-semibold'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
            title={magneticGridEnabled ? t.magneticGridActive : t.magneticGrid}
          >
            <FontAwesomeIcon
              icon={faMagnet}
              className={`text-xs ${magneticGridEnabled ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Surface (Frozen in place, internal pan/zoom) */}
      <div className="relative overflow-auto w-full max-w-4xl h-[300px] sm:h-[350px] p-2 sm:p-4 flex justify-center bg-slate-200/50 dark:bg-slate-950/60 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-inner">
        <div
          ref={containerRef}
          onClick={() => onSelectStamp(null)}
          className="relative bg-white shadow-xl transition-transform m-auto shrink-0"
          style={{
            width: renderSize.width,
            height: renderSize.height,
          }}
        >
          {/* PDF Page Canvas */}
          <canvas ref={canvasRef} className="block pointer-events-none" />

          {/* Interactive Overlay Layer */}
          <div className="absolute inset-0 pointer-events-auto">
            {/* 5 Vertical & 7 Horizontal Lines Magnetic Grid Overlay (Center Aligned) */}
            {magneticGridEnabled && (
              <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
                {/* 5 Vertical lines with center line at 50% */}
                {VERTICAL_GRID_LINES.map((x) => {
                  const isCenter = Math.abs(x - 50.0) < 0.2;
                  const isSnapped =
                    activeSnapLine.x !== undefined && Math.abs(activeSnapLine.x - x) < 0.5;
                  return (
                    <div
                      key={`v-${x}`}
                      style={{ left: `${x}%` }}
                      className={`absolute top-0 bottom-0 transition-all duration-150 ${
                        isSnapped
                          ? 'bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.9)] z-20 w-[2px]'
                          : isCenter
                          ? 'border-r-2 border-indigo-500/60 dark:border-indigo-400/60 w-[2px]'
                          : 'border-r border-dashed border-indigo-400/35 dark:border-indigo-500/35 w-[1px]'
                      }`}
                    />
                  );
                })}

                {/* 7 Horizontal lines with center line at 50% */}
                {HORIZONTAL_GRID_LINES.map((y) => {
                  const isCenter = Math.abs(y - 50.0) < 0.2;
                  const isSnapped =
                    activeSnapLine.y !== undefined && Math.abs(activeSnapLine.y - y) < 0.5;
                  return (
                    <div
                      key={`h-${y}`}
                      style={{ top: `${y}%` }}
                      className={`absolute left-0 right-0 transition-all duration-150 ${
                        isSnapped
                          ? 'bg-indigo-600 dark:bg-indigo-400 shadow-[0_0_8px_rgba(79,70,229,0.9)] z-20 h-[2px]'
                          : isCenter
                          ? 'border-b-2 border-indigo-500/60 dark:border-indigo-400/60 h-[2px]'
                          : 'border-b border-dashed border-indigo-400/35 dark:border-indigo-500/35 h-[1px]'
                      }`}
                    />
                  );
                })}

                {/* Center marker (50%, 50%) */}
                <div
                  style={{ left: '50%', top: '50%' }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-indigo-500/70 flex items-center justify-center opacity-80 z-20"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
                </div>

                {/* Magnetic intersection dots */}
                {VERTICAL_GRID_LINES.map((x) =>
                  HORIZONTAL_GRID_LINES.map((y) => (
                    <div
                      key={`dot-${x}-${y}`}
                      style={{ left: `${x}%`, top: `${y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400/50 dark:bg-indigo-500/50"
                    />
                  ))
                )}
              </div>
            )}

            {/* Live Page Number Overlay Preview (Draggable with Magnetic Snap, Layered above stamps) */}
            {numberConfig.enabled && !isNumberingExcludedOnCurrent && (
              <div
                onMouseDown={handleNumberMouseDown}
                onTouchStart={handleNumberTouchStart}
                style={{
                  ...getNumberPreviewStyle(),
                  fontSize: `${numberConfig.fontSize * (zoom / 1.0)}px`,
                  color: numberConfig.fontColor,
                  opacity: numberConfig.opacity,
                  fontFamily: "'Hind Siliguri', 'Inter', sans-serif",
                  fontWeight: 300,
                }}
                className={`absolute ${
                  draggingNumber
                    ? 'z-50 ring-2 ring-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/80 shadow-md'
                    : numberConfig.layer === 'below_stamps'
                    ? 'z-20'
                    : 'z-40'
                } px-2 py-0.5 rounded cursor-move hover:ring-2 hover:ring-indigo-400/80 transition-all font-light whitespace-nowrap group touch-none select-none`}
                title={lang === 'bn' ? 'ড্র্যাগ করে সরান' : 'Drag to reposition'}
              >
                {currentNumberText}
              </div>
            )}

            {/* Stamps / Photos Overlays */}
            {stamps.map((stamp) => {
              const isFilteredOut =
                (stamp.pageFilterMode === 'odd' && currentPage % 2 === 0) ||
                (stamp.pageFilterMode === 'even' && currentPage % 2 !== 0);

              const shouldShow =
                (stamp.applyToAll || stamp.targetPage === currentPage) &&
                !stamp.excludedPages.includes(currentPage) &&
                !isFilteredOut;

              if (!shouldShow) return null;

              const isSelected = selectedStampId === stamp.id;
              const stampWidthPx = (stamp.widthPercent / 100) * renderSize.width;
              const stampHeightPx = stampWidthPx / stamp.aspectRatio;
              const isDraggingThisStamp = draggingStampId === stamp.id;
              const stampZIndex = isDraggingThisStamp
                ? 'z-50'
                : numberConfig.layer === 'below_stamps'
                ? 'z-40'
                : 'z-20';

              return (
                <div
                  key={stamp.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectStamp(stamp.id);
                  }}
                  onMouseDown={(e) => handleStampMouseDown(e, stamp)}
                  onTouchStart={(e) => handleStampTouchStart(e, stamp)}
                  style={{
                    position: 'absolute',
                    left: `${stamp.xPercent}%`,
                    top: `${stamp.yPercent}%`,
                    width: `${stampWidthPx}px`,
                    height: `${stampHeightPx}px`,
                    transform: `translate(-50%, -50%) rotate(${stamp.rotation}deg)`,
                    opacity: stamp.opacity,
                    cursor: isDraggingThisStamp ? 'grabbing' : 'grab',
                  }}
                  className={`group select-none ${stampZIndex} transition-shadow touch-none ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 shadow-xl'
                      : 'hover:ring-1 hover:ring-indigo-300'
                  }`}
                >
                  <img
                    src={stamp.dataUrl}
                    alt={stamp.name}
                    className="w-full h-full object-contain pointer-events-none select-none"
                    draggable={false}
                  />

                  {/* Stamp Controls when Selected */}
                  {isSelected && (
                    <>
                      {/* Resize Handle at bottom right */}
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, stamp)}
                        onTouchStart={(e) => handleResizeTouchStart(e, stamp)}
                        className="absolute -right-3 -bottom-3 w-7 h-7 bg-indigo-600 border-2 border-white rounded-full cursor-nwse-resize flex items-center justify-center text-[10px] text-white shadow-md touch-none"
                        title={t.resizeHint}
                      >
                        <FontAwesomeIcon icon={faArrowsUpDownLeftRight} className="text-[10px]" />
                      </div>

                      {/* Floating mini action bar */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 text-white px-2 py-1 rounded-lg text-xs shadow-lg backdrop-blur-xs whitespace-nowrap pointer-events-auto"
                      >
                        <span className="text-[10px] text-slate-200 px-1 font-['Hind_Siliguri']">
                          {stamp.name}
                        </span>
                        <button
                          onClick={() =>
                            onUpdateStamp({
                              ...stamp,
                              rotation: (stamp.rotation + 90) % 360,
                            })
                          }
                          aria-label="Rotate Stamp 90 Degrees"
                          className="p-1 hover:text-indigo-300 cursor-pointer"
                          title={t.stampRotation}
                        >
                          <FontAwesomeIcon icon={faArrowsRotate} className="text-[11px]" />
                        </button>
                        <button
                          onClick={() => onDeleteStamp(stamp.id)}
                          aria-label="Delete Stamp"
                          className="p-1 hover:text-rose-400 cursor-pointer"
                          title={t.removeStamp}
                        >
                          <FontAwesomeIcon icon={faTrashCan} className="text-[11px]" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rendering Loading Spinner */}
          {isRendering && (
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center z-50">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Floating Zoom inside canvas only ("মনে চাইলে ক্যানভাসের ভিতরে শুধু পিডিএফ এর পেজটা জুম করব") */}
        <div className="absolute bottom-3 right-3 z-30 inline-flex items-center gap-1 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2 py-1 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-md">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.max(0.2, Math.round((z - 0.05) * 100) / 100));
            }}
            disabled={zoom <= 0.2}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer text-xs transition-colors"
            title={t.zoomOut}
          >
            <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom(0.35);
            }}
            className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200 px-1 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
            title="Reset to 35%"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.min(2.5, Math.round((z + 0.05) * 100) / 100));
            }}
            disabled={zoom >= 2.5}
            className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 cursor-pointer text-xs transition-colors"
            title={t.zoomIn}
          >
            <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
          </button>
        </div>
      </div>

      {/* Helpful Hint */}
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-light flex items-center gap-1.5">
        <FontAwesomeIcon icon={faHand} className="text-indigo-500" />
        <span>{t.dragHint}</span>
      </p>
    </div>
  );
};
