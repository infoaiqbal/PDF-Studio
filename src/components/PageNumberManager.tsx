import React, { useState } from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faHashtag,
  faSliders,
  faPalette,
  faEyeSlash,
  faCheck,
  faRotate,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { PageNumberConfig, NumeralSystem, PageNumberFormat, PageNumberPosition, Language } from '../types';
import { translations } from '../translations';
import { parsePageRangeString, formatNumeral } from '../utils/numbering';

interface PageNumberManagerProps {
  config: PageNumberConfig;
  onChange: (config: PageNumberConfig) => void;
  totalPages: number;
  lang: Language;
}

export const PageNumberManager: React.FC<PageNumberManagerProps> = ({
  config,
  onChange,
  totalPages,
  lang,
}) => {
  const t = translations[lang];
  const [excludeInput, setExcludeInput] = useState<string>(
    config.excludedPages.join(', ')
  );

  const handleNumeralSystemChange = (system: NumeralSystem) => {
    onChange({ ...config, numeralSystem: system });
  };

  const handleFormatChange = (format: PageNumberFormat) => {
    onChange({ ...config, format });
  };

  const handlePositionChange = (position: PageNumberPosition) => {
    onChange({ ...config, position });
  };

  const handleExcludeInputChange = (val: string) => {
    setExcludeInput(val);
    const parsed = parsePageRangeString(val, totalPages);
    onChange({ ...config, excludedPages: parsed });
  };

  const colorPresets = [
    '#0f172a', // Slate 900
    '#334155', // Slate 700
    '#2563eb', // Blue
    '#dc2626', // Red
    '#16a34a', // Emerald
    '#7c3aed', // Purple
  ];

  const positions: { id: PageNumberPosition; label: string; iconPos: string }[] = [
    { id: 'top-left', label: t.posTopLeft, iconPos: 'items-start justify-start' },
    { id: 'top-center', label: t.posTopCenter, iconPos: 'items-start justify-center' },
    { id: 'top-right', label: t.posTopRight, iconPos: 'items-start justify-end' },
    { id: 'bottom-left', label: t.posBottomLeft, iconPos: 'items-end justify-start' },
    { id: 'bottom-center', label: t.posBottomCenter, iconPos: 'items-end justify-center' },
    { id: 'bottom-right', label: t.posBottomRight, iconPos: 'items-end justify-end' },
  ];

  return (
    <div className="space-y-6">
      {/* Enable Toggle Card */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <FontAwesomeIcon icon={faHashtag} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {t.enableNumbers}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
              {lang === 'bn'
                ? 'পিডিএফের পাতায় স্বয়ংক্রিয় পৃষ্ঠা ক্রমিক যোগ করুন'
                : 'Automatically stamp page sequences'}
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
            className="sr-only peer"
            aria-label={t.enableNumbers}
          />
          <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {config.enabled && (
        <div className="space-y-5">
          {/* Numeral System (বাংলা, ইংরেজি, আরবি) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t.numeralSystem}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bengali' as NumeralSystem, name: t.numeralBengali, sample: '১, ২, ৩' },
                { id: 'english' as NumeralSystem, name: t.numeralEnglish, sample: '1, 2, 3' },
                { id: 'arabic' as NumeralSystem, name: t.numeralArabic, sample: '١, ٢, ٣' },
              ].map((sys) => {
                const isSelected = config.numeralSystem === sys.id;
                return (
                  <button
                    key={sys.id}
                    type="button"
                    onClick={() => handleNumeralSystemChange(sys.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-medium shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-semibold">{sys.name}</div>
                    <div className="text-xs opacity-80 mt-0.5 tracking-wider">{sys.sample}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t.numberFormat}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                {
                  id: 'number_only' as PageNumberFormat,
                  label: t.formatOnly,
                  preview: formatNumeral(1, config.numeralSystem),
                },
                {
                  id: 'page_of_total' as PageNumberFormat,
                  label: t.formatPageOfTotal,
                  preview:
                    config.numeralSystem === 'arabic'
                      ? `صفحة ${formatNumeral(1, 'arabic')} من ${formatNumeral(totalPages, 'arabic')}`
                      : lang === 'bn' || config.numeralSystem === 'bengali'
                      ? `পৃষ্ঠা ${formatNumeral(1, 'bengali')} / ${formatNumeral(totalPages, 'bengali')}`
                      : `Page ${formatNumeral(1, 'english')} of ${formatNumeral(totalPages, 'english')}`,
                },
                {
                  id: 'number_of_total' as PageNumberFormat,
                  label: t.formatNumberOfTotal,
                  preview: `${formatNumeral(1, config.numeralSystem)} / ${formatNumeral(totalPages, config.numeralSystem)}`,
                },
                {
                  id: 'hyphenated' as PageNumberFormat,
                  label: t.formatHyphen,
                  preview: `- ${formatNumeral(1, config.numeralSystem)} -`,
                },
                {
                  id: 'page_prefix' as PageNumberFormat,
                  label: t.formatPagePrefix,
                  preview:
                    config.numeralSystem === 'arabic'
                      ? `صفحة ${formatNumeral(1, 'arabic')}`
                      : lang === 'bn' || config.numeralSystem === 'bengali'
                      ? `পৃষ্ঠা ${formatNumeral(1, 'bengali')}`
                      : `Page ${formatNumeral(1, 'english')}`,
                },
                {
                  id: 'custom_text' as PageNumberFormat,
                  label: t.formatCustom,
                  preview: `${config.prefixText ?? (lang === 'bn' ? 'নাশিদের ' : "Nashid's ")}${formatNumeral(1, config.numeralSystem)}${config.suffixText ?? (lang === 'bn' ? ' ডায়েরি' : ' Diary')}`,
                },
              ].map((fmt) => {
                const isSelected = config.format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      if (fmt.id === 'custom_text') {
                        onChange({
                          ...config,
                          format: fmt.id,
                          prefixText: config.prefixText ?? (lang === 'bn' ? 'নাশিদের ' : "Nashid's "),
                          suffixText: config.suffixText ?? (lang === 'bn' ? ' ডায়েরি' : ' Diary'),
                        });
                      } else {
                        handleFormatChange(fmt.id);
                      }
                    }}
                    className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-medium'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="text-xs font-semibold truncate">{fmt.label}</div>
                    <div className="text-[11px] opacity-75 mt-0.5 truncate">{fmt.preview}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Prefix & Suffix Controls */}
            {config.format === 'custom_text' && (
              <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
                <div className="text-xs font-semibold text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <span>{t.formatCustom}</span>
                  <span className="text-[11px] font-normal text-indigo-600 dark:text-indigo-400">
                    {lang === 'bn' ? 'বই বা ডকুমেন্টের নাম যোগ করুন' : 'Add book title or prefix'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.prefixLabel}
                    </label>
                    <input
                      type="text"
                      value={config.prefixText ?? ''}
                      onChange={(e) => onChange({ ...config, prefixText: e.target.value })}
                      placeholder={t.prefixPlaceholder}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
                      {t.suffixLabel}
                    </label>
                    <input
                      type="text"
                      value={config.suffixText ?? ''}
                      onChange={(e) => onChange({ ...config, suffixText: e.target.value })}
                      placeholder={t.suffixPlaceholder}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Quick Preset Example Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                    {lang === 'bn' ? 'দ্রুত প্রিসেট:' : 'Quick Presets:'}
                  </span>
                  {[
                    { pre: 'নাশিদের ', suf: ' ডায়েরি', label: 'নাশিদের [১] ডায়েরি' },
                    { pre: 'অধ্যায় ', suf: '', label: 'অধ্যায় [১]' },
                    { pre: 'বইয়ের নাম ', suf: ' • পৃষ্ঠা', label: 'বইয়ের নাম [১] • পৃষ্ঠা' },
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        onChange({
                          ...config,
                          prefixText: chip.pre,
                          suffixText: chip.suf,
                        })
                      }
                      className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 cursor-pointer transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Live Output Banner */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {t.customPreviewLabel}
                  </span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-['Hind_Siliguri'] text-sm">
                    {`${config.prefixText ?? ''}${formatNumeral(1, config.numeralSystem)}${config.suffixText ?? ''}`}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Position Selector (6 visual boxes) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              {t.numberPosition}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {positions.map((pos) => {
                const isSelected = config.position === pos.id;
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => handlePositionChange(pos.id)}
                    className={`h-16 rounded-xl border p-2 flex flex-col justify-between transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-900/50'
                    }`}
                  >
                    {/* Mini simulated document layout */}
                    <div className={`w-full h-7 border border-dashed rounded flex p-1 ${pos.iconPos} ${
                      isSelected ? 'border-indigo-400 bg-indigo-100/50 dark:bg-indigo-900/40' : 'border-slate-300 dark:border-slate-700'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate w-full text-center">
                      {pos.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography & Color controls */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FontAwesomeIcon icon={faSliders} className="text-indigo-500" />
              <span>{lang === 'bn' ? 'ফন্ট ও স্টাইলিং' : 'Font & Appearance'}</span>
            </div>

            {/* Font Size */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>{t.fontSize}</span>
                <span className="font-mono">{config.fontSize} pt</span>
              </div>
              <input
                type="range"
                min="10"
                max="36"
                step="1"
                value={config.fontSize}
                onChange={(e) => onChange({ ...config, fontSize: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600 cursor-pointer"
                aria-label={t.fontSize}
              />
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>{t.fontOpacity}</span>
                <span className="font-mono">{Math.round(config.opacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={config.opacity}
                onChange={(e) => onChange({ ...config, opacity: parseFloat(e.target.value) })}
                className="w-full accent-indigo-600 cursor-pointer"
                aria-label={t.fontOpacity}
              />
            </div>

            {/* Margin from edge */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>{t.marginOffset}</span>
                <span className="font-mono">{config.margin} pt</span>
              </div>
              <input
                type="range"
                min="12"
                max="60"
                step="2"
                value={config.margin}
                onChange={(e) => onChange({ ...config, margin: parseInt(e.target.value, 10) })}
                className="w-full accent-indigo-600 cursor-pointer"
                aria-label={t.marginOffset}
              />
            </div>

            {/* Color swatches */}
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-2 flex items-center justify-between">
                <span>{t.fontColor}</span>
                <span className="font-mono text-[11px]">{config.fontColor}</span>
              </div>
              <div className="flex items-center gap-2">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onChange({ ...config, fontColor: c })}
                    style={{ backgroundColor: c }}
                    className="w-7 h-7 rounded-lg border-2 border-white dark:border-slate-800 shadow-xs flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                    aria-label={`Color ${c}`}
                  >
                    {config.fontColor === c && (
                      <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
                    )}
                  </button>
                ))}
                <input
                  type="color"
                  value={config.fontColor}
                  onChange={(e) => onChange({ ...config, fontColor: e.target.value })}
                  className="w-7 h-7 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                  title="Custom Color"
                  aria-label="Custom Color Picker"
                />
              </div>
            </div>
          </div>

          {/* Rotation & Layering Controls (রুট ও স্ট্যাম্পের উপরে রাখার অপশন) */}
          <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-900/40 space-y-3.5">
            {/* 1. Rotation (রুট / ঘোরানো) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faRotate} className="text-indigo-500 text-[11px]" />
                  <span>{t.numberRotation}</span>
                </label>
                <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                  {config.rotation || 0}°
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {([0, 90, 180, 270] as const).map((deg) => (
                  <button
                    key={deg}
                    type="button"
                    onClick={() => onChange({ ...config, rotation: deg })}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      (config.rotation || 0) === deg
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {deg}°
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Layering (স্ট্যাম্পের উপরে রাখা যাতে ঢাকা না পড়ে) */}
            <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/60">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                <FontAwesomeIcon icon={faLayerGroup} className="text-indigo-500 text-[11px]" />
                <span>{t.numberLayer}</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onChange({ ...config, layer: 'above_stamps' })}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    (config.layer || 'above_stamps') === 'above_stamps'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="leading-snug">{t.layerAboveStamps}</div>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...config, layer: 'below_stamps' })}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    config.layer === 'below_stamps'
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="leading-snug">{t.layerBelowStamps}</div>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-light mt-1.5">
                {t.layerHelp}
              </p>
            </div>
          </div>

          {/* Exclusions Section */}
          <div className="p-4 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <FontAwesomeIcon icon={faEyeSlash} className="text-amber-500" />
              <span>{lang === 'bn' ? 'পৃষ্ঠা বাদ দেওয়ার ও ফিল্টারিং সেটিংস' : 'Page Exclusions & Filter'}</span>
            </div>

            {/* Even / Odd Page Filter Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {t.pageFilter}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all' as const, label: t.filterAll },
                  { id: 'odd' as const, label: t.filterOdd },
                  { id: 'even' as const, label: t.filterEven },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange({ ...config, pageFilterMode: item.id })}
                    className={`px-2 py-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      (config.pageFilterMode || 'all') === item.id
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Skip First Page Toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={config.skipFirstPage}
                onChange={(e) => onChange({ ...config, skipFirstPage: e.target.checked })}
                className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                {t.skipFirstPage}
              </span>
            </label>

            {/* Custom Excluded Pages Input */}
            <div>
              <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                {t.excludePages}
              </label>
              <input
                type="text"
                value={excludeInput}
                onChange={(e) => handleExcludeInputChange(e.target.value)}
                placeholder={t.excludePlaceholder}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-light">
                {t.excludeHelp}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
