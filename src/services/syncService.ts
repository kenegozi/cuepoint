import { SyncMessage } from '../types';

const CHANNEL_NAME = 'cuepoint_sync_channel';
const STORAGE_KEY = 'cuepoint_sync_event';

type SyncListener = (msg: SyncMessage) => void;

class SyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.notifyListeners(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or blocked, relying on storage events', e);
      }
    }

    // Fallback to storage event for cross-window / cross-tab compatibility
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY && e.newValue) {
          try {
            const data: SyncMessage = JSON.parse(e.newValue);
            this.notifyListeners(data);
          } catch (err) {
            console.error('Failed to parse sync storage event', err);
          }
        }
      });
    }
  }

  public broadcast(msg: Omit<SyncMessage, 'timestamp'>) {
    const fullMsg: SyncMessage = {
      ...msg,
      timestamp: Date.now(),
    };

    if (this.channel) {
      try {
        this.channel.postMessage(fullMsg);
      } catch (e) {
        console.warn('BroadcastChannel post error:', e);
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullMsg));
    } catch (e) {
      console.warn('LocalStorage sync setItem error:', e);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(msg: SyncMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    });
  }
}

export const syncService = new SyncService();

