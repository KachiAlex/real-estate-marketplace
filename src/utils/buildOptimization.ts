/**
 * Build Optimization Utilities
 * 
 * Provides utilities for optimizing the build process and bundle size.
 */

/**
 * Build optimization configuration
 */
export interface BuildOptimizationConfig {
  enableCodeSplitting: boolean;
  enableTreeShaking: boolean;
  enableMinification: boolean;
  enableSourceMaps: boolean;
  enableImageOptimization: boolean;
  enableCssMinification: boolean;
  enableCompressionPlugin: boolean;
  targetBundleSize: number; // in KB
}

/**
 * Default build optimization configuration
 */
export const DEFAULT_BUILD_CONFIG: BuildOptimizationConfig = {
  enableCodeSplitting: true,
  enableTreeShaking: true,
  enableMinification: true,
  enableSourceMaps: process.env.NODE_ENV === 'development',
  enableImageOptimization: true,
  enableCssMinification: true,
  enableCompressionPlugin: true,
  targetBundleSize: 500, // 500 KB target
};

/**
 * Get build optimization configuration
 */
export function getBuildConfig(): BuildOptimizationConfig {
  return {
    ...DEFAULT_BUILD_CONFIG,
    enableSourceMaps: process.env.GENERATE_SOURCEMAP === 'true',
  };
}

/**
 * Analyze bundle size
 */
export interface BundleAnalysis {
  totalSize: number;
  mainSize: number;
  vendorSize: number;
  chunks: Array<{
    name: string;
    size: number;
    percentage: number;
  }>;
  optimizationScore: number;
}

/**
 * Get bundle analysis recommendations
 */
export function getBundleRecommendations(analysis: BundleAnalysis): string[] {
  const recommendations: string[] = [];

  if (analysis.totalSize > DEFAULT_BUILD_CONFIG.targetBundleSize) {
    recommendations.push(
      `Bundle size (${analysis.totalSize}KB) exceeds target (${DEFAULT_BUILD_CONFIG.targetBundleSize}KB). Consider code splitting or lazy loading.`
    );
  }

  if (analysis.vendorSize > analysis.totalSize * 0.5) {
    recommendations.push(
      'Vendor bundle is larger than 50% of total. Consider removing unused dependencies.'
    );
  }

  if (analysis.optimizationScore < 70) {
    recommendations.push(
      'Optimization score is below 70. Consider enabling additional optimizations.'
    );
  }

  return recommendations;
}

/**
 * Code splitting configuration
 */
export interface CodeSplittingConfig {
  enableRouteBasedSplitting: boolean;
  enableComponentLazyLoading: boolean;
  enableVendorSplitting: boolean;
  minChunkSize: number; // in KB
  maxChunkSize: number; // in KB
}

/**
 * Default code splitting configuration
 */
export const DEFAULT_CODE_SPLITTING_CONFIG: CodeSplittingConfig = {
  enableRouteBasedSplitting: true,
  enableComponentLazyLoading: true,
  enableVendorSplitting: true,
  minChunkSize: 20,
  maxChunkSize: 500,
};

/**
 * Image optimization configuration
 */
export interface ImageOptimizationConfig {
  enableWebP: boolean;
  enableLazyLoading: boolean;
  enableResponsiveImages: boolean;
  maxImageSize: number; // in KB
  jpegQuality: number; // 0-100
  pngCompressionLevel: number; // 0-9
}

/**
 * Default image optimization configuration
 */
export const DEFAULT_IMAGE_OPTIMIZATION_CONFIG: ImageOptimizationConfig = {
  enableWebP: true,
  enableLazyLoading: true,
  enableResponsiveImages: true,
  maxImageSize: 100,
  jpegQuality: 80,
  pngCompressionLevel: 9,
};

/**
 * CSS optimization configuration
 */
export interface CssOptimizationConfig {
  enableMinification: boolean;
  enablePurging: boolean;
  enableCriticalCss: boolean;
  enableCssInJs: boolean;
}

/**
 * Default CSS optimization configuration
 */
