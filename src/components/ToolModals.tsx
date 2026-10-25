import React from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faXmark,
  faWandMagicSparkles,
  faArrowRight,
  faHashtag,
  faLayerGroup,
} from '@fortawesome/free-solid-svg-icons';
import { ActiveTool, Language } from '../types';
import { translations } from '../translations';

interface ToolModalsProps {
  tool: ActiveTool | null;
  onClose: () => void;
  onGoToActiveTool: () => void;
  lang: Language;
}

export const ToolModals: React.FC<ToolModalsProps> = ({
  tool,
  onClose,
  onGoToActiveTool,
  lang,
}) => {
  if (!tool || tool === 'page_numbers_and_stamps') return null;

  const t = translations[lang];

  const toolDetails: Record<string, { title: string; desc: string; features: string[] }> = {
    merge_pdf: {
      title: t.toolMerge,
      desc: lang === 'bn'
        ? 'একাধিক পিডিএফ ফাইল সিলেক্ট করে ড্র্যাগ-অ্যান্ড-ড্রপ করে এক ফাইলে একত্রিত করার টুল।'
        : 'Merge multiple PDF documents together into a single master file with drag-and-drop page ordering.',
      features: [
        lang === 'bn' ? 'আনলিমিটেড ফাইল মার্জ' : 'Unlimited file merging',
        lang === 'bn' ? '১০০% অফলাইনে সুরক্ষিত' : '100% Offline client-side joining',
        lang === 'bn' ? 'ফাইল ক্রম পরিবর্তন সুবিধা' : 'Custom file re-ordering',
      ],
    },
    organize_pages: {
      title: t.toolOrganize,
      desc: lang === 'bn'
        ? 'পিডিএফের পাতার বিন্যাস বদলানো, অপ্রয়োজনীয় পৃষ্ঠা ডিলিট করা ও ৯০° রোটেট করার সুবিধা।'
        : 'Reorder, delete unwanted pages, and rotate landscape/portrait pages.',
      features: [
        lang === 'bn' ? 'পাতা ধরে ড্র্যাগ করে সাজানো' : 'Visual page drag reordering',
        lang === 'bn' ? '৯০° / ১৮০° পৃষ্ঠা ঘোরানো' : 'Rotate pages clockwise/counterclockwise',
        lang === 'bn' ? 'এক ক্লিকে পৃষ্ঠা মুছে ফেলা' : 'Single-click page deletion',
      ],
    },
    split_pdf: {
      title: t.toolSplit,
      desc: lang === 'bn'
        ? 'বড় পিডিএফ থেকে নির্দিষ্ট পৃষ্ঠাগুলো আলাদা করে নতুন পিডিএফ ফাইল হিসেবে বের করে নিন।'
        : 'Split large documents by page intervals or extract specific page numbers.',
      features: [
        lang === 'bn' ? 'পৃষ্ঠা রেঞ্জ দিয়ে আলাদা করা' : 'Split by custom ranges (e.g. 1-5, 6-10)',
        lang === 'bn' ? 'প্রতি পাতাকে একক ফাইল করা' : 'Extract each page as separate PDF',
      ],
    },
    images_to_pdf: {
      title: t.toolImagesToPdf,
      desc: lang === 'bn'
        ? 'জেপিজি ও পিএনজি ছবিগুলো থেকে ঝকঝকে পিডিএফ ডকুমেন্ট তৈরির টুল।'
        : 'Combine JPG, PNG, and WebP images into a clean standardized PDF booklet.',
      features: [
        lang === 'bn' ? 'এ৪ সাইজ স্বয়ংক্রিয় ফিট' : 'Auto A4 standard sizing',
        lang === 'bn' ? 'অরিজিনাল রেজোলিউশন সংরক্ষণ' : 'Retains maximum image clarity',
      ],
    },
  };

  const details = toolDetails[tool] || {
    title: 'Tool Info',
    desc: 'Feature coming soon in future iterations.',
    features: [],
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          aria-label="Close Modal"
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <FontAwesomeIcon icon={faXmark} />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
          <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xl" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          {details.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-light mb-4 leading-relaxed">
          {details.desc}
        </p>

        <div className="space-y-2 mb-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {lang === 'bn' ? 'পরিকল্পিত বৈশিষ্ট্য' : 'Planned Capabilities'}
          </div>
          {details.features.map((feat, i) => (
            <div key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>{feat}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              onClose();
              onGoToActiveTool();
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            <FontAwesomeIcon icon={faHashtag} />
            <span>{t.toolNumbersAndStamps}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
