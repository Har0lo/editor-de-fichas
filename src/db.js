// Wrapper mínimo de IndexedDB. Una sola object store: 'fichas'.
const DB_NAME = 'editor-fichas';
const STORE = 'fichas';

let dbPromise = null;

function openDB() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

async function tx(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(req ? req.result : undefined);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

export const dbGet = (id) => tx('readonly', (s) => s.get(id));
export const dbPut = (value) => tx('readwrite', (s) => s.put(value));
export const dbDelete = (id) => tx('readwrite', (s) => s.delete(id));
export const dbList = () => tx('readonly', (s) => s.getAll());
