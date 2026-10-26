/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FontAwesomeIcon } from './components/FontAwesomeIcon';
import {
  faDownload,
  faArrowLeft,
  faHashtag,
  faImage,
  faListCheck,
  faCircleCheck,
  faSpinner,
  faRotateRight,
  faEye,
  faFilePdf,
  faSliders,
  faTableCellsLarge,
} from '@fortawesome/free-solid-svg-icons';
import { Header } from './components/Header';
import { HomeToolGrid } from './components/HomeToolGrid';
import { RecentDraftsList } from './components/RecentDraftsList';
import { UploadZone } from './components/UploadZone';
import { PDFCanvasViewer } from './components/PDFCanvasViewer';
import { PageNumberManager } from './components/PageNumberManager';
import { StampManager } from './components/StampManager';
import { PageThumbnails } from './components/PageThumbnails';
import { ToolModals } from './components/ToolModals';
import { BottomNav } from './components/BottomNav';
import { ExitConfirmModal } from './components/DraftModals';
import {
  saveDraftToStorage,
  getAllDraftsFromStorage,
  loadDraftBytes,
  deleteDraftFromStorage,
  clearAllDraftsFromStorage,
  formatBytes,
} from './utils/draftStorage';
import {
  Language,
  Theme,
  ActiveTool,
  PageNumberConfig,
  StampItem,
  DraftState,
} from './types';
import { translations } from './translations';
import { createSamplePdf } from './utils/samplePdf';
import { processAndExportPdf, triggerFileDownload } from './utils/pdfProcessor';
import { motion, AnimatePresence } from 'motion/react';

