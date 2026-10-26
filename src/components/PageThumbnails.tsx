import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faCheck,
  faBan,
  faHashtag,
  faImage,
  faEye,
  faEyeSlash,
  faCheckDouble,
} from '@fortawesome/free-solid-svg-icons';
import { PageNumberConfig, StampItem, Language, PageFilterMode } from '../types';
import { formatNumeral, isPageExcluded } from '../utils/numbering';
import { translations } from '../translations';

interface PageThumbnailsProps {
  totalPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
  numberConfig: PageNumberConfig;
  onToggleNumberExclusion: (page: number) => void;
  onBatchExclusionChange?: (excludedPages: number[]) => void;
  onToggleSkipFirstPage?: (skip: boolean) => void;
  stamps: StampItem[];
  lang: Language;
  pdfDocProxy?: any;
}

// Subcomponent: Live PDF Page Canvas Thumbnail
interface PageThumbnailCanvasProps {
  pdfDocProxy?: any;
  pageNum: number;
}

const PageThumbnailCanvas: React.FC<PageThumbnailCanvasProps> = ({ pdfDocProxy, pageNum }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    async function renderPageThumb() {
      if (!pdfDocProxy || !canvasRef.current) return;
      try {
        const page = await pdfDocProxy.getPage(pageNum);
        if (isCancelled) return;

        // Render at a clear, crisp miniature scale (width ~ 160px)
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const targetWidth = 160;
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas || isCancelled) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        renderTask = page.render({
          canvasContext: ctx,
          viewport,
        });

        await renderTask.promise;
        if (!isCancelled) {
          setIsLoaded(true);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Thumbnail render notice:', err);
        }
      }
    }

    renderPageThumb();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch (_) {}
      }
    };
  }, [pdfDocProxy, pageNum]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white dark:bg-slate-900 overflow-hidden rounded-xl">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full object-contain pointer-events-none select-none rounded shadow-xs"
      />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 animate-pulse text-[11px] font-mono">
          <span>{pageNum}</span>
        </div>
      )}
    </div>
  );
};

export const PageThumbnails: React.FC<PageThumbnailsProps> = ({
  totalPages,
  currentPage,
  onPageSelect,
  numberConfig,
  onToggleNumberExclusion,
  onBatchExclusionChange,
  onToggleSkipFirstPage,
  stamps,
  lang,
  pdfDocProxy,
}) => {
  const t = translations[lang];

  // Excluded count calculation
  const totalExcludedCount = Array.from({ length: totalPages }).filter((_, idx) => {
    const pageNum = idx + 1;
    return isPageExcluded(
      pageNum,
      numberConfig.excludedPages,
      numberConfig.skipFirstPage,
      numberConfig.pageFilterMode
    );
  }).length;

  const totalIncludedCount = totalPages - totalExcludedCount;



  return (
    <div className="space-y-4">
      {/* Header & Overview Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>{lang === 'bn' ? 'সরাসরি পৃষ্ঠা তালিকা ও বর্জন' : 'Page List & Visual Exclusions'}</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {totalPages} {lang === 'bn' ? 'পৃষ্ঠা' : 'pages'}
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light mt-0.5">
            {lang === 'bn'
              ? 'যেকোনো পৃষ্ঠায় ক্লিক করে সেখানে যান, অথবা বাদ দেওয়ার বোতাম চেপে বর্জন করুন।'
              : 'Click any page to jump to it, or toggle the badge to exclude/include.'}
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
            {lang === 'bn' ? 'সক্রিয়: ' : 'Active: '}
            <strong className="font-mono">{totalIncludedCount}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium">
            {lang === 'bn' ? 'বাদ: ' : 'Excluded: '}
            <strong className="font-mono">{totalExcludedCount}</strong>
          </span>
        </div>
      </div>



      {/* Grid of Real PDF Page Thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[520px] overflow-y-auto pr-1 p-1">
        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          const isSelected = currentPage === pageNum;
          const isNumExcluded = isPageExcluded(
            pageNum,
            numberConfig.excludedPages,
            numberConfig.skipFirstPage,
            numberConfig.pageFilterMode
          );

          // Count active stamps on this page
          const activeStampsCount = stamps.filter(
            (s) => (s.applyToAll || s.targetPage === pageNum) && !s.excludedPages.includes(pageNum)
          ).length;

          const numDisplay = formatNumeral(pageNum, numberConfig.numeralSystem);

          return (
            <div
              key={pageNum}
              onClick={() => onPageSelect(pageNum)}
              className={`group p-2.5 rounded-2xl border text-left cursor-pointer transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-2 ring-indigo-500/40 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs'
              }`}
            >
              {/* Actual Real PDF Canvas Thumbnail Box */}
              <div className="aspect-[3/4] w-full rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 p-1 flex flex-col justify-between mb-2 relative overflow-hidden">
                {/* Live Canvas Render */}
                <PageThumbnailCanvas pdfDocProxy={pdfDocProxy} pageNum={pageNum} />

                {/* Excluded Dim Overlay */}
                {isNumExcluded && (
                  <div className="absolute inset-0 bg-amber-950/40 backdrop-blur-[0.5px] flex flex-col items-center justify-center p-2 text-center select-none pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-amber-500/90 text-white flex items-center justify-center text-sm shadow-md mb-1">
                      <FontAwesomeIcon icon={faBan} />
                    </div>
                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-md bg-amber-900/80 shadow-xs">
                      {lang === 'bn' ? 'বাদ দেওয়া' : 'Excluded'}
                    </span>
                  </div>
                )}

                {/* Top Overlay Bar */}
                <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start pointer-events-auto">
                  {/* Page Num Badge */}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold shadow-2xs">
                    {numDisplay}
                  </span>

                  {/* Toggle Exclusion Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleNumberExclusion(pageNum);
                    }}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] transition-all cursor-pointer shadow-xs ${
                      isNumExcluded
                        ? 'bg-amber-600 hover:bg-amber-700 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                    title={isNumExcluded ? t.includeOnPage : t.excludeFromPage}
                  >
                    <FontAwesomeIcon icon={isNumExcluded ? faBan : faCheck} />
                  </button>
                </div>

                {/* Bottom Overlay Info (Number & Stamp indicators) */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1 pointer-events-none">
                  {numberConfig.enabled && !isNumExcluded && (
                    <span className="text-[8px] px-1 py-0.2 rounded-md bg-indigo-600 text-white flex items-center gap-0.5 font-bold shadow-2xs">
                      <FontAwesomeIcon icon={faHashtag} className="text-[7px]" />
                      <span>{numDisplay}</span>
                    </span>
                  )}
                  {activeStampsCount > 0 && (
                    <span className="text-[8px] px-1 py-0.2 rounded-md bg-purple-600 text-white flex items-center gap-0.5 font-bold shadow-2xs">
                      <FontAwesomeIcon icon={faImage} className="text-[7px]" />
                      <span>{activeStampsCount}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Card Title & Status Label */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {lang === 'bn' ? `পৃষ্ঠা ${numDisplay}` : `Page ${numDisplay}`}
                </span>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                    isNumExcluded
                      ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60'
                      : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60'
                  }`}
                >
                  {isNumExcluded
                    ? lang === 'bn' ? 'বাদ' : 'Off'
                    : lang === 'bn' ? 'সক্রিয়' : 'Active'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
