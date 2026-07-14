/**
 * Optimization Reporter Module
 *
 * This module provides optimization reporting including:
 * - Size reduction calculation
 * - Optimization metrics reporting
 * - Optimization opportunities identification
 *
 * Requirements: 17.4, 17.5
 *
 * @module utils/optimization-reporter
 */

/**
 * Optimization metrics
 */
export interface OptimizationMetrics {
  originalSize: number;
  optimizedSize: number;
  sizeReduction: number;
  reductionPercentage: number;
  codeShrinkingReduction: number;
  resourceShrinkingReduction: number;
  minificationReduction: number;
}

/**
 * Optimization opportunity
 */
export interface OptimizationOpportunity {
  type: 'code' | 'resource' | 'configuration';
  description: string;
  estimatedSavings: number;
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
}

/**
 * Optimization report
 */
export interface OptimizationReport {
  buildId: string;
  timestamp: Date;
  metrics: OptimizationMetrics;
  opportunities: OptimizationOpportunity[];
  summary: string;
}

/**
 * Calculate optimization metrics
 *
 * Calculates size reduction and optimization metrics.
 *
 * @param originalSize - Original APK size in bytes
 * @param optimizedSize - Optimized APK size in bytes
 * @param codeShrinkingReduction - Code shrinking reduction in bytes
 * @param resourceShrinkingReduction - Resource shrinking reduction in bytes
 * @returns Optimization metrics
 */
export function calculateOptimizationMetrics(
  originalSize: number,
  optimizedSize: number,
  codeShrinkingReduction: number = 0,
  resourceShrinkingReduction: number = 0
): OptimizationMetrics {
  const sizeReduction = originalSize - optimizedSize;
  const reductionPercentage = originalSize > 0 ? (sizeReduction / originalSize) * 100 : 0;
  const minificationReduction = sizeReduction - codeShrinkingReduction - resourceShrinkingReduction;

  return {
    originalSize,
    optimizedSize,
    sizeReduction,
    reductionPercentage: Math.round(reductionPercentage * 100) / 100,
    codeShrinkingReduction,
    resourceShrinkingReduction,
    minificationReduction: Math.max(0, minificationReduction),
  };
}

/**
 * Identify optimization opportunities
 *
 * Identifies potential optimization opportunities based on current metrics.
 *
 * @param metrics - Current optimization metrics
 * @returns Array of optimization opportunities
 */
export function identifyOptimizationOpportunities(
  metrics: OptimizationMetrics
): OptimizationOpportunity[] {
  const opportunities: OptimizationOpportunity[] = [];

  // Check if code shrinking could be improved
  if (metrics.codeShrinkingReduction < metrics.originalSize * 0.15) {
    opportunities.push({
      type: 'code',
      description: 'Code shrinking could be more aggressive',
      estimatedSavings: Math.round(metrics.originalSize * 0.1),
      priority: 'medium',
      recommendation: 'Consider using aggressive R8 optimization level',
    });
  }

  // Check if resource shrinking could be improved
  if (metrics.resourceShrinkingReduction < metrics.originalSize * 0.1) {
    opportunities.push({
      type: 'resource',
      description: 'Resource shrinking could be more aggressive',
      estimatedSavings: Math.round(metrics.originalSize * 0.08),
      priority: 'medium',
      recommendation: 'Enable resource density and language filters',
    });
  }

  // Check if overall reduction is sufficient
  if (metrics.reductionPercentage < 20) {
    opportunities.push({
      type: 'configuration',
      description: 'Overall optimization is below recommended threshold',
      estimatedSavings: Math.round(metrics.originalSize * 0.15),
      priority: 'high',
      recommendation: 'Enable all optimization features and review build configuration',
    });
  }

  // Check for unused dependencies
  if (metrics.originalSize > 50000000) {
    opportunities.push({
      type: 'code',
      description: 'APK size is large, review dependencies',
      estimatedSavings: Math.round(metrics.originalSize * 0.1),
      priority: 'high',
      recommendation: 'Audit and remove unused dependencies',
    });
  }

  return opportunities;
}

/**
 * Generate optimization report
 *
 * Generates a comprehensive optimization report.
 *
 * @param buildId - Build identifier
 * @param metrics - Optimization metrics
 * @returns Optimization report
 */
