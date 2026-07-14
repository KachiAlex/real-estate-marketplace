import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { BuildHistoryManager, BuildHistoryEntry } from './build-history-manager';
import { BuildVariant } from '../types/android-build';

describe('BuildHistoryManager - Property-Based Tests', () => {
  let tempDir: string;
  let manager: BuildHistoryManager;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'history-pbt-'));
    manager = new BuildHistoryManager(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Property 16: Build History Maintenance', () => {
    it('should maintain accessible and queryable history', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }),
          async (numEntries) => {
            // Add multiple entries
            for (let i = 0; i < numEntries; i++) {
              const entry: BuildHistoryEntry = {
                buildId: `build-${i}`,
                timestamp: new Date(Date.now() - i * 1000),
                variant: i % 2 === 0 ? BuildVariant.Debug : BuildVariant.Release,
                profile: i % 2 === 0 ? 'development' : 'production',
                buildDuration: 60 + i * 10,
                artifactCount: 1,
                success: i % 3 !== 0,
              };

              await manager.addBuildEntry(entry);
            }

            // Verify history is accessible
            const allEntries = await manager.getAllEntries();
            expect(allEntries.length).toBe(numEntries);

            // Verify entries are queryable by variant
            const debugEntries = await manager.getEntriesByVariant(BuildVariant.Debug);
            expect(debugEntries.length).toBeGreaterThan(0);

            // Verify entries are queryable by date range
            const startDate = new Date(Date.now() - 100000);
            const endDate = new Date(Date.now() + 1000);
            const rangeEntries = await manager.getEntriesByDateRange(startDate, endDate);
            expect(rangeEntries.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain history consistency across operations', () => {
      fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^build-[a-zA-Z0-9]{8}$/),
          fc.integer({ min: 1, max: 300 }),
          async (buildId, buildDuration) => {
            const entry: BuildHistoryEntry = {
              buildId,
              timestamp: new Date(),
              variant: BuildVariant.Debug,
              profile: 'development',
              buildDuration,
              artifactCount: 1,
              success: true,
            };

            // Add entry
            await manager.addBuildEntry(entry);

            // Retrieve entry
            const retrieved = await manager.getEntryById(buildId);

            // Verify consistency
            expect(retrieved).toBeDefined();
            expect(retrieved?.buildId).toBe(buildId);
            expect(retrieved?.buildDuration).toBe(buildDuration);
            expect(retrieved?.variant).toBe(BuildVariant.Debug);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should support querying by variant and date range', () => {
      fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant(BuildVariant.Debug),
            fc.constant(BuildVariant.Release),
            fc.constant(BuildVariant.AAB)
          ),
          async (variant) => {
            const entry: BuildHistoryEntry = {
              buildId: 'build-test',
              timestamp: new Date('2024-01-15T10:00:00'),
              variant: variant,
              profile: variant === BuildVariant.Debug ? 'development' : 'production',
              buildDuration: 60,
              artifactCount: 1,
              success: true,
            };

            await manager.addBuildEntry(entry);

            // Query by variant and date range
            const startDate = new Date('2024-01-10');
            const endDate = new Date('2024-01-20');
            const entries = await manager.getEntriesByVariantAndDateRange(
              variant,
              startDate,
              endDate
            );

            // Verify query results
            expect(entries.length).toBeGreaterThan(0);
            expect(entries[0].variant).toBe(variant);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain history order with most recent first', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 10 }),
          async (numEntries) => {
            // Add entries with different timestamps
            for (let i = 0; i < numEntries; i++) {
              const entry: BuildHistoryEntry = {
                buildId: `build-${i}`,
                timestamp: new Date(Date.now() - i * 10000),
                variant: BuildVariant.Debug,
                profile: 'development',
                buildDuration: 60,
                artifactCount: 1,
                success: true,
              };

              await manager.addBuildEntry(entry);
            }

            // Get all entries
            const entries = await manager.getAllEntries();

            // Verify order (most recent first)
            for (let i = 0; i < entries.length - 1; i++) {
              const current = new Date(entries[i].timestamp);
              const next = new Date(entries[i + 1].timestamp);
              expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide accurate statistics', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }),
          async (numEntries) => {
            let successCount = 0;
            let totalDuration = 0;

            // Add entries
            for (let i = 0; i < numEntries; i++) {
              const success = i % 3 !== 0;
              if (success) successCount++;

              const duration = 60 + i * 10;
              totalDuration += duration;

              const entry: BuildHistoryEntry = {
                buildId: `build-${i}`,
                timestamp: new Date(),
                variant: BuildVariant.Debug,
                profile: 'development',
                buildDuration: duration,
                artifactCount: 1,
                success: success,
              };

              await manager.addBuildEntry(entry);
            }

            // Get statistics
            const stats = await manager.getStatistics();

            // Verify statistics
            expect(stats.totalBuilds).toBe(numEntries);
            expect(stats.successfulBuilds).toBe(successCount);
            expect(stats.failedBuilds).toBe(numEntries - successCount);
            expect(stats.averageBuildDuration).toBe(totalDuration / numEntries);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: History Persistence', () => {
    it('should persist history across manager instances', () => {
      fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^build-[a-zA-Z0-9]{8}$/),
          async (buildId) => {
            const entry: BuildHistoryEntry = {
              buildId,
              timestamp: new Date(),
              variant: BuildVariant.Debug,
              profile: 'development',
              buildDuration: 60,
              artifactCount: 1,
              success: true,
            };

            // Add entry with first manager
            await manager.addBuildEntry(entry);

            // Create new manager instance
            const newManager = new BuildHistoryManager(tempDir);

            // Retrieve entry with new manager
            const retrieved = await newManager.getEntryById(buildId);

            // Verify persistence
            expect(retrieved).toBeDefined();
            expect(retrieved?.buildId).toBe(buildId);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: History Removal', () => {
    it('should correctly remove entries from history', () => {
      fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^build-[a-zA-Z0-9]{8}$/),
          async (buildId) => {
            const entry: BuildHistoryEntry = {
              buildId,
              timestamp: new Date(),
              variant: BuildVariant.Debug,
              profile: 'development',
              buildDuration: 60,
              artifactCount: 1,
              success: true,
            };

            // Add entry
            await manager.addBuildEntry(entry);

            // Remove entry
            const removed = await manager.removeEntry(buildId);

            // Verify removal
            expect(removed).toBe(true);

            // Verify entry is gone
            const retrieved = await manager.getEntryById(buildId);
            expect(retrieved).toBeUndefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Recent Entries Retrieval', () => {
    it('should retrieve recent entries correctly', () => {
      fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 20 }),
          fc.integer({ min: 1, max: 10 }),
          async (numEntries, limit) => {
            // Add entries
            for (let i = 0; i < numEntries; i++) {
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

            // Get recent entries
            const recentEntries = await manager.getRecentEntries(limit);

            // Verify limit is respected
            expect(recentEntries.length).toBeLessThanOrEqual(limit);
            expect(recentEntries.length).toBeLessThanOrEqual(numEntries);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