export const DEFAULT_CSS_OPTIMIZATION_CONFIG: CssOptimizationConfig = {
  enableMinification: true,
  enablePurging: true,
  enableCriticalCss: true,
  enableCssInJs: false,
};

/**
 * JavaScript optimization configuration
 */
export interface JavaScriptOptimizationConfig {
  enableMinification: boolean;
  enableTreeShaking: boolean;
  enableDeadCodeElimination: boolean;
  enableConstantFolding: boolean;
  enableInlining: boolean;
}

/**
 * Default JavaScript optimization configuration
 */
export const DEFAULT_JAVASCRIPT_OPTIMIZATION_CONFIG: JavaScriptOptimizationConfig = {
  enableMinification: true,
  enableTreeShaking: true,
  enableDeadCodeElimination: true,
  enableConstantFolding: true,
  enableInlining: true,
};

/**
 * Get optimization recommendations for mobile
 */
export function getMobileOptimizationRecommendations(): string[] {
  return [
    'Enable code splitting for faster initial load',
    'Use lazy loading for images and components',
    'Minimize bundle size for slower networks',
    'Enable compression for all assets',
    'Use service workers for offline support',
    'Optimize fonts for mobile devices',
    'Enable HTTP/2 push for critical resources',
    'Use CDN for static assets',
    'Enable caching for better performance',
    'Monitor Core Web Vitals',
  ];
}

/**
 * Get performance budget
 */
export interface PerformanceBudget {
  javascript: number; // KB
  css: number; // KB
  images: number; // KB
  fonts: number; // KB
  total: number; // KB
}

/**
 * Default performance budget for mobile
 */
export const DEFAULT_MOBILE_PERFORMANCE_BUDGET: PerformanceBudget = {
  javascript: 200,
  css: 50,
  images: 200,
  fonts: 50,
  total: 500,
};

/**
 * Check if bundle meets performance budget
 */
export function checkPerformanceBudget(
  actual: PerformanceBudget,
  budget: PerformanceBudget = DEFAULT_MOBILE_PERFORMANCE_BUDGET
): {
  passed: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  if (actual.javascript > budget.javascript) {
    violations.push(
      `JavaScript bundle (${actual.javascript}KB) exceeds budget (${budget.javascript}KB)`
    );
  }

  if (actual.css > budget.css) {
    violations.push(`CSS bundle (${actual.css}KB) exceeds budget (${budget.css}KB)`);
  }

  if (actual.images > budget.images) {
    violations.push(`Images (${actual.images}KB) exceed budget (${budget.images}KB)`);
  }

  if (actual.fonts > budget.fonts) {
    violations.push(`Fonts (${actual.fonts}KB) exceed budget (${budget.fonts}KB)`);
  }

  if (actual.total > budget.total) {
    violations.push(`Total bundle (${actual.total}KB) exceeds budget (${budget.total}KB)`);
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Get build optimization tips
 */
export function getBuildOptimizationTips(): string[] {
  return [
    'Use dynamic imports for route-based code splitting',
    'Lazy load components that are not immediately visible',
    'Remove unused dependencies and code',
    'Use tree-shaking to eliminate dead code',
    'Optimize images with appropriate formats and sizes',
    'Minify CSS and JavaScript',
    'Enable gzip compression',
    'Use a CDN for static assets',
    'Implement service workers for offline support',
    'Monitor bundle size with webpack-bundle-analyzer',
    'Use production builds for deployment',
    'Enable source maps for debugging in production',
    'Use HTTP/2 for better performance',
    'Implement caching strategies',
    'Monitor Core Web Vitals',
  ];
}

export default {
  getBuildConfig,
  getBundleRecommendations,
  getMobileOptimizationRecommendations,
  checkPerformanceBudget,
  getBuildOptimizationTips,
  DEFAULT_BUILD_CONFIG,
  DEFAULT_CODE_SPLITTING_CONFIG,
  DEFAULT_IMAGE_OPTIMIZATION_CONFIG,
  DEFAULT_CSS_OPTIMIZATION_CONFIG,
  DEFAULT_JAVASCRIPT_OPTIMIZATION_CONFIG,
  DEFAULT_MOBILE_PERFORMANCE_BUDGET,
};