export function generateOptimizationReport(
  buildId: string,
  metrics: OptimizationMetrics
): OptimizationReport {
  const opportunities = identifyOptimizationOpportunities(metrics);

  const summary = `
Optimization Report for Build ${buildId}
========================================

Original Size: ${formatBytes(metrics.originalSize)}
Optimized Size: ${formatBytes(metrics.optimizedSize)}
Size Reduction: ${formatBytes(metrics.sizeReduction)} (${metrics.reductionPercentage}%)

Breakdown:
- Code Shrinking: ${formatBytes(metrics.codeShrinkingReduction)}
- Resource Shrinking: ${formatBytes(metrics.resourceShrinkingReduction)}
- Minification: ${formatBytes(metrics.minificationReduction)}

Optimization Opportunities: ${opportunities.length}
${opportunities.length > 0 ? `- ${opportunities.map((o) => o.description).join('\n- ')}` : 'None identified'}
`;

  return {
    buildId,
    timestamp: new Date(),
    metrics,
    opportunities,
    summary: summary.trim(),
  };
}

/**
 * Format bytes to human-readable format
 *
 * @param bytes - Number of bytes
 * @returns Formatted string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Compare two optimization reports
 *
 * Compares two optimization reports to identify improvements or regressions.
 *
 * @param previousReport - Previous optimization report
 * @param currentReport - Current optimization report
 * @returns Comparison summary
 */
export function compareOptimizationReports(
  previousReport: OptimizationReport,
  currentReport: OptimizationReport
): string {
  const sizeDifference = currentReport.metrics.optimizedSize - previousReport.metrics.optimizedSize;
  const percentageDifference =
    ((sizeDifference / previousReport.metrics.optimizedSize) * 100);

  let comparison = `
Optimization Comparison
=======================

Previous Build: ${formatBytes(previousReport.metrics.optimizedSize)}
Current Build: ${formatBytes(currentReport.metrics.optimizedSize)}
Difference: ${formatBytes(Math.abs(sizeDifference))} (${percentageDifference > 0 ? '+' : ''}${Math.round(percentageDifference * 100) / 100}%)

Status: ${sizeDifference < 0 ? 'IMPROVED ✓' : sizeDifference > 0 ? 'REGRESSED ✗' : 'UNCHANGED'}
`;

  if (sizeDifference > 0) {
    comparison += `
WARNING: APK size has increased. Review recent changes and optimization settings.
`;
  } else if (sizeDifference < 0) {
    comparison += `
GOOD: APK size has decreased. Optimization is working effectively.
`;
  }

  return comparison.trim();
}

/**
 * Generate optimization recommendations
 *
 * Generates specific recommendations based on optimization metrics.
 *
 * @param metrics - Optimization metrics
 * @returns Array of recommendations
 */
export function generateOptimizationRecommendations(
  metrics: OptimizationMetrics
): string[] {
  const recommendations: string[] = [];

  // Code shrinking recommendations
  if (metrics.codeShrinkingReduction < metrics.originalSize * 0.1) {
    recommendations.push('Enable aggressive R8 optimization for better code shrinking');
    recommendations.push('Review and update ProGuard/R8 keep rules to be less conservative');
  }

  // Resource shrinking recommendations
  if (metrics.resourceShrinkingReduction < metrics.originalSize * 0.05) {
    recommendations.push('Enable resource density filters to remove unused densities');
    recommendations.push('Enable language filters to remove unused translations');
  }

  // Overall optimization recommendations
  if (metrics.reductionPercentage < 15) {
    recommendations.push('Consider using dynamic feature modules for large features');
    recommendations.push('Review and remove unused dependencies');
    recommendations.push('Enable all available optimization features');
  }

  // Size-based recommendations
  if (metrics.optimizedSize > 100000000) {
    recommendations.push('APK size exceeds 100MB, consider splitting into multiple APKs');
    recommendations.push('Review native libraries and consider using App Bundle for distribution');
  }

  if (recommendations.length === 0) {
    recommendations.push('Optimization is performing well, no immediate changes recommended');
  }

  return recommendations;
}
