import React, { useState } from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faHouse,
  faTableCellsLarge,
  faFloppyDisk,
  faBars,
  faXmark,
  faSun,
  faMoon,
  faLanguage,
  faTrashCan,
  faShieldHalved,
  faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import { Language, Theme } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';

interface BottomNavProps {
  currentView: 'home' | 'tools' | 'tool';
  hasFile: boolean;
  onGoHome: () => void;
  onOpenTools: () => void;
  isDraftSaved: boolean;
  onClearDraft?: () => void;
  lang: Language;
  onToggleLang: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  onShowDraftNotice?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  hasFile,
  onGoHome,
  onOpenTools,
  isDraftSaved,
  onClearDraft,
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  onShowDraftNotice,
}) => {
  const t = translations[lang];
  const [showMoreMenu, setShowMoreMenu] = useState<boolean>(false);

  return (
    <>
      {/* Mobile Bottom Fixed Bar (Only visible on screens below lg) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-4 py-1.5 transition-colors">
        <div className="max-w-md mx-auto grid grid-cols-3 items-center">
          {/* 1. Home (Shows Saved Drafts) */}
          <button
            type="button"
            onClick={onGoHome}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'home' && !hasFile
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={faHouse} className="text-lg mb-0.5" />
            <span className="text-[11px] leading-tight font-medium">{t.navHome}</span>
          </button>

          {/* 2. Tools (Tool Grid Only) */}
          <button
            type="button"
            onClick={onOpenTools}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              currentView === 'tools'
                ? 'text-indigo-600 dark:text-indigo-400 font-bold scale-105'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FontAwesomeIcon icon={faTableCellsLarge} className="text-lg mb-0.5" />
            <span className="text-[11px] leading-tight font-medium">{t.navTools}</span>
          </button>

          {/* 3. More (Three lines) */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all cursor-pointer"
          >
            <FontAwesomeIcon icon={faBars} className="text-lg mb-0.5" />
            <span className="text-[11px] leading-tight font-medium">{t.navMore}</span>
          </button>
        </div>
      </nav>

      {/* Slide-up "More Options" Sheet */}
      <AnimatePresence>
        {showMoreMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMoreMenu(false)}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end justify-center lg:hidden"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 p-5 shadow-2xl max-w-lg space-y-4 pb-8"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faBars} className="text-sm" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t.moreMenuTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMoreMenu(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  aria-label="Close"
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </div>

              {/* Menu Actions */}
              <div className="space-y-2">
                {/* Language Switch */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleLang();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                      <FontAwesomeIcon icon={faLanguage} className="text-base" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {lang === 'bn' ? 'ভাষা পরিবর্তন (Language)' : 'Switch Language'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {lang === 'bn' ? 'বর্তমান: বাংলা' : 'Current: English'}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60">
                    {lang === 'bn' ? 'English' : 'বাংলা'}
                  </span>
                </button>

                {/* Theme Switch */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
                      <FontAwesomeIcon icon={theme === 'dark' ? faSun : faMoon} className="text-base" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {theme === 'dark' ? t.themeLight : t.themeDark}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {theme === 'dark' ? (lang === 'bn' ? 'লাইট মোডে পরিবর্তন' : 'Switch to light') : (lang === 'bn' ? 'ডার্ক মোডে পরিবর্তন' : 'Switch to dark')}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {theme === 'dark' ? 'Light' : 'Dark'}
                  </span>
                </button>

                {/* Draft management */}
                {isDraftSaved && onClearDraft && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearDraft();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-100/50 transition-colors cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 flex items-center justify-center">
                        <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                          {t.clearDraft}
                        </div>
                        <div className="text-[11px] text-rose-600/70 dark:text-rose-400">
                          {lang === 'bn' ? 'লোকাল স্টোরেজের ড্রাফট বাতিল করুন' : 'Remove locally cached draft'}
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Offline & Security Badge */}
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-sm" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <span>{t.offlineBadge}</span>
                      <FontAwesomeIcon icon={faCircleCheck} className="text-[10px]" />
                    </div>
                    <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-light mt-0.5">
                      {t.aboutAppDesc}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
