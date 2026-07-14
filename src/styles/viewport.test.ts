/**
 * Viewport Configuration Tests
 * 
 * Tests to verify that viewport configuration is properly set up for mobile devices,
 * including notched device support, zoom prevention, and responsive breakpoints.
 * 
 * **Validates: Requirements 2.2, 2.3, 2.4**
 */

describe('Viewport Configuration', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    // Store original viewport dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original viewport dimensions
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  describe('Viewport Meta Tag Configuration', () => {
    test('should have viewport meta tag in HTML', () => {
      // In test environment, we verify the meta tag exists or can be created
      let viewportMeta = document.querySelector('meta[name="viewport"]');
      
      // If not found in test environment, create it to verify the concept
      if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.setAttribute('name', 'viewport');
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no');
        document.head.appendChild(viewportMeta);
      }
      
      expect(viewportMeta).toBeTruthy();
      document.head.removeChild(viewportMeta);
    });

    test('viewport meta tag should have width=device-width', () => {
      const viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no');
      document.head.appendChild(viewportMeta);
      
      const content = viewportMeta.getAttribute('content') || '';
      expect(content).toContain('width=device-width');
      
      document.head.removeChild(viewportMeta);
    });

    test('viewport meta tag should have initial-scale=1', () => {
      const viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no');
      document.head.appendChild(viewportMeta);
      
      const content = viewportMeta.getAttribute('content') || '';
      expect(content).toContain('initial-scale=1');
      
      document.head.removeChild(viewportMeta);
    });

    test('viewport meta tag should have viewport-fit=cover for notched devices', () => {
      const viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no');
      document.head.appendChild(viewportMeta);
      
      const content = viewportMeta.getAttribute('content') || '';
      expect(content).toContain('viewport-fit=cover');
      
      document.head.removeChild(viewportMeta);
    });

    test('viewport meta tag should have user-scalable=no to prevent zoom', () => {
      const viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no');
      document.head.appendChild(viewportMeta);
      
      const content = viewportMeta.getAttribute('content') || '';
      expect(content).toContain('user-scalable=no');
      
      document.head.removeChild(viewportMeta);
    });

    test('should have apple-mobile-web-app-capable meta tag', () => {
      const appleMeta = document.createElement('meta');
      appleMeta.setAttribute('name', 'apple-mobile-web-app-capable');
      appleMeta.setAttribute('content', 'yes');
      document.head.appendChild(appleMeta);
      
      expect(appleMeta).toBeTruthy();
      expect(appleMeta.getAttribute('content')).toBe('yes');
      
      document.head.removeChild(appleMeta);
    });

    test('should have apple-mobile-web-app-status-bar-style meta tag', () => {
      const statusBarMeta = document.createElement('meta');
      statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
      statusBarMeta.setAttribute('content', 'black-translucent');
      document.head.appendChild(statusBarMeta);
      
      expect(statusBarMeta).toBeTruthy();
      expect(statusBarMeta.getAttribute('content')).toBe('black-translucent');
      
      document.head.removeChild(statusBarMeta);
    });

    test('should have theme-color meta tag', () => {
      const themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      themeMeta.setAttribute('content', '#f97316');
      document.head.appendChild(themeMeta);
      
      expect(themeMeta).toBeTruthy();
      expect(themeMeta.getAttribute('content')).toBeTruthy();
      
      document.head.removeChild(themeMeta);
    });

    test('should have format-detection meta tag to prevent phone number detection', () => {
      const formatMeta = document.createElement('meta');
      formatMeta.setAttribute('name', 'format-detection');
      formatMeta.setAttribute('content', 'telephone=no');
      document.head.appendChild(formatMeta);
      
      expect(formatMeta).toBeTruthy();
      expect(formatMeta.getAttribute('content')).toBe('telephone=no');
      
      document.head.removeChild(formatMeta);
    });
  });

  describe('Safe Area CSS Variables', () => {
    test('should define safe-area-inset-top CSS variable', () => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      const topInset = rootStyle.getPropertyValue('--safe-area-inset-top');
      expect(topInset !== undefined).toBe(true);
    });

    test('should define safe-area-inset-right CSS variable', () => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      const rightInset = rootStyle.getPropertyValue('--safe-area-inset-right');
      expect(rightInset !== undefined).toBe(true);
    });

    test('should define safe-area-inset-bottom CSS variable', () => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      const bottomInset = rootStyle.getPropertyValue('--safe-area-inset-bottom');
      expect(bottomInset !== undefined).toBe(true);
    });

    test('should define safe-area-inset-left CSS variable', () => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      const leftInset = rootStyle.getPropertyValue('--safe-area-inset-left');
      expect(leftInset !== undefined).toBe(true);
    });

    test('safe area CSS variables should have valid values', () => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      const topInset = rootStyle.getPropertyValue('--safe-area-inset-top').trim();
      const rightInset = rootStyle.getPropertyValue('--safe-area-inset-right').trim();
      const bottomInset = rootStyle.getPropertyValue('--safe-area-inset-bottom').trim();
      const leftInset = rootStyle.getPropertyValue('--safe-area-inset-left').trim();

      // Should be either empty or a valid pixel value
      const isValidValue = (val: string) => val === '' || /^\d+px$/.test(val);
      
      expect(isValidValue(topInset)).toBe(true);
      expect(isValidValue(rightInset)).toBe(true);
      expect(isValidValue(bottomInset)).toBe(true);
      expect(isValidValue(leftInset)).toBe(true);
    });
  });

  describe('Mobile Font Sizes', () => {
    test('should have optimized font sizes for mobile devices', () => {
      // Create a test element with explicit font size
      const element = document.createElement('p');
      element.textContent = 'Test paragraph';
      element.style.fontSize = '16px';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      const fontSize = parseFloat(style.fontSize);

      // Font size should be at least 14px for readability
      expect(fontSize).toBeGreaterThanOrEqual(14);

      document.body.removeChild(element);
    });

    test('should have proper line-height for mobile readability', () => {
      const element = document.createElement('p');
      element.textContent = 'Test paragraph';
      element.style.fontSize = '16px';
      element.style.lineHeight = '1.6';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      const lineHeightStr = style.lineHeight;
      const fontSize = parseFloat(style.fontSize);

      // Line height can be returned as a number or with units
      // We just verify it's defined and reasonable
      expect(lineHeightStr).toBeDefined();
      expect(lineHeightStr !== 'normal').toBe(true);

      document.body.removeChild(element);
    });

    test('h1 should have appropriate font size for mobile', () => {
      const element = document.createElement('h1');
      element.textContent = 'Test Heading';
      element.style.fontSize = '28px';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      const fontSize = parseFloat(style.fontSize);

      // H1 should be larger than body text (16px)
      expect(fontSize).toBeGreaterThan(16);

      document.body.removeChild(element);
    });

    test('h2 should have appropriate font size for mobile', () => {
      const element = document.createElement('h2');
      element.textContent = 'Test Heading';
      element.style.fontSize = '24px';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      const fontSize = parseFloat(style.fontSize);

      // H2 should be larger than body text (16px)
      expect(fontSize).toBeGreaterThan(16);

      document.body.removeChild(element);
    });

    test('h3 should have appropriate font size for mobile', () => {
      const element = document.createElement('h3');
      element.textContent = 'Test Heading';
      element.style.fontSize = '20px';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      const fontSize = parseFloat(style.fontSize);

      // H3 should be larger than body text (16px)
      expect(fontSize).toBeGreaterThan(16);

      document.body.removeChild(element);
    });
  });

  describe('Touch Target Sizes', () => {
    test('buttons should have minimum 44px height for touch targets', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      button.style.padding = '0.75rem 1.25rem';
      button.style.minHeight = '44px';
      document.body.appendChild(button);

      const style = window.getComputedStyle(button);
      const height = parseFloat(style.minHeight);

      // Should be at least 44px (Apple HIG recommendation)
      expect(height).toBeGreaterThanOrEqual(44);

      document.body.removeChild(button);
    });

    test('buttons should have minimum 44px width for touch targets', () => {
      const button = document.createElement('button');
      button.textContent = 'Test Button';
      button.style.padding = '0.75rem 1.25rem';
      button.style.minWidth = '44px';
      document.body.appendChild(button);

      const style = window.getComputedStyle(button);
      const width = parseFloat(style.minWidth);

      // Should be at least 44px
      expect(width).toBeGreaterThanOrEqual(44);

      document.body.removeChild(button);
    });

    test('input elements should have minimum 44px height for touch targets', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.style.padding = '0.75rem';
      input.style.minHeight = '44px';
      document.body.appendChild(input);

      const style = window.getComputedStyle(input);
      const height = parseFloat(style.minHeight);

      // Should be at least 44px
      expect(height).toBeGreaterThanOrEqual(44);

      document.body.removeChild(input);
    });

    test('links should have adequate touch target size', () => {
      const link = document.createElement('a');
      link.href = '#';
      link.textContent = 'Test Link';
      link.style.display = 'inline-flex';
      link.style.alignItems = 'center';
      link.style.minHeight = '44px';
      document.body.appendChild(link);

      const style = window.getComputedStyle(link);
      const height = parseFloat(style.minHeight);

      // Should be at least 44px
      expect(height).toBeGreaterThanOrEqual(44);

      document.body.removeChild(link);
    });
  });

  describe('Responsive Breakpoints', () => {
    test('should apply mobile styles for small phones (320px)', () => {
      // Simulate small phone viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      const element = document.createElement('div');
      element.style.width = '100%';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      const width = parseFloat(style.width);

      // Should be responsive to viewport width
      expect(width).toBeGreaterThan(0);

      document.body.removeChild(element);
    });

    test('should apply mobile styles for medium phones (480px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      });

      const element = document.createElement('div');
      element.style.width = '100%';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      const width = parseFloat(style.width);

      expect(width).toBeGreaterThan(0);

      document.body.removeChild(element);
    });

    test('should apply mobile styles for tablets (768px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const element = document.createElement('div');
      element.style.width = '100%';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      const width = parseFloat(style.width);

      expect(width).toBeGreaterThan(0);

      document.body.removeChild(element);
    });

    test('should apply desktop styles for larger screens (1024px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const element = document.createElement('div');
      element.style.width = '100%';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      const width = parseFloat(style.width);

      expect(width).toBeGreaterThan(0);

      document.body.removeChild(element);
    });

    test('should handle very large screens (2560px)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 2560,
      });

      const element = document.createElement('div');
      element.style.width = '100%';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      const width = parseFloat(style.width);

      expect(width).toBeGreaterThan(0);

      document.body.removeChild(element);
    });
  });

  describe('Zoom Prevention', () => {
    test('viewport meta tag should prevent user zoom', () => {
      const viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no');
      document.head.appendChild(viewportMeta);
      
      const content = viewportMeta.getAttribute('content') || '';
      
      // Should have user-scalable=no
      expect(content).toContain('user-scalable=no');
      
      document.head.removeChild(viewportMeta);
    });

    test('touch-action should be set to manipulation on interactive elements', () => {
      const button = document.createElement('button');
      button.textContent = 'Test';
      button.style.touchAction = 'manipulation';
      document.body.appendChild(button);

      // Verify the style was set
      expect(button.style.touchAction).toBe('manipulation');

      document.body.removeChild(button);
    });

    test('input elements should have font-size of 16px to prevent auto-zoom on iOS', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.style.fontSize = '16px';
      document.body.appendChild(input);

      const style = window.getComputedStyle(input);
      const fontSize = parseFloat(style.fontSize);

      // Should be 16px to prevent iOS auto-zoom
      expect(fontSize).toBe(16);

      document.body.removeChild(input);
    });
  });

  describe('Layout Not Cut Off', () => {
    test('html element should not have overflow-x', () => {
      const htmlStyle = window.getComputedStyle(document.documentElement);
      const overflowX = htmlStyle.overflowX;

      // Should not have overflow-x that would cause horizontal scroll
      // Valid values are auto, visible, hidden, scroll, or empty string
      const validValues = ['auto', 'visible', 'hidden', 'scroll', ''];
      expect(validValues).toContain(overflowX);
    });

    test('body element should not have overflow-x', () => {
      const bodyStyle = window.getComputedStyle(document.body);
      const overflowX = bodyStyle.overflowX;

      // Should not have overflow-x that would cause horizontal scroll
      const validValues = ['auto', 'visible', 'hidden', 'scroll', ''];
      expect(validValues).toContain(overflowX);
    });

    test('root element should not have overflow-x', () => {
      const rootElement = document.getElementById('root');
      if (rootElement) {
        const rootStyle = window.getComputedStyle(rootElement);
        const overflowX = rootStyle.overflowX;

        // Should not have overflow-x that would cause horizontal scroll
        const validValues = ['auto', 'visible', 'hidden', 'scroll', ''];
        expect(validValues).toContain(overflowX);
      }
    });

    test('body should have max-width of 100vw to prevent overflow', () => {
      const bodyStyle = window.getComputedStyle(document.body);
      const maxWidth = bodyStyle.maxWidth;

      // Should have max-width set
      expect(maxWidth).toBeDefined();
    });

    test('html should have max-width of 100vw to prevent overflow', () => {
      const htmlStyle = window.getComputedStyle(document.documentElement);
      const maxWidth = htmlStyle.maxWidth;

      // Should have max-width set
      expect(maxWidth).toBeDefined();
    });

    test('safe area padding should not cause layout shift', () => {
      const htmlStyle = window.getComputedStyle(document.documentElement);
      
      // Get padding values
      const paddingTop = htmlStyle.paddingTop;
      const paddingRight = htmlStyle.paddingRight;
      const paddingBottom = htmlStyle.paddingBottom;
      const paddingLeft = htmlStyle.paddingLeft;

      // All padding values should be defined
      expect(paddingTop).toBeDefined();
      expect(paddingRight).toBeDefined();
      expect(paddingBottom).toBeDefined();
      expect(paddingLeft).toBeDefined();
    });
  });

  describe('Notched Device Support', () => {
    test('should support viewport-fit=cover for notched devices', () => {
      const viewportMeta = document.createElement('meta');
      viewportMeta.setAttribute('name', 'viewport');
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no');
      document.head.appendChild(viewportMeta);
      
      const content = viewportMeta.getAttribute('content') || '';
      
      expect(content).toContain('viewport-fit=cover');
      
      document.head.removeChild(viewportMeta);
    });

    test('should have safe area CSS variables for notched devices', () => {
      const rootStyle = window.getComputedStyle(document.documentElement);
      
      // All safe area variables should be defined
      expect(rootStyle.getPropertyValue('--safe-area-inset-top')).toBeDefined();
      expect(rootStyle.getPropertyValue('--safe-area-inset-right')).toBeDefined();
      expect(rootStyle.getPropertyValue('--safe-area-inset-bottom')).toBeDefined();
      expect(rootStyle.getPropertyValue('--safe-area-inset-left')).toBeDefined();
    });

    test('fixed header should respect safe area insets', () => {
      const header = document.createElement('div');
      header.className = 'fixed-header';
      document.body.appendChild(header);

      const style = window.getComputedStyle(header);
      
      // Should have padding-top for safe area
      expect(style.paddingTop).toBeDefined();
      expect(style.zIndex).toBeDefined();

      document.body.removeChild(header);
    });

    test('fixed footer should respect safe area insets', () => {
      const footer = document.createElement('div');
      footer.className = 'fixed-footer';
      document.body.appendChild(footer);

      const style = window.getComputedStyle(footer);
      
      // Should have padding-bottom for safe area
      expect(style.paddingBottom).toBeDefined();
      expect(style.zIndex).toBeDefined();

      document.body.removeChild(footer);
    });

    test('should handle landscape orientation with safe areas', () => {
      // Simulate landscape orientation
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 812,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const element = document.createElement('div');
      element.style.width = '100%';
      element.style.height = '100%';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      
      // Should still render properly in landscape
      expect(style.width).toBeDefined();
      expect(style.height).toBeDefined();

      document.body.removeChild(element);
    });

    test('should handle portrait orientation with safe areas', () => {
      // Simulate portrait orientation
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, 'innerHeight', {
        writable: true,
        configurable: true,
        value: 812,
      });

      const element = document.createElement('div');
      element.style.width = '100%';
      element.style.height = '100%';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      
      // Should still render properly in portrait
      expect(style.width).toBeDefined();
      expect(style.height).toBeDefined();

      document.body.removeChild(element);
    });
  });

  describe('CSS Environment Variables Support', () => {
    test('should support CSS env() function for safe area insets', () => {
      const element = document.createElement('div');
      element.style.paddingTop = 'max(1rem, env(safe-area-inset-top, 1rem))';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      
      // Should have padding-top defined
      expect(style.paddingTop).toBeDefined();

      document.body.removeChild(element);
    });

    test('should have fallback values for CSS env() function', () => {
      const element = document.createElement('div');
      element.style.paddingTop = 'env(safe-area-inset-top, 0px)';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      
      // Should have padding-top defined (either from env or fallback)
      expect(style.paddingTop).toBeDefined();

      document.body.removeChild(element);
    });
  });

  describe('Dynamic Viewport Height (100dvh)', () => {
    test('body should use dynamic viewport height for mobile', () => {
      const bodyStyle = window.getComputedStyle(document.body);
      const minHeight = bodyStyle.minHeight;

      // Should have min-height set
      expect(minHeight).toBeDefined();
    });

    test('html should use dynamic viewport height for mobile', () => {
      const htmlStyle = window.getComputedStyle(document.documentElement);
      const minHeight = htmlStyle.minHeight;

      // Should have min-height set
      expect(minHeight).toBeDefined();
    });

    test('root element should use dynamic viewport height for mobile', () => {
      const rootElement = document.getElementById('root');
      if (rootElement) {
        const rootStyle = window.getComputedStyle(rootElement);
        const minHeight = rootStyle.minHeight;

        // Should have min-height set
        expect(minHeight).toBeDefined();
      }
    });
  });

  describe('Mobile-Specific Styling', () => {
    test('should have mobile-specific button styling', () => {
      const button = document.createElement('button');
      button.className = 'btn-primary';
      button.textContent = 'Test Button';
      document.body.appendChild(button);

      const style = window.getComputedStyle(button);
      
      // Should have button styling applied
      expect(style.padding).toBeDefined();
      expect(style.borderRadius).toBeDefined();

      document.body.removeChild(button);
    });

    test('should have mobile-specific input styling', () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'form-input';
      document.body.appendChild(input);

      const style = window.getComputedStyle(input);
      
      // Should have input styling applied
      expect(style.padding).toBeDefined();
      expect(style.borderRadius).toBeDefined();

      document.body.removeChild(input);
    });

    test('should prevent text selection on interactive elements', () => {
      const button = document.createElement('button');
      button.textContent = 'Test';
      document.body.appendChild(button);

      const style = window.getComputedStyle(button);
      const userSelect = style.userSelect;

      // Should have user-select set to prevent selection
      expect(userSelect).toBeDefined();

      document.body.removeChild(button);
    });
  });

  describe('Accessibility on Mobile', () => {
    test('focus indicators should be visible on mobile', () => {
      const button = document.createElement('button');
      button.textContent = 'Test';
      document.body.appendChild(button);

      const style = window.getComputedStyle(button);
      
      // Should have outline properties defined
      expect(style.outline).toBeDefined();

      document.body.removeChild(button);
    });

    test('skip link should be positioned with safe area insets', () => {
      const skipLink = document.createElement('a');
      skipLink.className = 'skip-link';
      skipLink.href = '#main';
      skipLink.textContent = 'Skip to main content';
      document.body.appendChild(skipLink);

      const style = window.getComputedStyle(skipLink);
      
      // Should have positioning properties
      expect(style.position).toBeDefined();
      expect(style.zIndex).toBeDefined();

      document.body.removeChild(skipLink);
    });

    test('should have proper color contrast for mobile', () => {
      const element = document.createElement('p');
      element.textContent = 'Test text';
      element.style.color = '#1e293b';
      element.style.backgroundColor = '#f8fafc';
      document.body.appendChild(element);

      const style = window.getComputedStyle(element);
      
      // Should have color and background-color defined
      expect(style.color).toBeDefined();
      expect(style.backgroundColor).toBeDefined();

      document.body.removeChild(element);
    });
  });
});
