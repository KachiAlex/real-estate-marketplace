import * as fs from 'fs';
import * as path from 'path';
import { BuildVariant, BuildManifest } from '../types/android-build';

/**
 * BuildHistoryEntry represents a single entry in the build history
 */
export interface BuildHistoryEntry {
  buildId: string;
  timestamp: Date;
  variant: BuildVariant;
  profile: string;
  buildDuration: number;
  artifactCount: number;
  success: boolean;
  manifestPath?: string;
}

/**
 * BuildHistory represents the complete build history
 */
export interface BuildHistory {
  entries: BuildHistoryEntry[];
  lastUpdated: Date;
}

/**
 * BuildHistoryManager maintains a history of recent builds for quick access and querying.
 */
export class BuildHistoryManager {
  private historyFilePath: string;
  private maxHistoryEntries: number = 100;

  constructor(baseDirectory: string, maxEntries: number = 100) {
    if (!baseDirectory) {
      throw new Error('Base directory is required');
    }

    this.historyFilePath = path.join(baseDirectory, 'history.json');
    this.maxHistoryEntries = maxEntries;
  }

  /**
   * Add a build entry to the history
   */
  async addBuildEntry(entry: BuildHistoryEntry): Promise<void> {
    if (!entry.buildId || entry.buildId.trim() === '') {
      throw new Error('Build ID is required');
    }

    if (!entry.variant) {
      throw new Error('Build variant is required');
    }

    if (entry.buildDuration < 0) {
      throw new Error('Build duration must be non-negative');
    }

    if (entry.artifactCount < 0) {
      throw new Error('Artifact count must be non-negative');
    }

    // Load existing history
    let history = await this.loadHistory();

    // Add new entry
    history.entries.unshift(entry);

    // Trim history to max entries
    if (history.entries.length > this.maxHistoryEntries) {
      history.entries = history.entries.slice(0, this.maxHistoryEntries);
    }

    // Update last modified timestamp
    history.lastUpdated = new Date();

    // Save history
    await this.saveHistory(history);
  }

  /**
   * Get all build history entries
   */
  async getAllEntries(): Promise<BuildHistoryEntry[]> {
    const history = await this.loadHistory();
    return history.entries;
  }

  /**
   * Get build entries for a specific variant
   */
  async getEntriesByVariant(variant: BuildVariant): Promise<BuildHistoryEntry[]> {
    const history = await this.loadHistory();
    return history.entries.filter((entry) => entry.variant === variant);
  }

  /**
   * Get build entries within a date range
   */
  async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<BuildHistoryEntry[]> {
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    const history = await this.loadHistory();
    return history.entries.filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Get the most recent build entries
   */
  async getRecentEntries(limit: number = 10): Promise<BuildHistoryEntry[]> {
    if (limit <= 0) {
      throw new Error('Limit must be greater than 0');
    }

    const history = await this.loadHistory();
    return history.entries.slice(0, limit);
  }

  /**
   * Get build entries for a specific variant within a date range
   */
  async getEntriesByVariantAndDateRange(
    variant: BuildVariant,
    startDate: Date,
    endDate: Date
  ): Promise<BuildHistoryEntry[]> {
    if (startDate > endDate) {
      throw new Error('Start date must be before end date');
    }

    const history = await this.loadHistory();
    return history.entries.filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      return (
        entry.variant === variant && entryDate >= startDate && entryDate <= endDate
      );
    });
  }

  /**
   * Get a specific build entry by ID
   */
  async getEntryById(buildId: string): Promise<BuildHistoryEntry | undefined> {
    if (!buildId || buildId.trim() === '') {
      throw new Error('Build ID is required');
    }

    const history = await this.loadHistory();
    return history.entries.find((entry) => entry.buildId === buildId);
  }

  /**
   * Remove a build entry from history
   */
  async removeEntry(buildId: string): Promise<boolean> {
    if (!buildId || buildId.trim() === '') {
      throw new Error('Build ID is required');
    }

    let history = await this.loadHistory();
    const initialLength = history.entries.length;

    history.entries = history.entries.filter((entry) => entry.buildId !== buildId);
    history.lastUpdated = new Date();

    if (history.entries.length < initialLength) {
      await this.saveHistory(history);
      return true;
    }

    return false;
  }

  /**
   * Clear all history entries
   */
  async clearHistory(): Promise<void> {
    const history: BuildHistory = {
      entries: [],
      lastUpdated: new Date(),
    };

    await this.saveHistory(history);
  }

  /**
   * Get statistics about build history
   */
  async getStatistics(): Promise<{
    totalBuilds: number;
    successfulBuilds: number;
    failedBuilds: number;
    averageBuildDuration: number;
    buildsByVariant: Record<string, number>;
  }> {
    const history = await this.loadHistory();
    const entries = history.entries;

    if (entries.length === 0) {
      return {
        totalBuilds: 0,
        successfulBuilds: 0,
        failedBuilds: 0,
        averageBuildDuration: 0,
        buildsByVariant: {},
      };
    }

    const successfulBuilds = entries.filter((e) => e.success).length;
    const failedBuilds = entries.filter((e) => !e.success).length;
    const totalDuration = entries.reduce((sum, e) => sum + e.buildDuration, 0);
    const averageBuildDuration = totalDuration / entries.length;

    const buildsByVariant: Record<string, number> = {};
    for (const entry of entries) {
      buildsByVariant[entry.variant] = (buildsByVariant[entry.variant] || 0) + 1;
    }

    return {
      totalBuilds: entries.length,
      successfulBuilds,
      failedBuilds,
      averageBuildDuration,
      buildsByVariant,
    };
  }

  /**
   * Load history from file
   */
  private async loadHistory(): Promise<BuildHistory> {
    if (!fs.existsSync(this.historyFilePath)) {
      return {
        entries: [],
        lastUpdated: new Date(),
      };
    }

    try {
      const content = fs.readFileSync(this.historyFilePath, 'utf-8');
      const history = JSON.parse(content) as BuildHistory;

      // Convert timestamp strings to Date objects
      history.entries = history.entries.map((entry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));

      history.lastUpdated = new Date(history.lastUpdated);

      return history;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid history JSON: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Save history to file
   */
  private async saveHistory(history: BuildHistory): Promise<void> {
    const directory = path.dirname(this.historyFilePath);

    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    const historyJson = JSON.stringify(history, null, 2);
    fs.writeFileSync(this.historyFilePath, historyJson, 'utf-8');
  }
}

/**
 * Factory function to create a BuildHistoryManager instance
 */
export function createBuildHistoryManager(
  baseDirectory: string,
  maxEntries?: number
): BuildHistoryManager {
  return new BuildHistoryManager(baseDirectory, maxEntries);
}
