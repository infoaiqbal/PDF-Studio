import React from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faFilePdf,
  faClock,
  faTrashCan,
  faArrowRight,
  faHashtag,
  faImage,
  faFolderOpen,
  faTableCellsLarge,
} from '@fortawesome/free-solid-svg-icons';
import { DraftState, Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';

interface RecentDraftsListProps {
  drafts: DraftState[];
  onSelectDraft: (draft: DraftState) => void;
  onDeleteDraft: (draftId: string) => void;
  onGoToTools?: () => void;
  lang: Language;
}

function formatRelativeTime(timestamp: number, lang: Language): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (lang === 'bn') {
    if (diffMin < 1) return 'এইমাত্র';
    if (diffMin < 60) return `${diffMin} মিনিট আগে`;
    if (diffHour < 24) return `${diffHour} ঘণ্টা আগে`;
    return `${diffDay} দিন আগে`;
  } else {
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    return `${diffDay}d ago`;
  }
}

export const RecentDraftsList: React.FC<RecentDraftsListProps> = ({
  drafts,
  onSelectDraft,
  onDeleteDraft,
  onGoToTools,
  lang,
}) => {
  const t = translations[lang];

  if (!drafts || drafts.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 text-indigo-500 flex items-center justify-center text-2xl shadow-inner">
          <FontAwesomeIcon icon={faFolderOpen} />
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
          {t.noDrafts}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mb-5 max-w-xs mx-auto leading-relaxed">
          {lang === 'bn'
            ? 'বর্তমানে কোনো সংরক্ষিত ড্রাফট নেই। নতুন পিডিএফ এডিট ও কাজ শুরু করতে নিচের "টুলস" অপশনে যান।'
            : 'No saved drafts found. Head over to the Tools tab below to edit and process your PDF documents.'}
        </p>
        {onGoToTools && (
          <button
            type="button"
            onClick={onGoToTools}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
          >
            <FontAwesomeIcon icon={faTableCellsLarge} />
            <span>{lang === 'bn' ? 'টুলস অপশনে যান' : 'Go to Tools'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-6 sm:mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">
            <FontAwesomeIcon icon={faFolderOpen} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t.homeDraftsTitle}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light hidden sm:block">
              {t.homeDraftsSubtitle}
            </p>
          </div>
        </div>
        <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {drafts.length} {lang === 'bn' ? 'টি ড্রাফট' : 'saved'}
        </span>
      </div>

      {/* Draft Cards List (Mobile: one after another, Desktop: 2 or 3 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {drafts.map((draft) => {
          const relativeTime = formatRelativeTime(draft.timestamp, lang);
          const hasNumbers = draft.numberConfig?.enabled;
          const stampCount = draft.stamps?.length || 0;

          return (
            <motion.div
              key={draft.id}
              whileHover={{ y: -2 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex flex-col justify-between gap-3 group relative"
            >
              <div>
                {/* Top Row: File icon, name & delete */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-500 flex items-center justify-center text-base shrink-0 border border-red-100 dark:border-red-900/40">
                      <FontAwesomeIcon icon={faFilePdf} />
                    </div>
                    <div className="min-w-0">
                      <h4
                        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
                        onClick={() => onSelectDraft(draft)}
                        title={draft.fileName}
                      >
                        {draft.fileName || 'Untitled.pdf'}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-light mt-0.5">
                        <span>{draft.totalPages} {lang === 'bn' ? 'পৃষ্ঠা' : 'pages'}</span>
                        {draft.formattedSize && <span>• {draft.formattedSize}</span>}
                        <span className="flex items-center gap-1 text-slate-400">
                          <FontAwesomeIcon icon={faClock} className="text-[9px]" />
                          <span>{relativeTime}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDraft(draft.id);
                    }}
                    aria-label={t.deleteDraft}
                    className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                    title={t.deleteDraft}
                  >
                    <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                  </button>
                </div>

                {/* Badges of what's inside */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                  {hasNumbers && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium flex items-center gap-1 border border-indigo-100 dark:border-indigo-900/40">
                      <FontAwesomeIcon icon={faHashtag} className="text-[9px]" />
                      <span>{lang === 'bn' ? 'পৃষ্ঠা নম্বর' : 'Page numbers'}</span>
                    </span>
                  )}
                  {stampCount > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1 border border-emerald-100 dark:border-emerald-900/40">
                      <FontAwesomeIcon icon={faImage} className="text-[9px]" />
                      <span>
                        {stampCount} {lang === 'bn' ? 'টি স্ট্যাম্প' : 'stamps'}
                      </span>
                    </span>
                  )}
                  {!hasNumbers && stampCount === 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                      {lang === 'bn' ? 'মূল ফাইল সংরক্ষিত' : 'Raw PDF preserved'}
                    </span>
                  )}
                </div>
              </div>

              {/* Instant Resume Button */}
              <button
                type="button"
                onClick={() => onSelectDraft(draft)}
                className="w-full py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 dark:hover:text-white text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-between transition-all cursor-pointer border border-indigo-200/80 dark:border-indigo-800/80"
              >
                <span>{t.resumeDraft}</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
