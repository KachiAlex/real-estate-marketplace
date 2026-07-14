# Viewport Configuration Testing Guide

## Overview

This guide provides comprehensive instructions for testing viewport configuration on PropertyArk mobile app across various device sizes, notched devices, and different orientations.

## Table of Contents

1. [Viewport Configuration Overview](#viewport-configuration-overview)
2. [Device Sizes to Test](#device-sizes-to-test)
3. [Testing on Different Devices](#testing-on-different-devices)
4. [Notched Device Testing](#notched-device-testing)
5. [Zoom Prevention Testing](#zoom-prevention-testing)
6. [Layout Testing](#layout-testing)
7. [Responsive Breakpoints Testing](#responsive-breakpoints-testing)
8. [Troubleshooting Guide](#troubleshooting-guide)

## Viewport Configuration Overview

The PropertyArk app uses the following viewport configuration:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
```

### Key Configuration Elements

- **width=device-width**: Ensures the viewport width matches the device width
- **initial-scale=1**: Sets the initial zoom level to 100%
- **viewport-fit=cover**: Allows content to extend into safe areas (notches, rounded corners)
- **user-scalable=no**: Prevents user zoom to maintain consistent layout

### Safe Area CSS Variables

The app uses CSS variables to handle safe areas on notched devices:

```css
--safe-area-inset-top: 0px;
--safe-area-inset-right: 0px;
--safe-area-inset-bottom: 0px;
--safe-area-inset-left: 0px;
```

These variables are applied to the root HTML element and can be used throughout the app to ensure content doesn't overlap with notches or system UI.

## Device Sizes to Test

### Small Phones (320px - 480px)

- iPhone SE (1st generation): 320x568
- iPhone 5/5S/5C: 320x568
- Samsung Galaxy S5: 360x640
- Moto G4: 360x640

**Testing Focus:**
- Font sizes are readable without zoom
- Touch targets are at least 44x44px
- No horizontal scrolling
- Layout adapts properly

### Medium Phones (481px - 768px)

- iPhone 6/7/8: 375x667
- iPhone X/XS: 375x812
- iPhone 11: 414x896
- Samsung Galaxy S10: 360x800
- Samsung Galaxy S20: 360x800
- Google Pixel 4: 412x869

**Testing Focus:**
- Content is properly centered
- Navigation is accessible
- Images scale appropriately
- Forms are easy to use

### Tablets (769px - 1024px)

- iPad (5th generation): 768x1024
- iPad Air: 768x1024
- iPad Pro 10.5": 834x1112
- Samsung Galaxy Tab S5: 1000x1280

**Testing Focus:**
- Layout adapts to larger screen
- Content is not stretched
- Navigation is optimized for tablet
- Touch targets remain appropriate

### Large Screens (1025px+)

- iPad Pro 12.9": 1024x1366
- Desktop browsers: 1920x1080+

**Testing Focus:**
- Layout is responsive
- Content is properly constrained
- Navigation works on desktop
- No layout issues

## Testing on Different Devices

### Using Chrome DevTools

1. **Open DevTools**: Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
2. **Enable Device Toolbar**: Click the device icon or press `Ctrl+Shift+M`
3. **Select Device**: Choose from the device dropdown or enter custom dimensions
4. **Test Viewport**: Verify the app displays correctly at the selected size

### Using Firefox DevTools

1. **Open DevTools**: Press `F12` or `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Option+I` (Mac)
2. **Enable Responsive Design Mode**: Press `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (Mac)
3. **Select Device**: Choose from the device dropdown or enter custom dimensions
4. **Test Viewport**: Verify the app displays correctly at the selected size

### Using Safari DevTools

1. **Enable Developer Menu**: Preferences → Advanced → Show Develop menu
2. **Open DevTools**: Develop → Show Web Inspector
3. **Enable Responsive Design Mode**: Develop → Enter Responsive Design Mode
4. **Select Device**: Choose from the device dropdown
5. **Test Viewport**: Verify the app displays correctly at the selected size

### Testing on Real Devices

#### iOS Devices

1. **Connect Device**: Connect iPhone/iPad to Mac via USB
2. **Open Safari**: Launch Safari on the device
3. **Navigate to App**: Enter the app URL in the address bar
4. **Test Features**: Interact with the app and verify functionality
5. **Check Layout**: Verify layout is not cut off by notch or home indicator
6. **Test Zoom**: Attempt to pinch-zoom (should be prevented)

#### Android Devices

1. **Connect Device**: Connect Android device to computer via USB
2. **Enable USB Debugging**: Settings → Developer Options → USB Debugging
3. **Open Chrome**: Launch Chrome on the device
4. **Navigate to App**: Enter the app URL in the address bar
5. **Test Features**: Interact with the app and verify functionality
6. **Check Layout**: Verify layout is not cut off by status bar or navigation bar
7. **Test Zoom**: Attempt to pinch-zoom (should be prevented)

## Notched Device Testing

### Devices with Notches

#### iPhone Models with Notch

- iPhone X: 375x812 (notch at top)
- iPhone XS: 375x812 (notch at top)
- iPhone XS Max: 414x896 (notch at top)
- iPhone 11 Pro: 375x812 (notch at top)
- iPhone 11 Pro Max: 414x896 (notch at top)
- iPhone 12: 390x844 (notch at top)
- iPhone 12 Pro: 390x844 (notch at top)
- iPhone 12 Pro Max: 428x926 (notch at top)
- iPhone 13: 390x844 (notch at top)
- iPhone 13 Pro: 390x844 (notch at top)
- iPhone 13 Pro Max: 428x926 (notch at top)
- iPhone 14: 390x844 (notch at top)
- iPhone 14 Pro: 393x852 (dynamic island at top)
- iPhone 14 Pro Max: 430x932 (dynamic island at top)
- iPhone 15: 393x852 (dynamic island at top)
- iPhone 15 Pro: 393x852 (dynamic island at top)
- iPhone 15 Pro Max: 430x932 (dynamic island at top)

#### Android Devices with Notch

- OnePlus 6: 1080x2300 (notch at top)
- OnePlus 7 Pro: 1440x3120 (notch at top)
- Samsung Galaxy S10: 1440x3040 (hole punch at top)
- Samsung Galaxy S20: 1440x3200 (hole punch at top)
- Google Pixel 3 XL: 1440x2960 (notch at top)
- Google Pixel 4: 1080x2280 (notch at top)
- Google Pixel 5: 1080x2340 (notch at top)

### Testing Notched Devices

#### Using Chrome DevTools

1. **Open DevTools**: Press `F12`
2. **Enable Device Toolbar**: Press `Ctrl+Shift+M`
3. **Select Notched Device**: Choose iPhone X or similar from device dropdown
4. **Verify Safe Area**: Check that content is not hidden behind notch
5. **Test Header**: Verify header respects top safe area
6. **Test Footer**: Verify footer respects bottom safe area (home indicator on iPhone)
7. **Test Landscape**: Rotate device and verify layout adapts

#### Testing Checklist for Notched Devices

- [ ] Content is not hidden behind notch
- [ ] Header has proper padding from top
- [ ] Footer has proper padding from bottom (home indicator)
- [ ] Fixed elements respect safe areas
- [ ] Sticky elements respect safe areas
- [ ] Layout adapts in landscape orientation
- [ ] Safe area CSS variables are applied
- [ ] No horizontal scrolling
- [ ] All interactive elements are accessible

### Safe Area CSS Variables on Notched Devices

The app uses CSS environment variables to handle safe areas:

```css
padding-top: max(1rem, env(safe-area-inset-top, 1rem));
padding-right: max(1rem, env(safe-area-inset-right, 1rem));
padding-bottom: max(1rem, env(safe-area-inset-bottom, 1rem));
padding-left: max(1rem, env(safe-area-inset-left, 1rem));
```

These variables are automatically set by the browser on supported devices and ensure content respects safe areas.

## Zoom Prevention Testing

### Testing Zoom Prevention

1. **Verify Meta Tag**: Check that viewport meta tag has `user-scalable=no`
2. **Test Pinch Zoom**: Attempt to pinch-zoom on the app (should be prevented)
3. **Test Double-Tap Zoom**: Attempt to double-tap to zoom (should be prevented)
4. **Test Keyboard Zoom**: Attempt to use keyboard shortcuts to zoom (should be prevented)
5. **Test Input Focus**: Focus on input field (should not auto-zoom on iOS)

### Zoom Prevention Checklist

- [ ] Viewport meta tag has `user-scalable=no`
- [ ] Pinch-zoom is prevented
- [ ] Double-tap zoom is prevented
- [ ] Keyboard zoom shortcuts are prevented
- [ ] Input fields have font-size of 16px (prevents iOS auto-zoom)
- [ ] Touch-action is set to manipulation on interactive elements
- [ ] Layout remains consistent when zoom is attempted

### Troubleshooting Zoom Issues

**Issue**: User can still zoom on the app

**Solution**:
1. Verify viewport meta tag has `user-scalable=no`
2. Check that touch-action is set to manipulation on buttons and links
3. Verify input elements have font-size of 16px
4. Clear browser cache and reload

**Issue**: Input field auto-zooms on iOS

**Solution**:
1. Ensure input elements have font-size of 16px
2. Verify viewport meta tag has `user-scalable=no`
3. Check that input elements have proper padding
4. Test on real iOS device (DevTools may not accurately simulate)

## Layout Testing

### Testing Layout Integrity

1. **No Horizontal Scrolling**: Verify no horizontal scrolling at any viewport size
2. **No Content Cut Off**: Verify no content is hidden or cut off
3. **Proper Spacing**: Verify proper spacing between elements
4. **Responsive Images**: Verify images scale properly
5. **Text Wrapping**: Verify text wraps properly without overflow
6. **Form Elements**: Verify form elements are properly sized and accessible

### Layout Testing Checklist

- [ ] No horizontal scrolling at 320px width
- [ ] No horizontal scrolling at 480px width
- [ ] No horizontal scrolling at 768px width
- [ ] No horizontal scrolling at 1024px width
- [ ] No content is cut off by notch
- [ ] No content is cut off by status bar
- [ ] No content is cut off by navigation bar
- [ ] No content is cut off by home indicator
- [ ] Proper spacing between elements
- [ ] Images scale properly
- [ ] Text wraps properly
- [ ] Form elements are properly sized
- [ ] Touch targets are at least 44x44px
- [ ] No layout shift when safe areas are applied

### Testing Specific Elements

#### Header Testing

- [ ] Header is visible and not cut off
- [ ] Header respects top safe area
- [ ] Header is sticky/fixed and works properly
- [ ] Navigation items are accessible
- [ ] Logo is properly sized
- [ ] Search bar is properly sized

#### Footer Testing

- [ ] Footer is visible and not cut off
- [ ] Footer respects bottom safe area
- [ ] Footer is sticky/fixed and works properly
- [ ] Footer links are accessible
- [ ] Footer text is readable

#### Content Area Testing

- [ ] Content is properly centered
- [ ] Content respects safe areas
- [ ] Content is readable without zoom
- [ ] Images are properly sized
- [ ] Text is properly wrapped
- [ ] Lists are properly formatted

#### Form Testing

- [ ] Form inputs are properly sized (at least 44x44px)
- [ ] Form inputs have proper padding
- [ ] Form inputs have font-size of 16px
- [ ] Form labels are properly positioned
- [ ] Form buttons are properly sized
- [ ] Form validation messages are visible

## Responsive Breakpoints Testing

### Testing Breakpoints

The app uses the following responsive breakpoints:

- **Small phones**: 320px - 480px
- **Medium phones**: 481px - 768px
- **Tablets**: 769px - 1024px
- **Large screens**: 1025px+

### Testing Each Breakpoint

1. **320px Breakpoint**:
   - [ ] Font sizes are readable
   - [ ] Touch targets are at least 44x44px
   - [ ] No horizontal scrolling
   - [ ] Layout is properly adapted

2. **480px Breakpoint**:
   - [ ] Font sizes are readable
   - [ ] Touch targets are at least 44x44px
   - [ ] No horizontal scrolling
   - [ ] Layout is properly adapted

3. **768px Breakpoint**:
   - [ ] Font sizes are readable
   - [ ] Touch targets are at least 44x44px
   - [ ] No horizontal scrolling
   - [ ] Layout is properly adapted

4. **1024px Breakpoint**:
   - [ ] Font sizes are readable
   - [ ] Touch targets are at least 44x44px
   - [ ] No horizontal scrolling
   - [ ] Layout is properly adapted

### Testing Orientation Changes

1. **Portrait to Landscape**:
   - [ ] Layout adapts properly
   - [ ] No content is cut off
   - [ ] Safe areas are respected
   - [ ] No layout shift

2. **Landscape to Portrait**:
   - [ ] Layout adapts properly
   - [ ] No content is cut off
   - [ ] Safe areas are respected
   - [ ] No layout shift

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Content is cut off by notch

**Symptoms**:
- Content is hidden behind notch on iPhone X+
- Header text is not visible
- Navigation items are not accessible

**Solutions**:
1. Verify viewport meta tag has `viewport-fit=cover`
2. Check that safe area CSS variables are applied
3. Verify fixed/sticky elements have proper padding
4. Check CSS for proper use of `env(safe-area-inset-*)`
5. Test on real device (DevTools may not accurately simulate)

**Code Example**:
```css
.fixed-header {
  padding-top: max(0px, env(safe-area-inset-top, 0px));
  padding-left: max(0px, env(safe-area-inset-left, 0px));
  padding-right: max(0px, env(safe-area-inset-right, 0px));
}
```

#### Issue: Horizontal scrolling appears

**Symptoms**:
- Horizontal scrollbar appears at bottom of screen
- Content extends beyond viewport width
- User can scroll horizontally

**Solutions**:
1. Check for elements with fixed width larger than viewport
2. Verify no padding/margin exceeds viewport width
3. Check for images that are too wide
4. Verify CSS max-width is set to 100%
5. Check for overflow-x: auto or overflow-x: scroll

**Code Example**:
```css
html, body {
  max-width: 100vw;
  overflow-x: hidden;
}

img {
  max-width: 100%;
  height: auto;
}
```

#### Issue: User can zoom despite user-scalable=no

**Symptoms**:
- Pinch-zoom works on the app
- Double-tap zoom works on the app
- Layout changes when user zooms

**Solutions**:
1. Verify viewport meta tag has `user-scalable=no`
2. Check that touch-action is set to manipulation
3. Verify input elements have font-size of 16px
4. Clear browser cache
5. Test on real device (DevTools may not accurately simulate)

**Code Example**:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
```

```css
button, a, input {
  touch-action: manipulation;
}

input {
  font-size: 16px;
}
```

#### Issue: Input field auto-zooms on iOS

**Symptoms**:
- When focusing on input field, page zooms in
- Font size appears larger than expected
- Layout shifts when input is focused

**Solutions**:
1. Ensure input elements have font-size of 16px
2. Verify viewport meta tag has `user-scalable=no`
3. Check that input elements have proper padding
4. Test on real iOS device (DevTools may not accurately simulate)

**Code Example**:
```css
input, textarea, select {
  font-size: 16px;
  padding: 0.75rem;
}
```

#### Issue: Safe area CSS variables not working

**Symptoms**:
- Content overlaps with notch
- Safe area padding is not applied
- CSS variables show as 0px

**Solutions**:
1. Verify viewport meta tag has `viewport-fit=cover`
2. Check that CSS uses `env(safe-area-inset-*)`
3. Verify CSS has fallback values
4. Check browser support (older browsers may not support env())
5. Test on real device (DevTools may not accurately simulate)

**Code Example**:
```css
:root {
  --safe-area-inset-top: 0px;
  --safe-area-inset-right: 0px;
  --safe-area-inset-bottom: 0px;
  --safe-area-inset-left: 0px;
}

html {
  padding-top: max(var(--safe-area-inset-top), env(safe-area-inset-top, 0px));
  padding-right: max(var(--safe-area-inset-right), env(safe-area-inset-right, 0px));
  padding-bottom: max(var(--safe-area-inset-bottom), env(safe-area-inset-bottom, 0px));
  padding-left: max(var(--safe-area-inset-left), env(safe-area-inset-left, 0px));
}
```

#### Issue: Touch targets are too small

**Symptoms**:
- Buttons are hard to tap
- Links are hard to tap
- User frequently misses touch targets

**Solutions**:
1. Verify buttons have minimum 44x44px size
2. Check that buttons have proper padding
3. Verify links have minimum 44x44px size
4. Check spacing between touch targets
5. Increase padding on interactive elements

**Code Example**:
```css
button, a, input[type="button"] {
  min-height: 44px;
  min-width: 44px;
  padding: 0.75rem 1.25rem;
}
```

#### Issue: Font sizes are too small on mobile

**Symptoms**:
- Text is hard to read without zoom
- User needs to zoom to read content
- Text appears blurry

**Solutions**:
1. Verify base font size is at least 16px
2. Check heading font sizes
3. Verify line-height is at least 1.5
4. Check for font-size: 12px or smaller
5. Increase font sizes for mobile

**Code Example**:
```css
@media (max-width: 768px) {
  html {
    font-size: 16px;
  }
  
  body {
    font-size: 16px;
    line-height: 1.6;
  }
  
  h1 {
    font-size: 1.75rem;
  }
  
  h2 {
    font-size: 1.5rem;
  }
}
```

### Testing Tools and Resources

#### Browser DevTools

- **Chrome DevTools**: Built-in device emulation
- **Firefox DevTools**: Responsive Design Mode
- **Safari DevTools**: Responsive Design Mode
- **Edge DevTools**: Built-in device emulation

#### Online Testing Tools

- **BrowserStack**: Real device testing
- **Sauce Labs**: Real device testing
- **LambdaTest**: Real device testing
- **Responsively App**: Desktop app for responsive testing

#### Mobile Testing Devices

- **iOS**: iPhone SE, iPhone 11, iPhone 12, iPhone 13, iPhone 14, iPhone 15
- **Android**: Samsung Galaxy S10, S20, S21, Google Pixel 4, 5, 6

### Running Automated Tests

To run the viewport configuration tests:

```bash
npm run frontend:test -- src/styles/viewport.test.ts
```

To run tests in watch mode:

```bash
npm run frontend:test -- src/styles/viewport.test.ts --watch
```

To run tests with coverage:

```bash
npm run frontend:test -- src/styles/viewport.test.ts --coverage
```

## Checklist for Viewport Testing

### Pre-Testing

- [ ] Read this guide completely
- [ ] Understand viewport configuration
- [ ] Understand safe area CSS variables
- [ ] Understand responsive breakpoints
- [ ] Prepare testing devices

### Testing on Different Sizes

- [ ] Test on 320px width (small phone)
- [ ] Test on 480px width (medium phone)
- [ ] Test on 768px width (tablet)
- [ ] Test on 1024px width (large tablet)
- [ ] Test on 1920px width (desktop)

### Testing on Notched Devices

- [ ] Test on iPhone X (notch at top)
- [ ] Test on iPhone 11 Pro (notch at top)
- [ ] Test on iPhone 12 (notch at top)
- [ ] Test on iPhone 14 Pro (dynamic island)
- [ ] Test on Android notched device

### Testing Zoom Prevention

- [ ] Verify viewport meta tag
- [ ] Test pinch-zoom (should be prevented)
- [ ] Test double-tap zoom (should be prevented)
- [ ] Test input focus (should not auto-zoom)

### Testing Layout

- [ ] No horizontal scrolling
- [ ] No content cut off
- [ ] Proper spacing
- [ ] Responsive images
- [ ] Text wrapping
- [ ] Form elements

### Testing Orientation

- [ ] Portrait orientation
- [ ] Landscape orientation
- [ ] Orientation change
- [ ] Safe areas in both orientations

### Post-Testing

- [ ] Document any issues found
- [ ] Create bug reports for issues
- [ ] Fix issues
- [ ] Re-test after fixes
- [ ] Verify all tests pass

## Additional Resources

- [MDN: Viewport Meta Tag](https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag)
- [Apple: Safe Area](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Google: Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
- [W3C: CSS Environment Variables](https://www.w3.org/TR/css-env-1/)
- [CSS Tricks: The Notch and CSS](https://css-tricks.com/the-notch-and-css/)
