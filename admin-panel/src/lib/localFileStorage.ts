// A helper to store and load directory handles using native IndexedDB
const DB_NAME = 'spapos_offline_db';
const STORE_NAME = 'settings';
const KEY_HANDLE = 'directory_handle';

export function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
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

export async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(handle, KEY_HANDLE);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(KEY_HANDLE);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    return null;
  }
}

export async function clearDirectoryHandle(): Promise<void> {
  const db = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(KEY_HANDLE);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function verifyPermission(handle: FileSystemDirectoryHandle, readWrite: boolean): Promise<boolean> {
  const options = { mode: readWrite ? ('readwrite' as const) : ('read' as const) };
  if ((await (handle as any).queryPermission(options)) === 'granted') {
    return true;
  }
  if ((await (handle as any).requestPermission(options)) === 'granted') {
    return true;
  }
  return false;
}

export async function writeStateToLocalDirectory(handle: FileSystemDirectoryHandle, state: any): Promise<void> {
  try {
    const fileHandle = await handle.getFileHandle('spapos_db.json', { create: true });
    const writable = await fileHandle.createWritable();
    // Exclude function fields and volatile states from the JSON output
    const cleanState = Object.keys(state).reduce((acc: any, key) => {
      if (typeof state[key] !== 'function') {
        acc[key] = state[key];
      }
      return acc;
    }, {});
    await writable.write(JSON.stringify(cleanState, null, 2));
    await writable.close();
  } catch (error) {
    console.error('Failed to write local backup:', error);
  }
}

export async function readStateFromLocalDirectory(handle: FileSystemDirectoryHandle): Promise<any | null> {
  try {
    const fileHandle = await handle.getFileHandle('spapos_db.json');
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to read from local backup:', error);
    return null;
  }
}

export interface StorageEstimateResult {
  usageMB: number;
  quotaMB: number;
  percentageUsed: number;
}

export async function getStorageEstimate(): Promise<StorageEstimateResult> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usageMB = Math.round((estimate.usage || 0) / (1024 * 1024) * 100) / 100;
      const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024) * 100) / 100;
      const percentageUsed = quotaMB > 0 ? Math.round((usageMB / quotaMB) * 10000) / 100 : 0;
      return { usageMB, quotaMB, percentageUsed };
    } catch (e) {
      return { usageMB: 0, quotaMB: 0, percentageUsed: 0 };
    }
  }
  return { usageMB: 0, quotaMB: 0, percentageUsed: 0 };
}
