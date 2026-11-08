import { SetData } from '../types';

const DB_NAME = 'cuepoint_db';
const DB_VERSION = 1;
const SETS_STORE = 'sets';
const SONGS_STORE = 'songs';

class StorageService {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(SETS_STORE)) {
          db.createObjectStore(SETS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SONGS_STORE)) {
          db.createObjectStore(SONGS_STORE, { keyPath: 'fileName' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSet(set: SetData): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([SETS_STORE], 'readwrite');
      tx.objectStore(SETS_STORE).put(set);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSet(id: string): Promise<SetData | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([SETS_STORE], 'readonly');
      const req = tx.objectStore(SETS_STORE).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllSets(): Promise<SetData[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([SETS_STORE], 'readonly');
      const req = tx.objectStore(SETS_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveSongFile(fileName: string, content: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([SONGS_STORE], 'readwrite');
      tx.objectStore(SONGS_STORE).put({ fileName, content, updatedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSongFile(fileName: string): Promise<string | undefined> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const tx = db.transaction([SONGS_STORE], 'readonly');
      const req = tx.objectStore(SONGS_STORE).get(fileName);
      req.onsuccess = () => resolve(req.result ? req.result.content : undefined);
      req.onerror = () => reject(req.error);
    });
  }
}

export const storageService = new StorageService();
