import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BuildHistoryManager, createBuildHistoryManager, BuildHistoryEntry } from './build-history-manager';
import { BuildVariant } from '../types/android-build';

describe('BuildHistoryManager', () => {
  let tempDir: string;
  let manager: BuildHistoryManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'history-manager-test-'));
    manager = new BuildHistoryManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('addBuildEntry', () => {
    it('should add a build entry to history', async () => {
      const entry: BuildHistoryEntry = {
        buildId: 'build-123',
        timestamp: new Date(),
        variant: BuildVariant.Debug,
        profile: 'development',
        buildDuration: 60,
        artifactCount: 1,
        success: true,
      };

      await manager.addBuildEntry(entry);
      const entries = await manager.getAllEntries();

      expect(entries.length).toBe(1);
      expect(entries[0].buildId).toBe('build-123');
    });

    it('should throw error if buildId is empty', async () => {
      const entry: BuildHistoryEntry = {
        buildId: '',
        timestamp: new Date(),
        variant: BuildVariant.Debug,
        profile: 'development',
        buildDuration: 60,
        artifactCount: 1,
        success: true,
      };

      await expect(manager.addBuildEntry(entry)).rejects.toThrow('Build ID is required');
    });

    it('should throw error if buildDuration is negative', async () => {
      const entry: BuildHistoryEntry = {
        buildId: 'build-123',
        timestamp: new Date(),
        variant: BuildVariant.Debug,
        profile: 'development',
        buildDuration: -1,
        artifactCount: 1,
        success: true,
      };

      await expect(manager.addBuildEntry(entry)).rejects.toThrow(
        'Build duration must be non-negative'
      );
    });
  });

  describe('getAllEntries', () => {
    it('should return empty array if no entries exist', async () => {
      const entries = await manager.getAllEntries();
      expect(entries).toEqual([]);
    });

    it('should return all entries in order', async () => {
      const entry1: BuildHistoryEntry = {
        buildId: 'build-1',
        timestamp: new Date('2024-01-15T10:00:00'),
        variant: BuildVariant.Debug,
        profile: 'development',
        buildDuration: 60,
        artifactCount: 1,
        success: true,
      };

      const entry2: BuildHistoryEntry = {
        buildId: 'build-2',
        timestamp: new Date('2024-01-15T11:00:00'),
        variant: BuildVariant.Release,
        profile: 'production',
        buildDuration: 120,
        artifactCount: 1,
        success: true,
      };

      await manager.addBuildEntry(entry1);
      await manager.addBuildEntry(entry2);

      const entries = await manager.getAllEntries();

      expect(entries.length).toBe(2);
      expect(entries[0].buildId).toBe('build-2'); // Most recent first
      expect(entries[1].buildId).toBe('build-1');
    });
  });

  describe('getEntriesByVariant', () => {
    it('should return entries for specific variant', async () => {
      const debugEntry: BuildHistoryEntry = {
        buildId: 'build-debug',
        timestamp: new Date(),
        variant: BuildVariant.Debug,
        profile: 'development',
        buildDuration: 60,
        artifactCount: 1,
        success: true,
      };

      const releaseEntry: BuildHistoryEntry = {
        buildId: 'build-release',
        timestamp: new Date(),
        variant: BuildVariant.Release,
        profile: 'production',
        buildDuration: 120,
        artifactCount: 1,
        success: true,
      };

      await manager.addBuildEntry(debugEntry);
      await manager.addBuildEntry(releaseEntry);

      const debugEntries = await manager.getEntriesByVariant(BuildVariant.Debug);

      expect(debugEntries.length).toBe(1);
      expect(debugEntries[0].variant).toBe(BuildVariant.Debug);
    });
  });

  describe('getEntriesByDateRange', () => {
    it('should throw error if start date is after end date', async () => {
      const startDate = new Date('2024-01-20');
      const endDate = new Date('2024-01-10');

      await expect(manager.getEntriesByDateRange(startDate, endDate)).rejects.toThrow(
        'Start date must be before end date'
      );
    });

    it('should return entries within date range', async () => {
      const entry: BuildHistoryEntry = {
        buildId: 'build-123',
        timestamp: new Date('2024-01-15T10:00:00'),
        variant: BuildVariant.Debug,
        profile: 'development',
        buildDuration: 60,
        artifactCount: 1,
        success: true,
      };

      await manager.addBuildEntry(entry);

      const startDate = new Date('2024-01-10');
      const endDate = new Date('2024-01-20');
      const entries = await manager.getEntriesByDateRange(startDate, endDate);

      expect(entries.length).toBe(1);
    });
  });

  describe('getRecentEntries', () => {
    it('should throw error if limit is zero', async () => {
      await expect(manager.getRecentEntries(0)).rejects.toThrow('Limit must be greater than 0');
    });

    it('should return recent entries up to limit', async () => {
      for (let i = 0; i < 5; i++) {
        const entry: BuildHistoryEntry = {
          buildId: `build-${i}`,
          timestamp: new Date(Date.now() - i * 1000),
          variant: BuildVariant.Debug,
          profile: 'development',
          buildDuration: 60,
          artifactCount: 1,
          success: true,
        };
        await manager.addBuildEntry(entry);
      }

      const entries = await manager.getRecentEntries(3);

      expect(entries.length).toBe(3);
    });
  });

  describe('getEntryById', () => {
    it('should return entry by ID', async () => {
      const entry: BuildHistoryEntry = {
        buildId: 'build-123',
        timestamp: new Date(),
        variant: BuildVariant.Debug,
        profile: 'development',
        buildDuration: 60,
        artifactCount: 1,
        success: true,
      };

      await manager.addBuildEntry(entry);
      const retrieved = await manager.getEntryById('build-123');

      expect(retrieved).toBeDefined();
      expect(retrieved?.buildId).toBe('build-123');
    });

    it('should return undefined if entry not found', async () => {
      const retrieved = await manager.getEntryById('non-existent');
      expect(retrieved).toBeUndefined();
    });

    it('should throw error if buildId is empty', async () => {
      await expect(manager.getEntryById('')).rejects.toThrow('Build ID is required');
    });
  });

  describe('removeEntry', () => {
    it('should remove entry from history', async () => {
      const entry: BuildHistoryEntry = {
        buildId: 'build-123',
        timestamp: new Date(),
        variant: BuildVariant.Debug,
        profile: 'development',
        buildDuration: 60,
        artifactCount: 1,
        success: true,
      };

      await manager.addBuildEntry(entry);
      const removed = await manager.removeEntry('build-123');

      expect(removed).toBe(true);
      const entries = await manager.getAllEntries();
      expect(entries.length).toBe(0);
    });

    it('should return false if entry not found', async () => {
      const removed = await manager.removeEntry('non-existent');
      expect(removed).toBe(false);
    });
  });

  describe('clearHistory', () => {
    it('should clear all history entries', async () => {
      const entry: BuildHistoryEntry = {
        buildId: 'build-123',
        timestamp: new Date(),
        variant: BuildVariant.Debug,
        profile: 'development',
        buildDuration: 60,
        artifactCount: 1,
        success: true,
      };

      await manager.addBuildEntry(entry);
      await manager.clearHistory();

      const entries = await manager.getAllEntries();
      expect(entries.length).toBe(0);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics for empty history', async () => {
      const stats = await manager.getStatistics();

      expect(stats.totalBuilds).toBe(0);
      expect(stats.successfulBuilds).toBe(0);
      expect(stats.failedBuilds).toBe(0);
      expect(stats.averageBuildDuration).toBe(0);
    });

    it('should calculate statistics correctly', async () => {
      const entry1: BuildHistoryEntry = {
        buildId: 'build-1',
        timestamp: new Date(),
        variant: BuildVariant.Debug,
        profile: 'development',
        buildDuration: 60,
        artifactCount: 1,
        success: true,
      };

      const entry2: BuildHistoryEntry = {
        buildId: 'build-2',
        timestamp: new Date(),
        variant: BuildVariant.Release,
        profile: 'production',
        buildDuration: 120,
        artifactCount: 1,
        success: false,
      };

      await manager.addBuildEntry(entry1);
      await manager.addBuildEntry(entry2);

      const stats = await manager.getStatistics();

      expect(stats.totalBuilds).toBe(2);
      expect(stats.successfulBuilds).toBe(1);
      expect(stats.failedBuilds).toBe(1);
      expect(stats.averageBuildDuration).toBe(90);
    });
  });

  describe('createBuildHistoryManager', () => {
    it('should create a new BuildHistoryManager instance', () => {
      const instance = createBuildHistoryManager(tempDir);
      expect(instance).toBeInstanceOf(BuildHistoryManager);
    });
  });
});
