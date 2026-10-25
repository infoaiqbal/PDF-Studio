import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faImage,
  faUpload,
  faSliders,
  faArrowsRotate,
  faTrashCan,
  faStamp,
  faCheck,
  faCopy,
  faEyeSlash,
  faHandPointer,
  faArrowUp,
  faArrowDown,
  faArrowLeft,
  faArrowRight,
  faCrosshairs,
  faArrowsUpDownLeftRight,
} from '@fortawesome/free-solid-svg-icons';
import { StampItem, Language, PageFilterMode } from '../types';
import { translations } from '../translations';
import { createPresetStampSvg } from '../utils/presetStamps';
import { parsePageRangeString } from '../utils/numbering';

interface StampManagerProps {
  stamps: StampItem[];
  selectedStampId: string | null;
  onSelectStamp: (id: string | null) => void;
  onAddStamp: (stamp: StampItem) => void;
  onUpdateStamp: (stamp: StampItem) => void;
  onDeleteStamp: (id: string) => void;
  currentPage: number;
  totalPages: number;
  lang: Language;
}

export const StampManager: React.FC<StampManagerProps> = ({
  stamps,
  selectedStampId,
  onSelectStamp,
  onAddStamp,
  onUpdateStamp,
  onDeleteStamp,
  currentPage,
  totalPages,
  lang,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedStamp = stamps.find((s) => s.id === selectedStampId) || stamps[0];

  const [stampExcludeInput, setStampExcludeInput] = useState<string>(
    selectedStamp?.excludedPages.join(', ') || ''
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const aspect = (img.naturalWidth || 300) / (img.naturalHeight || 100);
          const newStamp: StampItem = {
            id: 'stamp_' + Date.now(),
            name: file.name.substring(0, 16),
            dataUrl,
            widthPercent: 28,
            aspectRatio: aspect,
            xPercent: 50,
            yPercent: 40,
            opacity: 0.9,
            rotation: 0,
            applyToAll: true, // Default: apply to all pages in exact spot as requested!
            targetPage: currentPage,
            excludedPages: [],
          };
          onAddStamp(newStamp);
          onSelectStamp(newStamp.id);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const addPreset = (
    type: 'approved' | 'confidential' | 'draft' | 'urgent' | 'signed'
  ) => {
    const dataUrl = createPresetStampSvg(type, lang);
    const names = {
      approved: t.stampApproved,
      confidential: t.stampConfidential,
      draft: t.stampDraft,
      urgent: t.stampUrgent,
      signed: t.stampSigned,
    };

    const newStamp: StampItem = {
      id: 'stamp_' + Date.now(),
      name: names[type],
      dataUrl,
      widthPercent: 32,
      aspectRatio: 360 / 130,
      xPercent: 50,
      yPercent: type === 'draft' ? 50 : 25,
      opacity: type === 'draft' ? 0.35 : 0.9,
      rotation: type === 'draft' ? -30 : 0,
      applyToAll: true, // As user requested: repeat across all pages
      targetPage: currentPage,
      excludedPages: [],
    };
    onAddStamp(newStamp);
    onSelectStamp(newStamp.id);
  };

  const handleExcludeChange = (val: string) => {
    setStampExcludeInput(val);
    if (selectedStamp) {
      const parsed = parsePageRangeString(val, totalPages);
      onUpdateStamp({
        ...selectedStamp,
        excludedPages: parsed,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload New Image Button */}
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          className="hidden"
          onChange={handleImageUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-xs"
        >
          <FontAwesomeIcon icon={faUpload} />
          <span>{t.uploadImage}</span>
        </button>
      </div>

      {/* Preset Ready Stamps */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {t.presetStamps}
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            { id: 'approved', label: t.stampApproved, color: 'text-emerald-600 border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/40 dark:border-emerald-800' },
            { id: 'confidential', label: t.stampConfidential, color: 'text-rose-600 border-rose-200 bg-rose-50/60 dark:bg-rose-950/40 dark:border-rose-800' },
            { id: 'draft', label: t.stampDraft, color: 'text-slate-600 border-slate-200 bg-slate-50/60 dark:bg-slate-800/40 dark:border-slate-700' },
            { id: 'urgent', label: t.stampUrgent, color: 'text-amber-600 border-amber-200 bg-amber-50/60 dark:bg-amber-950/40 dark:border-amber-800' },
            { id: 'signed', label: t.stampSigned, color: 'text-blue-600 border-blue-200 bg-blue-50/60 dark:bg-blue-950/40 dark:border-blue-800' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addPreset(item.id as any)}
              className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer hover:scale-102 ${item.color}`}
            >
              <FontAwesomeIcon icon={faStamp} className="mr-1.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stamps List & Active Stamp Editor */}
      {stamps.length > 0 && selectedStamp && (
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          {/* Stamps Selector Tabs if multiple */}
          {stamps.length > 1 && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                {lang === 'bn' ? 'যুক্ত করা ফটোগুলো' : 'Placed Photos/Stamps'}
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {stamps.map((s) => {
                  const isSel = s.id === selectedStamp.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => onSelectStamp(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                        isSel
                          ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-700 dark:text-indigo-300'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <FontAwesomeIcon icon={faImage} className="text-[10px]" />
                      <span className="truncate max-w-[90px]">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Stamp Preview Thumbnail & Remove */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center p-1 overflow-hidden">
                <img
                  src={selectedStamp.dataUrl}
                  alt={selectedStamp.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {selectedStamp.name}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light flex items-center gap-1">
                  <FontAwesomeIcon icon={faHandPointer} className="text-indigo-500 text-[10px]" />
                  <span>{lang === 'bn' ? 'পাতায় সরাসরি ড্র্যাগ করুন' : 'Drag directly on canvas'}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onDeleteStamp(selectedStamp.id)}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
              title={t.removeStamp}
              aria-label={t.removeStamp}
            >
              <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
            </button>
          </div>

          {/* Core Feature 1: Apply to all pages in this exact position */}
          <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStamp.applyToAll}
                onChange={(e) =>
                  onUpdateStamp({ ...selectedStamp, applyToAll: e.target.checked })
                }
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block">
                  {t.applyToAllPages}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-light block mt-0.5">
                  {t.applyToAllNotice}
                </span>
              </div>
            </label>
          </div>

          {/* Core Feature 2: Page Exclusion & Even/Odd Filter for this photo */}
          <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <FontAwesomeIcon icon={faEyeSlash} className="text-amber-500 text-xs" />
              <span>{lang === 'bn' ? 'পৃষ্ঠা ফিল্টার ও বাদ দেওয়ার তালিকা' : 'Page Filter & Exclusions'}</span>
            </div>

            {/* Even / Odd Filter for Stamp */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.pageFilter}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'all' as const, label: t.filterAll },
                  { id: 'odd' as const, label: t.filterOdd },
                  { id: 'even' as const, label: t.filterEven },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onUpdateStamp({
                        ...selectedStamp,
                        pageFilterMode: item.id,
                      })
                    }
                    className={`px-1.5 py-1.5 rounded-lg text-[11px] font-medium border text-center transition-all cursor-pointer ${
                      (selectedStamp.pageFilterMode || 'all') === item.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.excludeFromPages}
              </label>
              <input
                type="text"
                value={stampExcludeInput}
                onChange={(e) => handleExcludeChange(e.target.value)}
                placeholder="1, 3, 5-7"
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-light mt-1">
                {t.excludeStampHelp}
              </p>
            </div>
          </div>

          {/* Size & Opacity & Rotation Sliders */}
          <div className="space-y-3 pt-2">
            {/* Size Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>{t.stampScale}</span>
                <span className="font-mono">{selectedStamp.widthPercent}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="80"
                step="2"
                value={selectedStamp.widthPercent}
                onChange={(e) =>
                  onUpdateStamp({
                    ...selectedStamp,
                    widthPercent: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
                aria-label={t.stampScale}
              />
            </div>

            {/* Opacity / Watermark Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>{t.stampOpacity}</span>
                <span className="font-mono">{Math.round(selectedStamp.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={selectedStamp.opacity}
                onChange={(e) =>
                  onUpdateStamp({
                    ...selectedStamp,
                    opacity: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
                aria-label={t.stampOpacity}
              />
            </div>

            {/* Rotation Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>{t.stampRotation}</span>
                <span className="font-mono">{selectedStamp.rotation}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={selectedStamp.rotation}
                onChange={(e) =>
                  onUpdateStamp({
                    ...selectedStamp,
                    rotation: parseInt(e.target.value, 10),
                  })
                }
                className="w-full accent-indigo-600 cursor-pointer"
                aria-label={t.stampRotation}
              />
            </div>
          </div>

          {/* Nudge & Positioning section for Mobile & Precision Touch */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faArrowsUpDownLeftRight} className="text-indigo-500" />
                {t.nudgeControls}
              </span>
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                X: {Math.round(selectedStamp.xPercent)}% | Y: {Math.round(selectedStamp.yPercent)}%
              </span>
            </div>

            {/* Quick Position Presets */}
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() =>
                  onUpdateStamp({
                    ...selectedStamp,
                    xPercent: 20,
                    yPercent: 15,
                  })
                }
                className="py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-[11px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                {t.posTopLeft}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateStamp({
                    ...selectedStamp,
                    xPercent: 50,
                    yPercent: 50,
                  })
                }
                className="py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-[11px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                {t.alignCenter}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateStamp({
                    ...selectedStamp,
                    xPercent: 80,
                    yPercent: 15,
                  })
                }
                className="py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-[11px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                {t.alignTopRight}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateStamp({
                    ...selectedStamp,
                    xPercent: 20,
                    yPercent: 85,
                  })
                }
                className="py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-[11px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                {t.alignBottomLeft}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateStamp({
                    ...selectedStamp,
                    xPercent: 50,
                    yPercent: 85,
                  })
                }
                className="py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-[11px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                {t.posBottomCenter}
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateStamp({
                    ...selectedStamp,
                    xPercent: 80,
                    yPercent: 85,
                  })
                }
                className="py-1.5 px-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 text-[11px] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                {t.alignBottomRight}
              </button>
            </div>

            {/* Directional Nudge Pad (great for mobile) */}
            <div className="flex items-center justify-center pt-1">
              <div className="grid grid-cols-3 gap-1.5 w-36">
                <div></div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStamp({
                      ...selectedStamp,
                      yPercent: Math.max(5, selectedStamp.yPercent - 3),
                    })
                  }
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                  title="Move Up"
                  aria-label="Move Up"
                >
                  <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
                </button>
                <div></div>

                <button
                  type="button"
                  onClick={() =>
                    onUpdateStamp({
                      ...selectedStamp,
                      xPercent: Math.max(5, selectedStamp.xPercent - 3),
                    })
                  }
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                  title="Move Left"
                  aria-label="Move Left"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStamp({
                      ...selectedStamp,
                      xPercent: 50,
                      yPercent: 50,
                    })
                  }
                  className="p-2 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center cursor-pointer shadow-xs active:scale-95 text-[10px] font-bold"
                  title="Center"
                  aria-label="Center"
                >
                  <FontAwesomeIcon icon={faCrosshairs} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStamp({
                      ...selectedStamp,
                      xPercent: Math.min(95, selectedStamp.xPercent + 3),
                    })
                  }
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                  title="Move Right"
                  aria-label="Move Right"
                >
                  <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
                </button>

                <div></div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateStamp({
                      ...selectedStamp,
                      yPercent: Math.min(95, selectedStamp.yPercent + 3),
                    })
                  }
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer shadow-xs active:scale-95"
                  title="Move Down"
                  aria-label="Move Down"
                >
                  <FontAwesomeIcon icon={faArrowDown} className="text-xs" />
                </button>
                <div></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
