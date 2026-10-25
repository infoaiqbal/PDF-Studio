import { DraftState, PageNumberConfig, StampItem } from '../types';

const DRAFTS_LIST_KEY = 'pdf_studio_drafts_v3';
const LEGACY_DRAFT_KEY = 'pdf_studio_draft_v2';
const DB_NAME = 'pdf_studio_db';
const STORE_NAME = 'pdf_drafts';

// Fast In-Memory Cache for instantaneous 0-millisecond draft loading
const memoryBytesCache = new Map<string, ArrayBuffer>();

function openDraftDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = window.indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function saveDraftToStorage(
  state: {
    id?: string;
    fileName: string;
    fileSizeBytes?: number;
    totalPages: number;
    currentPage: number;
    numberConfig: PageNumberConfig;
    stamps: StampItem[];
    activeTab: 'numbers' | 'stamps' | 'pages';
    sampleUsed?: boolean;
  },
  pdfBytes?: ArrayBuffer | null
): Promise<DraftState> {
  const draftId = state.id || `draft_${Date.now()}`;
  const bytesSize = pdfBytes?.byteLength || state.fileSizeBytes || 0;

  const newDraft: DraftState = {
    id: draftId,
    hasDraft: true,
    timestamp: Date.now(),
    fileName: state.fileName,
    fileSizeBytes: bytesSize,
    formattedSize: formatBytes(bytesSize),
    totalPages: state.totalPages,
    currentPage: state.currentPage,
    numberConfig: state.numberConfig,
    stamps: state.stamps,
    activeTab: state.activeTab,
    sampleUsed: !!state.sampleUsed,
  };

  try {
    // 1. Update in-memory cache immediately
    if (pdfBytes && pdfBytes.byteLength > 0) {
      memoryBytesCache.set(draftId, pdfBytes);
    }

    // 2. Update drafts list in localStorage
    const existingList = getAllDraftsFromStorage();
    const updatedList = [newDraft, ...existingList.filter((d) => d.id !== draftId)].slice(0, 8); // Keep up to 8 recent drafts
    localStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(updatedList));

    // 3. Persist bytes in IndexedDB asynchronously
    if (pdfBytes && pdfBytes.byteLength > 0) {
      const db = await openDraftDb();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(pdfBytes, `bytes_${draftId}`);
      await new Promise<void>((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  } catch (err) {
    console.warn('Draft auto-save notice:', err);
  }

  return newDraft;
}

export function getAllDraftsFromStorage(): DraftState[] {
  try {
    const raw = localStorage.getItem(DRAFTS_LIST_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        return list;
      }
    }

    // Backward compatibility with single draft key
    const legacyRaw = localStorage.getItem(LEGACY_DRAFT_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      if (legacy && legacy.hasDraft) {
        const migratedDraft: DraftState = {
          ...legacy,
          id: 'legacy_draft_1',
          formattedSize: '1.2 MB',
        };
        return [migratedDraft];
      }
    }
    return [];
  } catch (err) {
    console.warn('Error reading drafts list:', err);
    return [];
  }
}

export async function loadDraftBytes(draftId: string): Promise<ArrayBuffer | null> {
  // Check fast in-memory cache first
  if (memoryBytesCache.has(draftId)) {
    return memoryBytesCache.get(draftId) || null;
  }

  try {
    const db = await openDraftDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    // Try new key format first, fallback to legacy key
    let req = store.get(`bytes_${draftId}`);
    let bytes = await new Promise<ArrayBuffer | null>((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (!bytes && draftId === 'legacy_draft_1') {
      const legacyReq = store.get('current_pdf_bytes');
      bytes = await new Promise<ArrayBuffer | null>((resolve) => {
        legacyReq.onsuccess = () => resolve(legacyReq.result || null);
        legacyReq.onerror = () => resolve(null);
      });
    }

    if (bytes) {
      memoryBytesCache.set(draftId, bytes);
    }
    return bytes;
  } catch (err) {
    console.warn('Error retrieving draft bytes:', err);
    return null;
  }
}

export async function deleteDraftFromStorage(draftId: string): Promise<DraftState[]> {
  try {
    memoryBytesCache.delete(draftId);
    const existing = getAllDraftsFromStorage().filter((d) => d.id !== draftId);
    localStorage.setItem(DRAFTS_LIST_KEY, JSON.stringify(existing));
    localStorage.removeItem(LEGACY_DRAFT_KEY);

    const db = await openDraftDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(`bytes_${draftId}`);
    tx.objectStore(STORE_NAME).delete('current_pdf_bytes');
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    return existing;
  } catch (err) {
    console.warn('Error deleting draft:', err);
    return getAllDraftsFromStorage();
  }
}

export async function clearAllDraftsFromStorage(): Promise<void> {
  try {
    memoryBytesCache.clear();
    localStorage.removeItem(DRAFTS_LIST_KEY);
    localStorage.removeItem(LEGACY_DRAFT_KEY);
    const db = await openDraftDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Error clearing drafts:', err);
  }
}
