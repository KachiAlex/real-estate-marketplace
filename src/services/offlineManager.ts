/**
 * Offline Manager
 * 
 * Handles offline detection, request queuing, and cache management
 * for seamless offline-first functionality.
 */

import { Capacitor } from '@capacitor/core';

// @ts-ignore - Network plugin may not be installed
let Network: any;
try {
  Network = require('@capacitor/network').Network;
} catch {
  Network = null;
}

/**
 * Offline request queue item
 */
export interface QueuedRequest {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  data?: any;
  timestamp: number;
  retries: number;
}

/**
 * Cache entry
 */
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

/**
 * Offline Manager class
 */
export class OfflineManager {
  private isOnline: boolean = true;
  private requestQueue: Map<string, QueuedRequest> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private listeners: Set<(isOnline: boolean) => void> = new Set();
  private maxQueueSize: number = 100;
  private maxRetries: number = 3;
  private defaultCacheTTL: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeNetworkListener();
  }

  /**
   * Initialize network status listener
   */
  private async initializeNetworkListener(): Promise<void> {
    try {
      // Check initial status
      if (Capacitor.isNativePlatform() && Network) {
        const status = await Network.getStatus();
        this.isOnline = status.connected;
      } else {
        this.isOnline = navigator.onLine;
      }

      // Listen for changes
      if (Capacitor.isNativePlatform() && Network) {
        Network.addListener('networkStatusChange', (status: any) => {
          this.setOnlineStatus(status.connected);
        });
      } else {
        window.addEventListener('online', () => this.setOnlineStatus(true));
        window.addEventListener('offline', () => this.setOnlineStatus(false));
      }
    } catch (error) {
      console.error('Failed to initialize network listener:', error);
      // Assume online if we can't determine status
      this.isOnline = true;
    }
  }

  /**
   * Set online status and notify listeners
   */
  private setOnlineStatus(isOnline: boolean): void {
    if (this.isOnline !== isOnline) {
      this.isOnline = isOnline;
      console.log(`Network status changed: ${isOnline ? 'online' : 'offline'}`);
      
      // Notify all listeners
      this.listeners.forEach(listener => listener(isOnline));

      // If coming back online, process queue
      if (isOnline) {
        this.processQueue();
      }
    }
  }

  /**
   * Check if currently online
   */
  isConnected(): boolean {
    return this.isOnline;
  }

  /**
   * Add online status listener
   */
  addListener(listener: (isOnline: boolean) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Queue a request for later processing
   */
  queueRequest(method: string, path: string, data?: any): string {
    if (this.requestQueue.size >= this.maxQueueSize) {
      throw new Error('Request queue is full');
    }

    const id = `${Date.now()}-${Math.random()}`;
    const request: QueuedRequest = {
      id,
      method: method as any,
      path,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    this.requestQueue.set(id, request);
    console.log(`Queued request: ${method} ${path}`);

    return id;
  }

  /**
   * Get queued request
   */
  getQueuedRequest(id: string): QueuedRequest | undefined {
    return this.requestQueue.get(id);
  }

  /**
   * Remove queued request
   */
  removeQueuedRequest(id: string): void {
    this.requestQueue.delete(id);
  }

  /**
   * Get all queued requests
   */
  getQueuedRequests(): QueuedRequest[] {
    return Array.from(this.requestQueue.values());
  }

  /**
   * Clear request queue
   */
  clearQueue(): void {
    this.requestQueue.clear();
  }

  /**
   * Process queued requests
   */
  async processQueue(): Promise<void> {
    const requests = Array.from(this.requestQueue.values());
    
    for (const request of requests) {
      try {
        // Retry logic
        if (request.retries >= this.maxRetries) {
          console.warn(`Request ${request.id} exceeded max retries`);
          this.removeQueuedRequest(request.id);
          continue;
        }

        // Emit event for processing
        const event = new CustomEvent('processQueuedRequest', {
          detail: request,
        });
        window.dispatchEvent(event);

        // Wait a bit before next request
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to process queued request ${request.id}:`, error);
        request.retries++;
      }
    }
  }

  /**
   * Cache data
   */
  setCache<T = any>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultCacheTTL,
    });
  }

  /**
   * Get cached data
   */
  getCache<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Clear cache entry
   */
  clearCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Get queue statistics
   */
  getQueueStats(): { size: number; requests: QueuedRequest[] } {
    return {
      size: this.requestQueue.size,
      requests: Array.from(this.requestQueue.values()),
    };
  }
}

/**
 * Singleton instance
 */
let offlineManager: OfflineManager | null = null;

/**
 * Get or create offline manager instance
 */
export function getOfflineManager(): OfflineManager {
  if (!offlineManager) {
    offlineManager = new OfflineManager();
  }
  return offlineManager;
}

/**
 * Reset offline manager (for testing)
 */
export function resetOfflineManager(): void {
  offlineManager = null;
}

export default {
  getOfflineManager,
  resetOfflineManager,
  OfflineManager,
};
