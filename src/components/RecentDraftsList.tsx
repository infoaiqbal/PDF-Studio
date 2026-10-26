import React from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faFilePdf,
  faTrashCan,
  faArrowRight,
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

function getEditToolName(draft: DraftState, lang: Language): string {
  const hasNumbers = draft.numberConfig?.enabled;
  const hasStamps = draft.stamps && draft.stamps.length > 0;
  if (hasNumbers && hasStamps) {
    return lang === 'bn' ? 'পৃষ্ঠা নম্বর ও স্ট্যাম্প' : 'Numbers & Stamps';
  } else if (hasNumbers) {
    return lang === 'bn' ? 'পৃষ্ঠা নম্বর' : 'Page Numbers';
  } else if (hasStamps) {
    return lang === 'bn' ? 'স্ট্যাম্প ও ফটো' : 'Stamps & Photos';
  }
  return lang === 'bn' ? 'পিডিএফ এডিটর' : 'PDF Editor';
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
      <div className="w-full max-w-4xl mx-auto px-4 py-16 text-center">
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-6 sm:mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
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
        <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          {drafts.length} {lang === 'bn' ? 'টি ড্রাফট' : 'saved'}
        </span>
      </div>

      {/* Full-width Stack of Draft Items (পুরো লাইন জুড়ে থাকুক) */}
      <div className="w-full space-y-2.5">
        {drafts.map((draft) => {
          const relativeTime = formatRelativeTime(draft.timestamp, lang);
          const toolName = getEditToolName(draft, lang);

          return (
            <motion.div
              key={draft.id}
              whileHover={{ scale: 1.003 }}
              whileTap={{ scale: 0.995 }}
              onClick={() => onSelectDraft(draft)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-600 transition-all flex items-center justify-between gap-3 cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* PDF Icon */}
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-500 flex items-center justify-center text-lg shrink-0 border border-red-100 dark:border-red-900/40">
                  <FontAwesomeIcon icon={faFilePdf} />
                </div>

                {/* Two Lines Content Exactly as requested */}
                <div className="min-w-0 flex-1">
                  {/* প্রথম লাইনে শুধু ফাইলের নাম */}
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {draft.fileName || 'Untitled.pdf'}
                  </h4>

                  {/* দ্বিতীয় লাইনে ফাইল সাইজ, এডিট টুল এবং সর্বশেষ এডিট এর সময় */}
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400 font-light mt-0.5 truncate">
                    <span>{draft.formattedSize || '1.2 MB'}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {toolName}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span>{relativeTime}</span>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDraft(draft.id);
                  }}
                  aria-label={t.deleteDraft}
                  className="p-2 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title={t.deleteDraft}
                >
                  <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                </button>

                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-400 flex items-center justify-center text-xs transition-colors">
                  <FontAwesomeIcon icon={faArrowRight} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
