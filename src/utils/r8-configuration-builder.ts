/**
 * R8 Configuration Builder Module
 *
 * This module provides R8 configuration for code obfuscation including:
 * - R8 configuration generation
 * - Keep rules configuration
 * - Optimization level settings
 *
 * Requirements: 2.2, 17.2, 17.3
 *
 * @module utils/r8-configuration-builder
 */

/**
 * R8 configuration
 */
export interface R8Configuration {
  enabled: boolean;
  minifyEnabled: boolean;
  obfuscationEnabled: boolean;
  optimizationEnabled: boolean;
  keepRules: string[];
  customRules: string[];
  optimizationLevel: 'aggressive' | 'moderate' | 'conservative';
}

/**
 * Build R8 configuration
 *
 * Generates R8 configuration for code obfuscation and optimization.
 *
 * @param optimizationLevel - Level of optimization (aggressive, moderate, conservative)
 * @param customKeepRules - Custom keep rules to add
 * @returns R8 configuration
 */
export function buildR8Configuration(
  optimizationLevel: 'aggressive' | 'moderate' | 'conservative' = 'moderate',
  customKeepRules: string[] = []
): R8Configuration {
  const baseKeepRules = [
    // Keep public classes and methods
    '-keep public class * { public *; }',
    // Keep Android framework classes
    '-keep class android.** { *; }',
    '-keep class androidx.** { *; }',
    // Keep native methods
    '-keepclasseswithmembernames class * { native <methods>; }',
    // Keep enums
    '-keepclassmembers enum * { public static **[] values(); public static ** valueOf(java.lang.String); }',
    // Keep Parcelable implementations
    '-keep class * implements android.os.Parcelable { public static final android.os.Parcelable$Creator *; }',
    // Keep Serializable classes
    '-keepclassmembers class * implements java.io.Serializable { static final long serialVersionUID; private static final java.io.ObjectStreamField[] serialPersistentFields; private void writeObject(java.io.ObjectOutputStream); private void readObject(java.io.ObjectInputStream); java.lang.Object writeReplace(); java.lang.Object readResolve(); }',
  ];

  const optimizationSettings = {
    aggressive: {
      minifyEnabled: true,
      obfuscationEnabled: true,
      optimizationEnabled: true,
    },
    moderate: {
      minifyEnabled: true,
      obfuscationEnabled: true,
      optimizationEnabled: true,
    },
    conservative: {
      minifyEnabled: true,
      obfuscationEnabled: false,
      optimizationEnabled: false,
    },
  };

  return {
    enabled: true,
    minifyEnabled: optimizationSettings[optimizationLevel].minifyEnabled,
    obfuscationEnabled: optimizationSettings[optimizationLevel].obfuscationEnabled,
    optimizationEnabled: optimizationSettings[optimizationLevel].optimizationEnabled,
    keepRules: baseKeepRules,
    customRules: customKeepRules,
    optimizationLevel,
  };
}

/**
 * Generate R8 configuration file content
 *
 * Generates the content for a proguard-rules.pro file.
 *
 * @param config - R8 configuration
 * @returns Configuration file content
 */
export function generateR8ConfigurationContent(config: R8Configuration): string {
  const lines: string[] = [
    '# R8 Configuration',
    '# Generated automatically',
    '',
    '# Optimization level',
    `-optimizationpasses ${config.optimizationLevel === 'aggressive' ? 5 : config.optimizationLevel === 'moderate' ? 3 : 1}`,
    '',
    '# Keep rules',
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

  lines.push('');
  lines.push('# Optimization settings');
  if (config.obfuscationEnabled) {
    lines.push('-obfuscate');
  } else {
    lines.push('-dontobfuscate');
  }

  if (config.optimizationEnabled) {
    lines.push('-optimizations code/simplification/arithmetic,code/simplification/cast,field/*,class/merging/*');
  } else {
    lines.push('-dontoptimize');
  }

  return lines.join('\n');
}

/**
 * Add custom keep rule
 *
 * Adds a custom keep rule to the configuration.
 *
 * @param config - R8 configuration
 * @param rule - Keep rule to add
 * @returns Updated configuration
 */
export function addCustomKeepRule(config: R8Configuration, rule: string): R8Configuration {
  return {
    ...config,
    customRules: [...config.customRules, rule],
  };
}

/**
 * Add multiple custom keep rules
 *
 * Adds multiple custom keep rules to the configuration.
 *
 * @param config - R8 configuration
 * @param rules - Keep rules to add
 * @returns Updated configuration
 */
export function addCustomKeepRules(config: R8Configuration, rules: string[]): R8Configuration {
  return {
    ...config,
    customRules: [...config.customRules, ...rules],
  };
}
