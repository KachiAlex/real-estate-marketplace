/**
 * Resource Shrinking Configurer Module
 *
 * This module provides resource shrinking configuration for build.gradle including:
 * - Resource shrinking configuration
 * - Resource keep rules
 * - Resource dependency handling
 *
 * Requirements: 17.1
 *
 * @module utils/resource-shrinking-configurer
 */

/**
 * Resource shrinking configuration
 */
export interface ResourceShrinkingConfiguration {
  enabled: boolean;
  shrinkResources: boolean;
  keepRules: string[];
  customRules: string[];
  densityFilters: string[];
  languageFilters: string[];
}

/**
 * Build resource shrinking configuration
 *
 * Generates resource shrinking configuration for build.gradle.
 *
 * @param customKeepRules - Custom resource keep rules to add
 * @returns Resource shrinking configuration
 */
export function buildResourceShrinkingConfiguration(
  customKeepRules: string[] = []
): ResourceShrinkingConfiguration {
  const baseKeepRules = [
    // Keep all resources by default (conservative approach)
    'keep res/**',
    // Keep drawable resources
    'keep res/drawable/**',
    'keep res/drawable-*/**',
    // Keep layout resources
    'keep res/layout/**',
    'keep res/layout-*/**',
    // Keep menu resources
    'keep res/menu/**',
    // Keep values resources
    'keep res/values/**',
    'keep res/values-*/**',
    // Keep raw resources
    'keep res/raw/**',
    // Keep anim resources
    'keep res/anim/**',
    // Keep color resources
    'keep res/color/**',
  ];

  return {
    enabled: true,
    shrinkResources: true,
    keepRules: baseKeepRules,
    customRules: customKeepRules,
    densityFilters: [],
    languageFilters: [],
  };
}

/**
 * Generate resource shrinking configuration for build.gradle
 *
 * Generates the configuration snippet for build.gradle.
 *
 * @param config - Resource shrinking configuration
 * @returns Configuration snippet for build.gradle
 */
export function generateResourceShrinkingGradleConfig(
  config: ResourceShrinkingConfiguration
): string {
  const lines: string[] = [
    '// Resource Shrinking Configuration',
    'buildTypes {',
    '  release {',
    `    shrinkResources ${config.shrinkResources}`,
  ];

  if (config.densityFilters.length > 0) {
    lines.push(`    resConfigs ${config.densityFilters.map((d) => `'${d}'`).join(', ')}`);
  }

  if (config.languageFilters.length > 0) {
    lines.push(`    resConfigs ${config.languageFilters.map((l) => `'${l}'`).join(', ')}`);
  }

  lines.push('  }');
  lines.push('}');

  return lines.join('\n');
}

/**
 * Generate resource keep rules file content
 *
 * Generates the content for a resources.txt keep rules file.
 *
 * @param config - Resource shrinking configuration
 * @returns Keep rules file content
 */
export function generateResourceKeepRulesContent(
  config: ResourceShrinkingConfiguration
): string {
  const lines: string[] = [
    '# Resource Keep Rules',
    '# Generated automatically',
    '',
    '# Base keep rules',
  ];

  config.keepRules.forEach((rule) => {
    lines.push(rule);
  });

  if (config.customRules.length > 0) {
    lines.push('');
    lines.push('# Custom keep rules');
    config.customRules.forEach((rule) => {
      lines.push(rule);
    });
  }

  return lines.join('\n');
}

/**
 * Add custom resource keep rule
 *
 * Adds a custom resource keep rule to the configuration.
 *
 * @param config - Resource shrinking configuration
 * @param rule - Keep rule to add
 * @returns Updated configuration
 */
export function addCustomResourceKeepRule(
  config: ResourceShrinkingConfiguration,
  rule: string
): ResourceShrinkingConfiguration {
  return {
    ...config,
    customRules: [...config.customRules, rule],
  };
}

/**
 * Add multiple custom resource keep rules
 *
 * Adds multiple custom resource keep rules to the configuration.
 *
 * @param config - Resource shrinking configuration
 * @param rules - Keep rules to add
 * @returns Updated configuration
 */
export function addCustomResourceKeepRules(
  config: ResourceShrinkingConfiguration,
  rules: string[]
): ResourceShrinkingConfiguration {
  return {
    ...config,
    customRules: [...config.customRules, ...rules],
  };
}

/**
 * Add density filter
 *
 * Adds a density filter to reduce APK size by excluding unused densities.
 *
 * @param config - Resource shrinking configuration
 * @param density - Density to filter (e.g., 'hdpi', 'xhdpi', 'xxhdpi')
 * @returns Updated configuration
 */
export function addDensityFilter(
  config: ResourceShrinkingConfiguration,
  density: string
): ResourceShrinkingConfiguration {
  return {
    ...config,
    densityFilters: [...config.densityFilters, density],
  };
}

/**
 * Add language filter
 *
 * Adds a language filter to reduce APK size by excluding unused languages.
 *
 * @param config - Resource shrinking configuration
 * @param language - Language code to filter (e.g., 'en', 'es', 'fr')
 * @returns Updated configuration
 */
export function addLanguageFilter(
  config: ResourceShrinkingConfiguration,
  language: string
): ResourceShrinkingConfiguration {
  return {
    ...config,
    languageFilters: [...config.languageFilters, language],
  };
}

/**
 * Calculate estimated size reduction
 *
 * Estimates the size reduction from resource shrinking based on filters.
 *
 * @param originalSize - Original APK size in bytes
 * @param densityFilters - Number of density filters applied
 * @param languageFilters - Number of language filters applied
 * @returns Estimated size reduction in bytes
 */
export function estimateSizeReduction(
  originalSize: number,
  densityFilters: number,
  languageFilters: number
): number {
  // Rough estimates based on typical Android apps
  // Each density filter typically saves 10-15% of resources
  // Each language filter typically saves 5-10% of resources
  const densityReduction = densityFilters * 0.12; // 12% per density
  const languageReduction = languageFilters * 0.07; // 7% per language
  const totalReduction = Math.min(densityReduction + languageReduction, 0.5); // Cap at 50%

  return Math.round(originalSize * totalReduction);
}
