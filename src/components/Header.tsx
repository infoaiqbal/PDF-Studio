import React from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faFilePdf,
  faShieldHalved,
  faDownload,
  faSpinner,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import { Language } from '../types';
import { translations } from '../translations';

interface HeaderProps {
  lang: Language;
  hasFile: boolean;
  fileName?: string;
  fileSize?: string;
  totalPages?: number;
  onDownload?: () => void;
  isProcessing?: boolean;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  hasFile,
  fileName,
  fileSize,
  totalPages,
  onDownload,
  isProcessing = false,
  onGoHome,
}) => {
  const t = translations[lang];

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-40 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Left Side: App Icon + Name / Active File Info */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            {/* If editing file: show Back/Exit button */}
            {hasFile && onGoHome && (
              <button
                type="button"
                onClick={onGoHome}
                className="p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                title={lang === 'bn' ? 'হোমে ফিরে যান' : 'Back to Home'}
                aria-label="Back to Home"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              </button>
            )}

            {/* App Icon */}
            <div
              onClick={!hasFile ? onGoHome : undefined}
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 ${
                !hasFile && onGoHome ? 'cursor-pointer hover:opacity-90' : ''
              }`}
            >
              <FontAwesomeIcon icon={faFilePdf} className="text-base sm:text-xl" />
            </div>

            {/* When NOT editing a file: Only show App Name & Offline badge */}
            {!hasFile ? (
              <div
                onClick={onGoHome}
                className={`min-w-0 ${onGoHome ? 'cursor-pointer hover:opacity-90' : ''}`}
              >
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-bold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 dark:from-indigo-400 dark:to-blue-400 bg-clip-text text-transparent truncate">
                    {t.appTitle}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[9px] sm:text-[10px]" />
                    <span className="hidden xs:inline">{t.offlineBadge}</span>
                    <span className="xs:hidden">অফলাইন</span>
                  </span>
                </div>
              </div>
            ) : (
              /* When editing a file: Show PDF File Name, Size & Pages */
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate max-w-[140px] xs:max-w-[190px] sm:max-w-xs md:max-w-md">
                    {fileName || 'document.pdf'}
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-light truncate mt-0.5">
                  {totalPages && (
                    <span>
                      {totalPages} {lang === 'bn' ? 'পৃষ্ঠা' : 'pages'}
                    </span>
                  )}
                  {fileSize && <span>• {fileSize}</span>}
                  <span className="hidden sm:inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    • <FontAwesomeIcon icon={faShieldHalved} className="text-[9px]" />
                    <span>অফলাইন</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: When editing, Download Button is right here! When on home, clean! */}
          <div className="flex items-center gap-2 shrink-0">
            {hasFile && onDownload && (
              <button
                type="button"
                onClick={onDownload}
                disabled={isProcessing}
                className="py-1.5 px-3 sm:py-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-indigo-500/25 transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white disabled:opacity-50 active:scale-95"
                title={t.downloadPdf}
              >
                <FontAwesomeIcon
                  icon={isProcessing ? faSpinner : faDownload}
                  className={`text-xs sm:text-sm ${isProcessing ? 'animate-spin' : ''}`}
                />
                <span>{isProcessing ? t.downloading : t.downloadHeaderBtn}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
