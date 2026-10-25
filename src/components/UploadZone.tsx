import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faCloudArrowUp,
  faFilePdf,
  faShieldHalved,
  faBolt,
  faLayerGroup,
  faFileLines,
} from '@fortawesome/free-solid-svg-icons';
import { Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  onLoadSample: () => void;
  lang: Language;
  isLoadingSample?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelect,
  onLoadSample,
  lang,
  isLoadingSample = false,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-8"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-3">
          <FontAwesomeIcon icon={faShieldHalved} className="text-emerald-500" />
          {t.offlineBadge}
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          {lang === 'bn' ? 'পিডিএফ ফাইল আপলোড করুন' : 'Upload your PDF Document'}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-light">
          {t.uploadDesc}
        </p>
      </motion.div>

      {/* Drop Target Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-14 text-center cursor-pointer transition-all duration-200 shadow-sm ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-slate-900/60 hover:shadow-md'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
          <FontAwesomeIcon icon={faCloudArrowUp} className="text-3xl animate-bounce" />
        </div>

        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          {t.uploadTitle}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto font-light">
          {lang === 'bn'
            ? 'পিডিএফ সিলেক্ট করতে ক্লিক করুন অথবা সরাসরি এখানে ড্রপ করুন'
            : 'Click to select from your device or drop your document directly here'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/25 flex items-center gap-2 cursor-pointer"
          >
            <FontAwesomeIcon icon={faFilePdf} />
            <span>{t.chooseFile}</span>
          </button>
        </div>
      </motion.div>

      {/* Instant Sample PDF Trigger */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {t.orTrySample}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLoadSample();
          }}
          disabled={isLoadingSample}
          className="px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100/70 dark:hover:bg-indigo-900/50 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faFileLines} />
          <span>{isLoadingSample ? '...' : t.loadSampleBtn}</span>
        </button>
      </div>

      {/* Feature Value Props */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5">
            <FontAwesomeIcon icon={faShieldHalved} className="text-sm" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {lang === 'bn' ? '১০০% অফলাইন নিরাপত্তা' : '100% Offline & Private'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
            {lang === 'bn'
              ? 'আপনার সংবেদনশীল ডকুমেন্টের কোনো ডেটা সার্ভারে যায় না।'
              : 'Zero network transfer. Your confidential files stay on your machine.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2.5">
            <FontAwesomeIcon icon={faLayerGroup} className="text-sm" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {lang === 'bn' ? 'হিন্দ শিলিগুড়ি লাইট ফন্ট' : 'Hind Siliguri Font'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
            {lang === 'bn'
              ? 'বাংলা যুক্তবর্ণ এবং আরবি ও ইংরেজি সংখ্যার স্পষ্ট নিখুঁত রেন্ডারিং।'
              : 'Crisp vector rendering for Bengali conjuncts, English and Arabic.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5">
            <FontAwesomeIcon icon={faBolt} className="text-sm" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {lang === 'bn' ? 'বড় ফাইল প্রসেসিং' : 'Smooth Large PDFs'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light">
            {lang === 'bn'
              ? 'স্মার্ট ক্যাশিংয়ের মাধ্যমে বড় ডকুমেন্টেও ব্রাউজার ক্র্যাশ করবে না।'
              : 'Low-memory streaming canvas renderer handles high page counts smoothly.'}
          </p>
        </div>
      </div>
    </div>
  );
};
