/**
 * Cache Types
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
  maxSize: number;
  entryCount: number;
  lastSyncTime: number | null;
}

export interface SyncQueueItem {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data: any;
  timestamp: number;
  retries: number;
}

export interface CacheConfig {
  maxSize: number; // Maximum cache size in bytes (default: 100MB)
  defaultTTL: number; // Default time-to-live in milliseconds (default: 24 hours)
  encryptSensitive: boolean; // Whether to encrypt sensitive data
}
