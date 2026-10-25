import React from 'react';
import { FontAwesomeIcon } from './FontAwesomeIcon';
import {
  faHashtag,
  faObjectGroup,
  faRotate,
  faScissors,
  faImages,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { ActiveTool, Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';

interface HomeToolGridProps {
  onSelectTool: (tool: ActiveTool) => void;
  lang: Language;
}

export const HomeToolGrid: React.FC<HomeToolGridProps> = ({
  onSelectTool,
  lang,
}) => {
  const t = translations[lang];

  const tools = [
    {
      id: 'page_numbers_and_stamps' as ActiveTool,
      name: t.toolNumbersAndStamps,
      desc: t.toolNumbersAndStampsDesc,
      icon: faHashtag,
      active: true,
      color: 'from-blue-600 to-indigo-600',
      badgeColor: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300',
    },
    {
      id: 'merge_pdf' as ActiveTool,
      name: t.toolMerge,
      desc: t.toolMergeDesc,
      icon: faObjectGroup,
      active: false,
      color: 'from-emerald-600 to-teal-600',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    },
    {
      id: 'organize_pages' as ActiveTool,
      name: t.toolOrganize,
      desc: t.toolOrganizeDesc,
      icon: faRotate,
      active: false,
      color: 'from-amber-600 to-orange-600',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    },
    {
      id: 'split_pdf' as ActiveTool,
      name: t.toolSplit,
      desc: t.toolSplitDesc,
      icon: faScissors,
      active: false,
      color: 'from-rose-600 to-pink-600',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    },
    {
      id: 'images_to_pdf' as ActiveTool,
      name: t.toolImagesToPdf,
      desc: t.toolImagesToPdfDesc,
      icon: faImages,
      active: false,
      color: 'from-violet-600 to-purple-600',
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-6 pb-2">
      {/* Title */}
      <div className="text-center sm:text-left mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
          <span>{t.homeToolsTitle}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-light mt-0.5">
          {t.homeToolsSubtitle}
        </p>
      </div>

      {/* Grid: Exactly 2 columns on mobile, 3 on tablet, 5 on desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {tools.map((tool) => {
          return (
            <motion.button
              key={tool.id}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectTool(tool.id)}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative shadow-xs hover:shadow-md ${
                tool.active
                  ? 'border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 hover:border-indigo-500 ring-1 ring-indigo-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Icon & Status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm sm:text-base text-white bg-gradient-to-br ${tool.color} shadow-xs shrink-0`}
                  >
                    <FontAwesomeIcon icon={tool.icon} />
                  </div>
                  <span
                    className={`text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full font-semibold shrink-0 ${tool.badgeColor}`}
                  >
                    {tool.active ? t.activeToolBadge : t.comingSoon}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1 leading-snug">
                  {tool.name}
                </h3>

                {/* Desc */}
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-light leading-relaxed line-clamp-2">
                  {tool.desc}
                </p>
              </div>

              {/* Action indicator */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                <span>{tool.active ? (lang === 'bn' ? 'ব্যবহার করুন' : 'Open Tool') : (lang === 'bn' ? 'বিবরণ দেখুন' : 'Details')}</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
