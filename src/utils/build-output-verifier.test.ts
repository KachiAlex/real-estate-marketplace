/**
 * Unit Tests for Build Output Verification
 *
 * Tests for verifying that the build output is correctly configured for Capacitor,
 * including webDir configuration, asset paths, and build output structure.
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Build Output Verification', () => {
  const buildDir = path.join(__dirname, '../../build');
  const publicDir = path.join(__dirname, '../../public');

  describe('Build Directory Structure', () => {
    it('should have build directory', () => {
      expect(fs.existsSync(buildDir)).toBe(true);
    });

    it('should have index.html in build directory', () => {
      const indexPath = path.join(buildDir, 'index.html');
      expect(fs.existsSync(indexPath)).toBe(true);
    });

    it('should have static/js directory', () => {
      const jsDir = path.join(buildDir, 'static', 'js');
      expect(fs.existsSync(jsDir)).toBe(true);
    });

    it('should have static/css directory', () => {
      const cssDir = path.join(buildDir, 'static', 'css');
      expect(fs.existsSync(cssDir)).toBe(true);
    });

    it('should have manifest.json', () => {
      const manifestPath = path.join(buildDir, 'manifest.json');
      expect(fs.existsSync(manifestPath)).toBe(true);
    });

    it('should have asset-manifest.json', () => {
      const assetManifestPath = path.join(buildDir, 'asset-manifest.json');
      expect(fs.existsSync(assetManifestPath)).toBe(true);
    });
  });

  describe('Asset Files', () => {
    it('should have JavaScript bundles in static/js', () => {
      const jsDir = path.join(buildDir, 'static', 'js');
      const files = fs.readdirSync(jsDir);
      const jsFiles = files.filter(f => f.endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThan(0);
    });

    it('should have CSS files in static/css', () => {
      const cssDir = path.join(buildDir, 'static', 'css');
      const files = fs.readdirSync(cssDir);
      const cssFiles = files.filter(f => f.endsWith('.css'));
      expect(cssFiles.length).toBeGreaterThan(0);
    });

    it('should have main.js bundle', () => {
      const jsDir = path.join(buildDir, 'static', 'js');
      const files = fs.readdirSync(jsDir);
      const mainJs = files.find(f => f.startsWith('main.') && f.endsWith('.js'));
      expect(mainJs).toBeDefined();
    });

    it('should have main.css bundle', () => {
      const cssDir = path.join(buildDir, 'static', 'css');
      const files = fs.readdirSync(cssDir);
      const mainCss = files.find(f => f.startsWith('main.') && f.endsWith('.css'));
      expect(mainCss).toBeDefined();
    });
  });

  describe('HTML Configuration', () => {
    it('should have correct viewport meta tag', () => {
      const indexPath = path.join(buildDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('viewport-fit=cover');
      expect(content).toContain('width=device-width');
      expect(content).toContain('initial-scale=1');
    });

    it('should have apple-mobile-web-app-capable meta tag', () => {
      const indexPath = path.join(buildDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('apple-mobile-web-app-capable');
    });

    it('should have theme-color meta tag', () => {
      const indexPath = path.join(buildDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('theme-color');
    });

    it('should reference static assets with relative paths', () => {
      const indexPath = path.join(buildDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      // Check for relative paths (./static/...)
      expect(content).toMatch(/href="\.\/static\/css\/main\./);
      expect(content).toMatch(/src="\.\/static\/js\/main\./);
    });

    it('should have root div for React', () => {
      const indexPath = path.join(buildDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      expect(content).toContain('id="root"');
    });
  });

  describe('Manifest Configuration', () => {
    it('should have valid manifest.json', () => {
      const manifestPath = path.join(buildDir, 'manifest.json');
      const content = fs.readFileSync(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);
      expect(manifest).toBeDefined();
      expect(manifest.name).toBeDefined();
    });

    it('should have valid asset-manifest.json', () => {
      const assetManifestPath = path.join(buildDir, 'asset-manifest.json');
      const content = fs.readFileSync(assetManifestPath, 'utf-8');
      const assetManifest = JSON.parse(content);
      expect(assetManifest).toBeDefined();
      expect(assetManifest.files).toBeDefined();
    });
  });

  describe('Asset Accessibility', () => {
    it('should have all referenced assets accessible', () => {
      const indexPath = path.join(buildDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');

      // Extract all asset references
      const cssMatches = content.match(/href="([^"]*\.css)"/g) || [];
      const jsMatches = content.match(/src="([^"]*\.js)"/g) || [];

      // Verify CSS files exist
      cssMatches.forEach(match => {
        const assetPath = match.match(/href="([^"]*)"/)?.[1];
        if (assetPath && !assetPath.startsWith('http')) {
          const fullPath = path.join(buildDir, assetPath.replace(/^\.\//, ''));
          expect(fs.existsSync(fullPath)).toBe(true);
        }
      });

      // Verify JS files exist
      jsMatches.forEach(match => {
        const assetPath = match.match(/src="([^"]*)"/)?.[1];
        if (assetPath && !assetPath.startsWith('http')) {
          const fullPath = path.join(buildDir, assetPath.replace(/^\.\//, ''));
          expect(fs.existsSync(fullPath)).toBe(true);
        }
      });
    });

    it('should have logo.png accessible', () => {
      const logoPath = path.join(buildDir, 'logo.png');
      expect(fs.existsSync(logoPath)).toBe(true);
    });
  });

  describe('Build Output Size', () => {
    it('should have reasonable bundle size', () => {
      const jsDir = path.join(buildDir, 'static', 'js');
      const files = fs.readdirSync(jsDir);
      const jsFiles = files.filter(f => f.endsWith('.js'));

      let totalSize = 0;
      jsFiles.forEach(file => {
        const filePath = path.join(jsDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      // Main bundle should be less than 5MB (uncompressed)
      // This is reasonable for a full-featured real estate app
      expect(totalSize).toBeLessThan(5 * 1024 * 1024);
      // But should be at least 100KB (not empty)
      expect(totalSize).toBeGreaterThan(100 * 1024);
    });

    it('should have CSS files', () => {
      const cssDir = path.join(buildDir, 'static', 'css');
      const files = fs.readdirSync(cssDir);
      const cssFiles = files.filter(f => f.endsWith('.css'));

      expect(cssFiles.length).toBeGreaterThan(0);

      let totalSize = 0;
      cssFiles.forEach(file => {
        const filePath = path.join(cssDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      // CSS should be less than 500KB (uncompressed)
      expect(totalSize).toBeLessThan(500 * 1024);
      // But should be at least 10KB (not empty)
      expect(totalSize).toBeGreaterThan(10 * 1024);
    });
  });

  describe('Capacitor Configuration', () => {
    it('should have capacitor.config.ts file', () => {
      const configPath = path.join(__dirname, '../../capacitor.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);
    });

    it('should have webDir set to build', () => {
      const configPath = path.join(__dirname, '../../capacitor.config.ts');
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain("webDir: 'build'");
    });

    it('should have proper plugin configurations', () => {
      const configPath = path.join(__dirname, '../../capacitor.config.ts');
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('CapacitorHttp');
      expect(content).toContain('CapacitorCookies');
      expect(content).toContain('StatusBar');
      expect(content).toContain('SafeArea');
    });

    it('should have Android configuration', () => {
      const configPath = path.join(__dirname, '../../capacitor.config.ts');
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('minSdkVersion');
      expect(content).toContain('targetSdkVersion');
    });

    it('should have iOS configuration', () => {
      const configPath = path.join(__dirname, '../../capacitor.config.ts');
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('deploymentTarget');
      expect(content).toContain('scheme');
    });
  });
});
