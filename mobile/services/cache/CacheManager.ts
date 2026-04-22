/**
 * Cache Manager
 * Manages offline data caching, expiration, and synchronization
 */

import { CacheStorage } from './CacheStorage';
import { CacheState, SyncQueueItem, CacheConfig } from './types';

const DEFAULT_CONFIG: CacheConfig = {
  maxSize: 104857600, // 100MB
  defaultTTL: 86400000, // 24 hours
  encryptSensitive: true,
};

const SYNC_QUEUE_KEY = 'propertyark_sync_queue';

export class CacheManager {
  private static instance: CacheManager;
  private config: CacheConfig = DEFAULT_CONFIG;
  private state: CacheState = {
    isOnline: true,
    syncInProgress: false,
    lastSyncTime: null,
    pendingMutations: 0,
  };
  private listeners: Array<(state: CacheState) => void> = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Initialize cache manager
   */
  async initialize(): Promise<void> {
    try {
      // Cleanup expired entries
      await CacheStorage.cleanup();

      // Load pending mutations
      await this.loadSyncQueue();
    } catch (error) {
      console.error('Failed to initialize cache manager:', error);
    }
  }

  /**
   * Set cache data
   */
  async set<T>(key: string, value: T, ttl?: number, encrypted?: boolean): Promise<void> {
    try {
      const cacheTTL = ttl || this.config.defaultTTL;
      const shouldEncrypt = encrypted !== undefined ? encrypted : this.config.encryptSensitive;

      await CacheStorage.storeData(key, value, cacheTTL, shouldEncrypt);

      // Check cache size and evict if necessary
      await this.checkAndEvictIfNeeded();
    } catch (error) {
      console.error('Failed to set cache:', error);
      throw error;
    }
  }

  /**
   * Get cache data
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      return await CacheStorage.retrieveData<T>(key);
    } catch (error) {
      console.error('Failed to get cache:', error);
      return null;
    }
  }

  /**
   * Remove cache entry
   */
  async remove(key: string): Promise<void> {
    try {
      await CacheStorage.deleteData(key);
    } catch (error) {
      console.error('Failed to remove cache:', error);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await CacheStorage.clearAll();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  isExpired<T>(entry: any): boolean {
    return CacheStorage.isExpired(entry);
  }

  /**
   * Get current cache size
   */
  async getSize(): Promise<number> {
    return CacheStorage.getCacheSize();
  }

  /**
   * Queue mutation for offline sync
   */
  async queueMutation(
    operation: 'create' | 'update' | 'delete',
    endpoint: string,
    data: any
  ): Promise<void> {
    try {
      const item: SyncQueueItem = {
        id: `${Date.now()}_${Math.random()}`,
        operation,
        endpoint,
        data,
        timestamp: Date.now(),
        retries: 0,
      };

      const queue = await this.getSyncQueue();
      queue.push(item);
      await this.saveSyncQueue(queue);

      this.state.pendingMutations = queue.length;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to queue mutation:', error);
    }
  }

  /**
   * Sync pending mutations with backend
   */
  async sync(): Promise<boolean> {
    if (this.state.syncInProgress || !this.state.isOnline) {
      return false;
    }

    try {
      this.state.syncInProgress = true;
      this.notifyListeners();

      const queue = await this.getSyncQueue();
      if (queue.length === 0) {
        return true;
      }

      // Process each item in queue
      for (const item of queue) {
        try {
          await this.processSyncItem(item);
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          item.retries++;

          // Stop if too many retries
          if (item.retries > 3) {
            queue.splice(queue.indexOf(item), 1);
          }
        }
      }

      await this.saveSyncQueue(queue);
      this.state.lastSyncTime = Date.now();
      this.state.pendingMutations = queue.length;
      this.notifyListeners();

      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    } finally {
      this.state.syncInProgress = false;
      this.notifyListeners();
    }
  }

  /**
   * Set online/offline status
   */
  setOnlineStatus(isOnline: boolean): void {
    this.state.isOnline = isOnline;
    this.notifyListeners();

    if (isOnline) {
      // Attempt sync when coming online
      this.sync().catch((error) => console.error('Auto-sync failed:', error));
    }
  }

  /**
   * Get current state
   */
  getState(): CacheState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: CacheState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Process single sync item
   */
  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const response = await fetch(`https://propertyark-backend.onrender.com/api${item.endpoint}`, {
      method: item.operation === 'delete' ? 'DELETE' : item.operation === 'create' ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: item.operation === 'delete' ? undefined : JSON.stringify(item.data),
    });

    if (!response.ok) {
      throw new Error(`Sync failed with status ${response.status}`);
    }
  }

  /**
   * Get sync queue
   */
  private async getSyncQueue(): Promise<SyncQueueItem[]> {
    try {
      const data = await CacheStorage.retrieveData<SyncQueueItem[]>(SYNC_QUEUE_KEY);
      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Save sync queue
   */
  private async saveSyncQueue(queue: SyncQueueItem[]): Promise<void> {
    try {
      await CacheStorage.storeData(SYNC_QUEUE_KEY, queue, this.config.defaultTTL, false);
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Load sync queue on initialization
   */
  private async loadSyncQueue(): Promise<void> {
    try {
      const queue = await this.getSyncQueue();
      this.state.pendingMutations = queue.length;
      this.notifyListeners();
    } catch (error) {
      console.error('Failed to load sync queue:', error);
    }
  }

  /**
   * Check cache size and evict if needed
   */
  private async checkAndEvictIfNeeded(): Promise<void> {
    try {
      const size = await CacheStorage.getCacheSize();

      if (size > this.config.maxSize) {
        // Implement LRU eviction
        await CacheStorage.cleanup();
      }
    } catch (error) {
      console.error('Failed to check cache size:', error);
    }
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }
}

export default CacheManager.getInstance();
