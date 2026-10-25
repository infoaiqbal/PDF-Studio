import React from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faFloppyDisk,
  faTrashCan,
  faArrowRight,
  faClockRotateLeft,
  faTriangleExclamation,
  faXmark,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons';
import { Language, DraftState } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onKeepDraftAndExit: () => void;
  onDiscardAndExit: () => void;
  onContinueEditing: () => void;
  lang: Language;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onKeepDraftAndExit,
  onDiscardAndExit,
  onContinueEditing,
  lang,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <FontAwesomeIcon icon={faTriangleExclamation} className="text-xl" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                {t.exitConfirmTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t.exitConfirmDesc}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-2.5">
            {/* 1. Keep Draft & Exit */}
            <button
              type="button"
              onClick={onKeepDraftAndExit}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer"
            >
              <FontAwesomeIcon icon={faFloppyDisk} />
              <span>{t.keepDraftAndExit}</span>
            </button>

            {/* 2. Discard & Exit */}
            <button
              type="button"
              onClick={onDiscardAndExit}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/50 dark:bg-rose-950/30 hover:bg-rose-100/50 text-rose-700 dark:text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FontAwesomeIcon icon={faTrashCan} />
              <span>{t.discardAndExit}</span>
            </button>

            {/* 3. Continue Editing */}
            <button
              type="button"
              onClick={onContinueEditing}
              className="w-full py-2 px-4 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-all cursor-pointer"
            >
              <span>{t.continueEditing}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface DraftRestorePromptProps {
  draft: DraftState | null;
  onRestore: () => void;
  onDismiss: () => void;
  lang: Language;
}

export const DraftRestorePrompt: React.FC<DraftRestorePromptProps> = ({
  draft,
  onRestore,
  onDismiss,
  lang,
}) => {
  const t = translations[lang];

  if (!draft) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 pt-3 pb-1"
    >
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50 dark:from-indigo-950/60 dark:via-slate-900 dark:to-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/30">
            <FontAwesomeIcon icon={faClockRotateLeft} className="text-base" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
              {t.draftRecoverTitle}
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 truncate flex items-center gap-1.5">
              <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                {draft.fileName || 'Document.pdf'}
              </span>
              <span>•</span>
              <span>
                {lang === 'bn'
                  ? `${draft.totalPages} পৃষ্ঠা | ${draft.stamps.length}টি ফটো/স্ট্যাম্প`
                  : `${draft.totalPages} pages | ${draft.stamps.length} stamps`}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={onDismiss}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium cursor-pointer transition-colors"
          >
            {t.dismissDraft}
          </button>
          <button
            type="button"
            onClick={onRestore}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="text-xs" />
            <span>{t.restoreDraft}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
