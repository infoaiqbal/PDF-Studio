import { NumeralSystem, PageNumberFormat } from '../types';

export const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/**
 * Converts any number or numeric string to Bengali digits (০-৯).
 */
export function toBengaliDigits(num: number | string): string {
  return String(num).replace(/[0-9]/g, (digit) => BENGALI_DIGITS[parseInt(digit, 10)]);
}

/**
 * Converts any number or numeric string to Arabic-Indic digits (٠-٩).
 */
export function toArabicDigits(num: number | string): string {
  return String(num).replace(/[0-9]/g, (digit) => ARABIC_DIGITS[parseInt(digit, 10)]);
}

/**
 * Converts number to specified numeral system.
 */
export function formatNumeral(num: number | string, system: NumeralSystem): string {
  switch (system) {
    case 'bengali':
      return toBengaliDigits(num);
    case 'arabic':
      return toArabicDigits(num);
    case 'english':
    default:
      return String(num);
  }
}

/**
 * Generates the full formatted string for a page number based on options.
 */
export function generatePageNumberText(
  currentPageIndex: number, // 1-indexed
  totalPages: number,
  format: PageNumberFormat,
  numeralSystem: NumeralSystem,
  startFrom: number = 1,
  language: 'bn' | 'en' = 'bn',
  prefixText: string = '',
  suffixText: string = ''
): string {
  // calculate displayed number
  const displayedNum = (currentPageIndex - 1) + startFrom;
  const numStr = formatNumeral(displayedNum, numeralSystem);
  const totalStr = formatNumeral(totalPages, numeralSystem);

  switch (format) {
    case 'number_only':
      return numStr;

    case 'page_of_total':
      if (language === 'bn' || numeralSystem === 'bengali') {
        return `পৃষ্ঠা ${numStr} / ${totalStr}`;
      } else if (numeralSystem === 'arabic') {
        return `صفحة ${numStr} من ${totalStr}`;
      } else {
        return `Page ${numStr} of ${totalStr}`;
      }

    case 'number_of_total':
      return `${numStr} / ${totalStr}`;

    case 'hyphenated':
      return `- ${numStr} -`;

    case 'page_prefix':
      if (language === 'bn' || numeralSystem === 'bengali') {
        return `পৃষ্ঠা ${numStr}`;
      } else if (numeralSystem === 'arabic') {
        return `صفحة ${numStr}`;
      } else {
        return `Page ${numStr}`;
      }

    case 'custom_text':
      return `${prefixText}${numStr}${suffixText}`;

    default:
      return numStr;
  }
}

/**
 * Checks whether a page should be excluded from page numbering or stamp.
 * Supports even/odd filtering (জোড়/বিজোড় পৃষ্ঠা নিয়ন্ত্রণ).
 */
export function isPageExcluded(
  pageNumber: number, // 1-indexed
  excludedPages: number[],
  skipFirstPage: boolean = false,
  filterMode: import('../types').PageFilterMode = 'all'
): boolean {
  if (skipFirstPage && pageNumber === 1) {
    return true;
  }
  // Odd pages only: exclude even pages (২, ৪, ৬...)
  if (filterMode === 'odd' && pageNumber % 2 === 0) {
    return true;
  }
  // Even pages only: exclude odd pages (১, ৩, ৫...)
  if (filterMode === 'even' && pageNumber % 2 !== 0) {
    return true;
  }
  return excludedPages.includes(pageNumber);
}

/**
 * Parse comma-separated page ranges (e.g. "1, 3, 5-7") into a list of numbers.
 */
export function parsePageRangeString(rangeStr: string, maxPage: number): number[] {
  if (!rangeStr.trim()) return [];
  const result = new Set<number>();
  const parts = rangeStr.split(/[,;\s]+/);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(maxPage, Math.max(start, end));
        for (let i = from; i <= to; i++) {
          result.add(i);
        }
      }
    } else {
      const val = parseInt(trimmed, 10);
      if (!isNaN(val) && val >= 1 && val <= maxPage) {
        result.add(val);
      }
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}
