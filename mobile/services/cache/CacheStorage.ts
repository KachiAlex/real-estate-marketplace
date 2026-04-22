/**
 * Cache Storage Service
 * Handles local data caching using AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CacheEntry, CacheMetadata } from './types';

const CACHE_PREFIX = 'propertyark_cache_';
const METADATA_KEY = 'propertyark_cache_metadata';

export class CacheStorage {
  /**
   * Store data with TTL
   */
  static async storeData<T>(
    key: string,
    value: T,
    ttl: number = 86400000, // 24 hours default
    encrypted: boolean = false
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl,
        encrypted,
        size: JSON.stringify(value).length,
      };

      const cacheKey = `${CACHE_PREFIX}${key}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));

      // Update metadata
      await this.updateMetadata();
    } catch (error) {
      console.error('Failed to store cache data:', error);
      throw new Error('Failed to cache data');
    }
  }

  /**
   * Retrieve cached data
   */
  static async retrieveData<T>(key: string): Promise<T | null> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      const data = await AsyncStorage.getItem(cacheKey);

      if (!data) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(data);

      // Check if expired
      if (this.isExpired(entry)) {
        await this.deleteData(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error('Failed to retrieve cache data:', error);
      return null;
    }
  }

  /**
   * Delete specific cache entry
   */
  static async deleteData(key: string): Promise<void> {
    try {
      const cacheKey = `${CACHE_PREFIX}${key}`;
      await AsyncStorage.removeItem(cacheKey);
      await this.updateMetadata();
    } catch (error) {
      console.error('Failed to delete cache data:', error);
    }
  }

  /**
   * Clear all cache
   */
  static async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
      await AsyncStorage.removeItem(METADATA_KEY);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  static isExpired<T>(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    return now - entry.timestamp > entry.ttl;
  }

  /**
   * Get current cache size
   */
  static async getCacheSize(): Promise<number> {
    try {
      const metadata = await this.getMetadata();
      return metadata.totalSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get cache metadata
   */
  static async getMetadata(): Promise<CacheMetadata> {
    try {
      const data = await AsyncStorage.getItem(METADATA_KEY);
      if (!data) {
        return {
          totalSize: 0,
          entryCount: 0,
          lastCleanup: Date.now(),
        };
      }
      return JSON.parse(data);
    } catch (error) {
      return {
        totalSize: 0,
        entryCount: 0,
        lastCleanup: Date.now(),
      };
    }
  }

  /**
   * Update cache metadata
   */
  private static async updateMetadata(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

      let totalSize = 0;
      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }

      const metadata: CacheMetadata = {
        totalSize,
        entryCount: cacheKeys.length,
        lastCleanup: Date.now(),
      };

      await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to update cache metadata:', error);
    }
  }

  /**
   * Cleanup expired entries
   */
  static async cleanup(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter((key) => key.startsWith(CACHE_PREFIX));

      for (const key of cacheKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const entry: CacheEntry<any> = JSON.parse(data);
          if (this.isExpired(entry)) {
            await AsyncStorage.removeItem(key);
          }
        }
      }

      await this.updateMetadata();
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }
}