// Configure pdfjs worker if not already set
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pdf_studio_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    }
    return 'light';
  });
  const [activeTool, setActiveTool] = useState<ActiveTool>('page_numbers_and_stamps');
  const [modalTool, setModalTool] = useState<ActiveTool | null>(null);
  const [viewMode, setViewMode] = useState<'home' | 'tools' | 'tool'>('home');

  // Multi-Drafts State
  const [draftsList, setDraftsList] = useState<DraftState[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [sampleUsed, setSampleUsed] = useState<boolean>(false);
  const [isDraftSaved, setIsDraftSaved] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [pendingExitAction, setPendingExitAction] = useState<(() => void) | null>(null);

  // PDF Document State
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingPdf, setIsLoadingPdf] = useState<boolean>(false);

  // Active Control Panel Tab
  const [activeTab, setActiveTab] = useState<'numbers' | 'stamps' | 'pages'>('numbers');

  // Synchronize Dark Mode with document.documentElement
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('pdf_studio_theme', theme);
    } catch (_) {}
  }, [theme]);

  // Refs for tracking active state in popstate without stale closures
  const modalToolRef = useRef(modalTool);
  modalToolRef.current = modalTool;
  const hasFileRef = useRef(!!pdfDocProxy);
  hasFileRef.current = !!pdfDocProxy;
  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  // Load existing drafts list immediately on mount
  useEffect(() => {
    const list = getAllDraftsFromStorage();
    setDraftsList(list);
    if (list.length > 0) {
      setIsDraftSaved(true);
    }
  }, []);

  // Browser History Step-by-Step Back Navigation
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ step: 'home' }, '');
    }

    const handlePopState = () => {
      // Step 1: If exit confirm is open, close it
      if (showExitConfirm) {
        setShowExitConfirm(false);
        return;
      }
      // Step 2: If modal is open, close modal
      if (modalToolRef.current !== null) {
        setModalTool(null);
        return;
      }
      // Step 3: If a PDF document is loaded, ask user if they want to save or finish
      if (hasFileRef.current) {
        setShowExitConfirm(true);
        return;
      }
      // Step 4: If inside a specific tool, return to tools view
      if (viewModeRef.current === 'tool') {
        setViewMode('tools');
        return;
      }
      // Step 5: If in tools screen, return to home
      if (viewModeRef.current === 'tools') {
        setViewMode('home');
        return;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showExitConfirm]);

  // Page Number Configuration
  const [numberConfig, setNumberConfig] = useState<PageNumberConfig>({
    enabled: true,
    numeralSystem: 'bengali',
    position: 'bottom-center',
    format: 'number_of_total',
    fontSize: 16,
    fontColor: '#0f172a',
    opacity: 0.9,
    margin: 32,
    customXPercent: 50,
    customYPercent: 92,
    startFrom: 1,
    skipFirstPage: false,
    excludedPages: [],
    prefixText: '',
    suffixText: '',
    pageFilterMode: 'all',
    rotation: 0,
    layer: 'above_stamps',
  });

  // Stamps State
  const [stamps, setStamps] = useState<StampItem[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);

  // Processing & Export State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const t = translations[lang];

  // Auto-save draft changes
  useEffect(() => {
    if (!pdfDocProxy || !pdfBytes) return;

    const timer = setTimeout(async () => {
      try {
        const saved = await saveDraftToStorage(
          {
            id: activeDraftId || undefined,
            fileName: pdfFile?.name || 'Document.pdf',
            fileSizeBytes: pdfBytes?.byteLength || pdfFile?.size || 0,
            totalPages,
            currentPage,
            numberConfig,
            stamps,
            activeTab,
            sampleUsed,
          },
          pdfBytes
        );
        if (saved && !activeDraftId) {
          setActiveDraftId(saved.id);
        }
        setIsDraftSaved(true);
        setDraftsList(getAllDraftsFromStorage());
      } catch (err) {
        console.warn('Auto-save notice:', err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    pdfDocProxy,
    pdfBytes,
    pdfFile,
    numberConfig,
    stamps,
    currentPage,
    activeTab,
    totalPages,
    activeDraftId,
    sampleUsed,
  ]);

  // Handle PDF Loading
  const loadPdfData = async (file: File, bytes: ArrayBuffer) => {
    try {
      setIsLoadingPdf(true);
      const loadingTask = pdfjsLib.getDocument({
        data: bytes.slice(0),
        cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
        cMapPacked: true,
      });

      const proxy = await loadingTask.promise;
      setPdfFile(file);
      setPdfBytes(bytes);
      setPdfDocProxy(proxy);
      setTotalPages(proxy.numPages);
      setCurrentPage(1);
      setViewMode('tool');
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      alert(
        lang === 'bn'
          ? 'পিডিএফ লোড করতে ত্রুটি হয়েছে। অনুগ্রহ করে অন্য ফাইল দিয়ে চেষ্টা করুন।'
          : 'Failed to load PDF. Please try another file.'
      );
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoadingPdf(true);
      const bytes = await file.arrayBuffer();
      setActiveDraftId(null);
      setSampleUsed(false);
      await loadPdfData(file, bytes);
      showToast(t.fileLoaded, 'success');
    } catch (err) {
      console.error('Error reading file:', err);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setIsLoadingPdf(true);
      const { file, bytes } = await createSamplePdf();
      setActiveDraftId(null);
      setSampleUsed(true);
      await loadPdfData(file, bytes);
      showToast(t.sampleLoaded, 'success');
    } catch (err) {
      console.error('Error creating sample PDF:', err);
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Instant Select Draft from Home Screen (0 delay loading)
  const handleSelectDraft = async (draft: DraftState) => {
    try {
      setIsLoadingPdf(true);
      setActiveDraftId(draft.id);

      let bytes: ArrayBuffer | null = await loadDraftBytes(draft.id);
      let file: File;

      if (!bytes || draft.sampleUsed) {
        const sample = await createSamplePdf();
        bytes = sample.bytes;
        file = sample.file;
        setSampleUsed(true);
      } else {
        file = new File([bytes], draft.fileName || 'Document.pdf', {
          type: 'application/pdf',
        });
        setSampleUsed(false);
      }

      await loadPdfData(file, bytes);
      setNumberConfig(draft.numberConfig);
      setStamps(draft.stamps || []);
      setCurrentPage(draft.currentPage || 1);
      setActiveTab(draft.activeTab || 'numbers');
      setViewMode('tool');
      setIsDraftSaved(true);
      showToast(
        lang === 'bn' ? 'ড্রাফট সফলভাবে ওপেন করা হয়েছে' : 'Draft loaded successfully',
        'success'
      );
    } catch (err) {
      console.error('Error opening draft:', err);
      showToast(
        lang === 'bn' ? 'ড্রাফট লোড হতে সমস্যা হয়েছে' : 'Error loading draft',
        'info'
      );
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Delete Draft from storage
  const handleDeleteDraft = async (draftId: string) => {
    const updated = await deleteDraftFromStorage(draftId);
    setDraftsList(updated);
    if (activeDraftId === draftId) {
      setActiveDraftId(null);
    }
    if (updated.length === 0) {
      setIsDraftSaved(false);
    }
    showToast(lang === 'bn' ? 'ড্রাফট মুছে ফেলা হয়েছে' : 'Draft deleted', 'info');
  };

  // Download Final PDF
  const handleDownload = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);
    setProgressPercent(0);
    setProgressMessage(t.processingPdf);

    try {
      const modifiedBytes = await processAndExportPdf({
        pdfBytes,
        numberConfig,
        stamps,
        lang,
        onProgress: (percent, msg) => {
          setProgressPercent(percent);
          setProgressMessage(msg);
        },
      });

      const outputName = pdfFile
        ? pdfFile.name.replace(/\.pdf$/i, '_edited.pdf')
        : 'edited_document.pdf';

      triggerFileDownload(modifiedBytes, outputName);
      showToast(t.pdfSuccess, 'success');
    } catch (err) {
      console.error('Error processing PDF:', err);
      alert(
        lang === 'bn'
          ? 'পিডিএফ তৈরি করতে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
          : 'Failed to process PDF. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Stamp Handlers
  const handleAddStamp = (stamp: StampItem) => {
    setStamps((prev) => [...prev, stamp]);
    setSelectedStampId(stamp.id);
  };

  const handleUpdateStamp = (updatedStamp: StampItem) => {
    setStamps((prev) =>
      prev.map((s) => (s.id === updatedStamp.id ? updatedStamp : s))
    );
  };

  const handleDeleteStamp = (id: string) => {
    setStamps((prev) => prev.filter((s) => s.id !== id));
    if (selectedStampId === id) {
      setSelectedStampId(null);
    }
  };

  // Tool Navigation & Step-by-Step Back
  const handleToolSelect = (tool: ActiveTool) => {
    if (tool === 'page_numbers_and_stamps') {
      setActiveTool(tool);
      setViewMode('tool');
      if (window.history.state?.step !== 'tool') {
        window.history.pushState({ step: 'tool' }, '');
      }
    } else {
      setModalTool(tool);
      if (window.history.state?.step !== 'modal') {
        window.history.pushState({ step: 'modal' }, '');
      }
    }
  };

  const requestExitOrAction = (action: () => void) => {
    if (pdfDocProxy) {
      setPendingExitAction(() => action);
      setShowExitConfirm(true);
    } else {
      action();
    }
  };

  const executeExitToHome = () => {
    setPdfDocProxy(null);
    setPdfBytes(null);
    setPdfFile(null);
    setActiveDraftId(null);
    setViewMode('home');
    setDraftsList(getAllDraftsFromStorage());
  };

  const handleGoHome = () => {
    if (pdfDocProxy) {
      requestExitOrAction(executeExitToHome);
    } else {
      setViewMode('home');
    }
  };

  // Bottom Nav "Tools" button action
  const handleOpenTools = () => {
    if (pdfDocProxy) {
      requestExitOrAction(() => {
        executeExitToHome();
        setViewMode('tools');
      });
    } else {
      setViewMode('tools');
      if (window.history.state?.step !== 'tools') {
        window.history.pushState({ step: 'tools' }, '');
      }
    }
  };

  // Exit Dialog Actions
  const handleConfirmKeepDraftAndExit = () => {
    setShowExitConfirm(false);
    if (pendingExitAction) {
      pendingExitAction();
      setPendingExitAction(null);
    } else {
      executeExitToHome();
    }
  };

  const handleConfirmDiscardAndExit = async () => {
    setShowExitConfirm(false);
    if (activeDraftId) {
      await deleteDraftFromStorage(activeDraftId);
    }
    setDraftsList(getAllDraftsFromStorage());
    if (pendingExitAction) {
      pendingExitAction();
      setPendingExitAction(null);
    } else {
      executeExitToHome();
    }
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
    setPendingExitAction(null);
  };

  const togglePageExclusion = (pageNum: number) => {
    const isExcluded = numberConfig.excludedPages.includes(pageNum);
    let next: number[];
    if (isExcluded) {
      next = numberConfig.excludedPages.filter((p) => p !== pageNum);
    } else {
      next = [...numberConfig.excludedPages, pageNum].sort((a, b) => a - b);
    }
    setNumberConfig({ ...numberConfig, excludedPages: next });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col transition-colors selection:bg-indigo-500 selection:text-white">
      {/* App Header: Clean, displays file info & download button on top right when file active */}
      <Header
        lang={lang}
        hasFile={!!pdfDocProxy}
        fileName={pdfFile?.name}
        fileSize={pdfFile ? formatBytes(pdfFile.size) : undefined}
        totalPages={totalPages}
        onDownload={handleDownload}
        isProcessing={isProcessing}
        onGoHome={handleGoHome}
      />

      {/* Main Container */}
      <main className="flex-1 flex flex-col pb-16 lg:pb-0">
        {viewMode === 'home' && !pdfDocProxy ? (
          <div className="flex-1 flex flex-col justify-start pt-2">
            {/* Home Screen: Saved Drafts ONLY as requested */}
            <RecentDraftsList
              drafts={draftsList}
              onSelectDraft={handleSelectDraft}
              onDeleteDraft={handleDeleteDraft}
              onGoToTools={() => setViewMode('tools')}
              lang={lang}
            />
          </div>
        ) : viewMode === 'tools' && !pdfDocProxy ? (
          <div className="flex-1 flex flex-col justify-start pt-2">
            {/* Tools Screen: Full Tool Grid */}
            <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 mb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMode('home')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                <span>{t.backToHome}</span>
              </button>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {t.allToolsBtn}
              </span>
            </div>
            <HomeToolGrid onSelectTool={handleToolSelect} lang={lang} />
          </div>
        ) : !pdfDocProxy ? (
          <div className="flex-1 flex flex-col">
            {/* Sub-header inside tool with back to tools button */}
            <div className="border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs px-3 sm:px-6 py-2.5">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      setViewMode('tools');
                    }
                  }}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span>{lang === 'bn' ? 'টুলসে ফিরে যান' : 'Back to Tools'}</span>
                </button>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {t.toolNumbersAndStamps}
                </span>
              </div>
            </div>

            <UploadZone
              onFileSelect={handleFileSelect}
              onLoadSample={handleLoadSample}
              lang={lang}
              isLoadingSample={isLoadingPdf}
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden">
            {/* Unified Workspace: Canvas Frozen, Tool Tabs Frozen, Only Options Scroll Below */}
            <div className="flex-1 flex flex-col w-full max-w-5xl xl:max-w-6xl mx-auto px-3 sm:px-6 pt-2 pb-16 sm:pb-3 min-h-0 overflow-hidden">
              {/* 1. FROZEN UPPER SECTION: Full-width PDF Canvas Viewer */}
              <div className="w-full shrink-0 flex flex-col items-center mb-2.5">
                <PDFCanvasViewer
                  pdfDocProxy={pdfDocProxy}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  numberConfig={numberConfig}
                  onUpdateNumberConfig={setNumberConfig}
                  stamps={stamps}
                  selectedStampId={selectedStampId}
                  onSelectStamp={setSelectedStampId}
                  onUpdateStamp={handleUpdateStamp}
                  onDeleteStamp={handleDeleteStamp}
                  lang={lang}
                />
              </div>

              {/* 2. FROZEN MIDDLE SECTION: Tool Radio Buttons / Tabs */}
              <div className="w-full shrink-0 mb-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-2xs">
                <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setActiveTab('numbers')}
                    className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === 'numbers'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={faHashtag} className="text-xs" />
                    <span>{t.tabNumbers}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('stamps')}
                    className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === 'stamps'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={faImage} className="text-xs" />
                    <span>{t.tabStamps}</span>
                    {stamps.length > 0 && (
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] flex items-center justify-center font-bold">
                        {stamps.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('pages')}
                    className={`flex-1 py-2 sm:py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      activeTab === 'pages'
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <FontAwesomeIcon icon={faListCheck} className="text-xs" />
                    <span>{lang === 'bn' ? 'পৃষ্ঠা তালিকা ও বর্জন' : 'Page List & Exclusions'}</span>
                  </button>
                </div>
              </div>

              {/* 3. SCROLLING LOWER SECTION: ONLY tool options scroll */}
              <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs">
                {activeTab === 'numbers' && (
                  <PageNumberManager
                    config={numberConfig}
                    onChange={setNumberConfig}
                    totalPages={totalPages}
                    lang={lang}
                  />
                )}

                {activeTab === 'stamps' && (
                  <StampManager
                    stamps={stamps}
                    selectedStampId={selectedStampId}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onAddStamp={handleAddStamp}
                    onUpdateStamp={handleUpdateStamp}
                    onDeleteStamp={handleDeleteStamp}
                    onSelectStamp={setSelectedStampId}
                    lang={lang}
                  />
                )}

                {activeTab === 'pages' && (
                  <PageThumbnails
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageSelect={setCurrentPage}
                    numberConfig={numberConfig}
                    onToggleNumberExclusion={togglePageExclusion}
                    onBatchExclusionChange={(newExcluded) =>
                      setNumberConfig({ ...numberConfig, excludedPages: newExcluded })
                    }
                    onToggleSkipFirstPage={(skip) =>
                      setNumberConfig({ ...numberConfig, skipFirstPage: skip })
                    }
                    stamps={stamps}
                    lang={lang}
                    pdfDocProxy={pdfDocProxy}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Home, Tools, More) */}
      <BottomNav
        currentView={viewMode}
        hasFile={!!pdfDocProxy}
        onGoHome={handleGoHome}
        onOpenTools={handleOpenTools}
        isDraftSaved={isDraftSaved}
        onClearDraft={async () => {
          await clearAllDraftsFromStorage();
          setDraftsList([]);
          setIsDraftSaved(false);
          showToast(
            lang === 'bn' ? 'সব ড্রাফট সফলভাবে মুছে ফেলা হয়েছে' : 'All drafts cleared',
            'info'
          );
        }}
        lang={lang}
        onToggleLang={() => setLang((l) => (l === 'bn' ? 'en' : 'bn'))}
        theme={theme}
        onToggleTheme={() => setTheme((m) => (m === 'light' ? 'dark' : 'light'))}
      />

      {/* Exit Confirmation Dialog */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onKeepDraftAndExit={handleConfirmKeepDraftAndExit}
        onDiscardAndExit={handleConfirmDiscardAndExit}
        onContinueEditing={handleCancelExit}
        lang={lang}
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-20 lg:bottom-8 right-4 sm:right-8 z-50 px-4 py-2.5 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-900 text-white border-slate-800'
            }`}
          >
            <FontAwesomeIcon icon={faCircleCheck} className="text-sm" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Tools Roadmap Modal */}
      <ToolModals
        tool={modalTool}
        onClose={() => {
          if (window.history.state?.step === 'modal') {
            window.history.back();
          } else {
            setModalTool(null);
          }
        }}
        onGoToActiveTool={() => {
          setActiveTool('page_numbers_and_stamps');
          setViewMode('tool');
          setModalTool(null);
        }}
        lang={lang}
      />
    </div>
  );
}
