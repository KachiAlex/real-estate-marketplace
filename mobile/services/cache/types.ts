/**
 * Cache Types
 * Defines all TypeScript interfaces for caching-related data structures
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  encrypted: boolean;
  size: number;
}

export interface CacheMetadata {
  totalSize: number;
  entryCount: number;
  lastCleanup: number;
}

export interface SyncQueueItem {
  id: string;
  operation: 'create' | 'update' | 'delete';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  encryptSensitive: boolean;
}

export interface CacheState {
  isOnline: boolean;
  syncInProgress: boolean;
  lastSyncTime: number | null;
  pendingMutations: number;
}
