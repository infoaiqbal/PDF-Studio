import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faHashtag,
  faSliders,
  faPalette,
  faEyeSlash,
  faCheck,
  faRotate,
  faChevronDown,
  faMagnet,
} from '@fortawesome/free-solid-svg-icons';
import { PageNumberConfig, NumeralSystem, PageNumberFormat, PageNumberPosition, Language } from '../types';
import { translations } from '../translations';
import { parsePageRangeString, formatNumeral } from '../utils/numbering';

interface DropdownItem<T> {
  value: T;
  label: string;
  sublabel?: string;
}

interface InAppDropdownProps<T> {
  value: T;
  options: DropdownItem<T>[];
  onChange: (val: T) => void;
  label: string;
}

function InAppDropdown<T extends string>({
  value,
  options,
  onChange,
  label,
}: InAppDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-xs font-medium px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2 shadow-2xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer text-left"
      >
        <span className="truncate">{selectedOption?.label}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`text-[10px] text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-500' : ''}`}
        />
      </button>

      {/* In-app CSS dropdown list placed directly in UI, NO native OS popup! */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl py-1 max-h-56 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="truncate">
                  <div>{opt.label}</div>
                  {opt.sublabel && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 font-light truncate">
                      {opt.sublabel}
                    </div>
                  )}
                </div>
                {isSelected && (
                  <FontAwesomeIcon icon={faCheck} className="text-[10px] text-indigo-600 dark:text-indigo-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs shadow-xs">
            <FontAwesomeIcon icon={faHashtag} />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {t.enableNumbers}
          </h3>
        </div>

        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => onChange({ ...config, enabled: e.target.checked })}
            className="sr-only peer"
            aria-label={t.enableNumbers}
          />
          <div className="w-10 h-5.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {config.enabled && (
        <div className="space-y-5">
          {/* 3 Compact In-App CSS Dropdowns in One Row: Language, Format, Position */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800">
            {/* 1. Numeral System (সংখ্যার ধরণ / ভাষা) */}
            <InAppDropdown<NumeralSystem>
              label={t.numeralSystem}
              value={config.numeralSystem}
              onChange={(val) => handleNumeralSystemChange(val)}
              options={[
                { value: 'bengali', label: 'বাংলা (১, ২, ৩)' },
                { value: 'english', label: 'ইংরেজি (1, 2, 3)' },
                { value: 'arabic', label: 'আরবি (١, ٢, ٣)' },
              ]}
            />

            {/* 2. Format Selection (নম্বরের ফরম্যাট) */}
            <InAppDropdown<PageNumberFormat>
              label={t.numberFormat}
              value={config.format}
              onChange={(val) => {
                if (val === 'custom_text') {
                  onChange({
                    ...config,
                    format: val,
                    prefixText: config.prefixText ?? (lang === 'bn' ? 'নাশিদের ' : "Nashid's "),
                    suffixText: config.suffixText ?? (lang === 'bn' ? ' ডায়েরি' : ' Diary'),
                  });
                } else {
                  handleFormatChange(val);
                }
              }}
              options={[
                { value: 'number_only', label: `${t.formatOnly} (১)` },
                {
                  value: 'page_of_total',
                  label: lang === 'bn' ? `পৃষ্ঠা ১ / ${totalPages}` : `Page 1 of ${totalPages}`,
                },
                { value: 'number_of_total', label: `১ / ${totalPages}` },
                { value: 'hyphenated', label: '- ১ -' },
                { value: 'page_prefix', label: `${t.formatPagePrefix} (পৃষ্ঠা ১)` },
                { value: 'custom_text', label: t.formatCustom },
              ]}
            />

            {/* 3. Page Number Position (পৃষ্ঠা নম্বরের অবস্থান) */}
            <InAppDropdown<PageNumberPosition>
              label={t.numberPosition}
              value={config.position}
              onChange={(val) => handlePositionChange(val)}
              options={[
                { value: 'bottom-center', label: t.posBottomCenter },
                { value: 'bottom-right', label: t.posBottomRight },
                { value: 'bottom-left', label: t.posBottomLeft },
                { value: 'top-center', label: t.posTopCenter },
                { value: 'top-right', label: t.posTopRight },
                { value: 'top-left', label: t.posTopLeft },
                ...(config.position === 'custom'
                  ? [{ value: 'custom' as PageNumberPosition, label: t.posCustom }]
                  : []),
              ]}
            />
          </div>

          {/* Custom Prefix & Suffix Controls (only shown when custom_text is active) */}
          {config.format === 'custom_text' && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-3">
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

          {/* Typography, Rotation & Color */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FontAwesomeIcon icon={faSliders} className="text-indigo-500" />
              <span>{lang === 'bn' ? 'ফন্ট ও স্টাইলিং' : 'Font & Appearance'}</span>
            </div>

            {/* Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Font Size */}
              <div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>{t.fontSize}</span>
                  <span className="font-mono font-medium">{config.fontSize} pt</span>
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
                  <span className="font-mono font-medium">{Math.round(config.opacity * 100)}%</span>
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
            </div>

            {/* Margin from edge */}
            <div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                <span>{t.marginOffset}</span>
                <span className="font-mono font-medium">{config.margin} pt</span>
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

            {/* Rotation Slider with Magnet Snapping at 0°, 90°, 180°, 270°, 360° */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faRotate} className="text-indigo-500 text-[11px]" />
                  <span>{t.numberRotation}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-mono font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 text-xs">
                    {config.rotation || 0}°
                    {[0, 90, 180, 270].includes(config.rotation || 0) && (
                      <FontAwesomeIcon icon={faMagnet} className="text-[10px] text-indigo-500" />
                    )}
                  </span>
                  {(config.rotation || 0) !== 0 && (
                    <button
                      type="button"
                      onClick={() => onChange({ ...config, rotation: 0 })}
                      className="text-[10px] text-slate-400 hover:text-rose-500 cursor-pointer"
                      title="Reset to 0°"
                    >
                      {lang === 'bn' ? 'রিসেট (০°)' : 'Reset (0°)'}
                    </button>
                  )}
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="1"
                value={config.rotation || 0}
                onChange={(e) => {
                  const raw = parseInt(e.target.value, 10);
                  const snapPoints = [0, 90, 180, 270, 360];
                  let snapped = raw;
                  for (const pt of snapPoints) {
                    if (Math.abs(raw - pt) <= 5) {
                      snapped = pt % 360;
                      break;
                    }
                  }
                  onChange({ ...config, rotation: snapped });
                }}
                className="w-full accent-indigo-600 cursor-pointer"
                aria-label={t.numberRotation}
              />
              <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                {[0, 90, 180, 270, 360].map((deg) => {
                  const targetVal = deg % 360;
                  const isCurrent = (config.rotation || 0) === targetVal;
                  return (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => onChange({ ...config, rotation: targetVal })}
                      className={`hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer font-mono inline-flex items-center gap-0.5 px-1 py-0.5 rounded transition-colors ${
                        isCurrent
                          ? 'font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60'
                          : ''
                      }`}
                      title={`${deg}°`}
                    >
                      <span>{deg}°</span>
                      <FontAwesomeIcon icon={faMagnet} className="text-[8px] opacity-60" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Color swatches */}
            <div>
              <div className="text-xs text-slate-600 dark:text-slate-400 mb-1.5 flex items-center justify-between">
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

          {/* Exclusions Section */}
          <div className="p-3.5 rounded-2xl bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <FontAwesomeIcon icon={faEyeSlash} className="text-amber-500" />
              <span>{lang === 'bn' ? 'পৃষ্ঠা ফিল্টার ও বাদ' : 'Page Filter & Exclusions'}</span>
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
                    className={`px-2 py-1.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
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
                className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
