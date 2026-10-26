export type NumeralSystem = 'bengali' | 'english' | 'arabic';

export type PageNumberPosition =
  | 'bottom-center'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'top-left'
  | 'top-right'
  | 'custom';

export type PageNumberFormat =
  | 'number_only' // ১
  | 'page_of_total' // পৃষ্ঠা ১ / ১০ or Page 1 of 10
  | 'number_of_total' // ১ / ১০ or 1 / 10
  | 'hyphenated' // - ১ - or - 1 -
  | 'page_prefix' // পৃষ্ঠা ১ or Page 1
  | 'custom_text'; // যেমন: নাশিদের ১ ডায়েরি (Custom prefix & suffix)

export type PageFilterMode = 'all' | 'odd' | 'even'; // সকল পৃষ্ঠা | শুধু বিজোড় | শুধু জোড়

export interface PageNumberConfig {
  enabled: boolean;
  numeralSystem: NumeralSystem;
  position: PageNumberPosition;
  format: PageNumberFormat;
  fontSize: number; // 10 to 36
  fontColor: string; // hex
  opacity: number; // 0.1 to 1.0
  margin: number; // points from page edges (default 32)
  customXPercent: number; // 0-100% of page width
  customYPercent: number; // 0-100% of page height
  startFrom: number; // start numbering from (default 1)
  skipFirstPage: boolean; // whether to skip cover page
  excludedPages: number[]; // 1-indexed array of excluded pages
  prefixText?: string; // Text before number (e.g. "নাশিদের ")
  suffixText?: string; // Text after number (e.g. " ডায়েরি")
  pageFilterMode?: PageFilterMode; // 'all' | 'odd' | 'even'
  rotation?: number; // Rotation angle 0-360 degrees (রোটেশন / রুট)
  layer?: 'above_stamps' | 'below_stamps'; // Layer order (স্ট্যাম্প বা ছবির উপরে যেন রাখা যায়)
}

export interface StampItem {
  id: string;
  name: string;
  dataUrl: string;
  widthPercent: number; // % of page width (default 25%)
  aspectRatio: number; // width / height
  xPercent: number; // 0-100% (from left)
  yPercent: number; // 0-100% (from top)
  opacity: number; // 0.1 to 1.0
  rotation: number; // 0 to 360 degrees
  applyToAll: boolean; // if true, applies to all non-excluded pages
  targetPage: number; // if applyToAll is false, which page it appears on
  excludedPages: number[]; // pages where this stamp should NOT appear
  pageFilterMode?: PageFilterMode; // 'all' | 'odd' | 'even'
}

export type ActiveTool =
  | 'page_numbers_and_stamps'
  | 'merge_pdf'
  | 'organize_pages'
  | 'split_pdf'
  | 'images_to_pdf';

export type Language = 'bn' | 'en';
export type Theme = 'light' | 'dark';

export interface DraftState {
  id: string;
  hasDraft: boolean;
  timestamp: number;
  fileName: string;
  fileSizeBytes?: number;
  formattedSize?: string;
  totalPages: number;
  currentPage: number;
  numberConfig: PageNumberConfig;
  stamps: StampItem[];
  activeTab: 'numbers' | 'stamps' | 'pages';
  sampleUsed?: boolean;
}

