import React from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faCheck,
  faBan,
  faHashtag,
  faImage,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons';
import { PageNumberConfig, StampItem, Language } from '../types';
import { formatNumeral, isPageExcluded } from '../utils/numbering';
import { translations } from '../translations';

interface PageThumbnailsProps {
  totalPages: number;
  currentPage: number;
  onPageSelect: (page: number) => void;
  numberConfig: PageNumberConfig;
  onToggleNumberExclusion: (page: number) => void;
  stamps: StampItem[];
  lang: Language;
}

export const PageThumbnails: React.FC<PageThumbnailsProps> = ({
  totalPages,
  currentPage,
  onPageSelect,
  numberConfig,
  onToggleNumberExclusion,
  stamps,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          {t.pageOverviewTitle} ({totalPages})
        </h3>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-light">
          {lang === 'bn' ? 'ক্লিক করে পাতা বদলান বা বাদ দিন' : 'Click to jump or toggle exclusion'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
        {Array.from({ length: totalPages }).map((_, idx) => {
          const pageNum = idx + 1;
          const isSelected = currentPage === pageNum;
          const isNumExcluded = isPageExcluded(
            pageNum,
            numberConfig.excludedPages,
            numberConfig.skipFirstPage
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
              className={`p-3 rounded-2xl border text-left cursor-pointer transition-all relative ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 ring-2 ring-indigo-500/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300'
              }`}
            >
              {/* Thumbnail Representation Box */}
              <div className="aspect-[3/4] w-full rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 p-2 flex flex-col justify-between mb-2 relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold shadow-2xs">
                    {numDisplay}
                  </span>
                  {/* Status Indicator */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleNumberExclusion(pageNum);
                    }}
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] transition-colors cursor-pointer ${
                      isNumExcluded
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                    title={isNumExcluded ? t.excludeFromPage : t.includeOnPage}
                  >
                    <FontAwesomeIcon icon={isNumExcluded ? faBan : faCheck} />
                  </button>
                </div>

                {/* Simulated Content lines */}
                <div className="space-y-1 opacity-25">
                  <div className="h-1 bg-slate-400 rounded-full w-4/5" />
                  <div className="h-1 bg-slate-400 rounded-full w-full" />
                  <div className="h-1 bg-slate-400 rounded-full w-3/4" />
                </div>

                {/* Badges on page */}
                <div className="flex items-center gap-1">
                  {numberConfig.enabled && !isNumExcluded && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/80 dark:text-indigo-300 flex items-center gap-0.5 font-medium">
                      <FontAwesomeIcon icon={faHashtag} className="text-[7px]" />
                      <span>{numDisplay}</span>
                    </span>
                  )}
                  {activeStampsCount > 0 && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/80 dark:text-purple-300 flex items-center gap-0.5 font-medium">
                      <FontAwesomeIcon icon={faImage} className="text-[7px]" />
                      <span>{activeStampsCount}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300 flex justify-between items-center">
                <span>{lang === 'bn' ? `পৃষ্ঠা ${numDisplay}` : `Page ${numDisplay}`}</span>
                {isSelected && (
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                    ●
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
