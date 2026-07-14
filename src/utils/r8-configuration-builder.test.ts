/**
 * Unit Tests for R8 Configuration Builder
 *
 * Tests for R8 configuration generation, keep rules, and optimization settings.
 *
 * @module utils/r8-configuration-builder.test
 */

import {
  buildR8Configuration,
  generateR8ConfigurationContent,
  addCustomKeepRule,
  addCustomKeepRules,
  R8Configuration,
} from './r8-configuration-builder';

describe('R8ConfigurationBuilder', () => {
  describe('buildR8Configuration', () => {
    it('should create default R8 configuration with moderate optimization', () => {
      const config = buildR8Configuration();

      expect(config.enabled).toBe(true);
      expect(config.minifyEnabled).toBe(true);
      expect(config.obfuscationEnabled).toBe(true);
      expect(config.optimizationEnabled).toBe(true);
      expect(config.optimizationLevel).toBe('moderate');
      expect(config.keepRules.length).toBeGreaterThan(0);
      expect(config.customRules.length).toBe(0);
    });

    it('should create aggressive R8 configuration', () => {
      const config = buildR8Configuration('aggressive');

      expect(config.enabled).toBe(true);
      expect(config.minifyEnabled).toBe(true);
      expect(config.obfuscationEnabled).toBe(true);
      expect(config.optimizationEnabled).toBe(true);
      expect(config.optimizationLevel).toBe('aggressive');
    });

    it('should create conservative R8 configuration', () => {
      const config = buildR8Configuration('conservative');

      expect(config.enabled).toBe(true);
      expect(config.minifyEnabled).toBe(true);
      expect(config.obfuscationEnabled).toBe(false);
      expect(config.optimizationEnabled).toBe(false);
      expect(config.optimizationLevel).toBe('conservative');
    });

    it('should include base keep rules for public classes', () => {
      const config = buildR8Configuration();

      const hasPublicClassRule = config.keepRules.some((rule) =>
        rule.includes('-keep public class')
      );
      expect(hasPublicClassRule).toBe(true);
    });

    it('should include keep rules for Android framework classes', () => {
      const config = buildR8Configuration();

      const hasAndroidRule = config.keepRules.some((rule) =>
        rule.includes('android.**')
      );
      expect(hasAndroidRule).toBe(true);
    });

    it('should include keep rules for AndroidX classes', () => {
      const config = buildR8Configuration();

      const hasAndroidXRule = config.keepRules.some((rule) =>
        rule.includes('androidx.**')
      );
      expect(hasAndroidXRule).toBe(true);
    });

    it('should include keep rules for native methods', () => {
      const config = buildR8Configuration();

      const hasNativeRule = config.keepRules.some((rule) =>
        rule.includes('native <methods>')
      );
      expect(hasNativeRule).toBe(true);
    });

    it('should include keep rules for enums', () => {
      const config = buildR8Configuration();

      const hasEnumRule = config.keepRules.some((rule) =>
        rule.includes('enum')
      );
      expect(hasEnumRule).toBe(true);
    });

    it('should include keep rules for Parcelable', () => {
      const config = buildR8Configuration();

      const hasParcelableRule = config.keepRules.some((rule) =>
        rule.includes('Parcelable')
      );
      expect(hasParcelableRule).toBe(true);
    });

    it('should include keep rules for Serializable', () => {
      const config = buildR8Configuration();

      const hasSerializableRule = config.keepRules.some((rule) =>
        rule.includes('Serializable')
      );
      expect(hasSerializableRule).toBe(true);
    });

    it('should accept custom keep rules', () => {
      const customRules = ['-keep class com.example.MyClass { *; }'];
      const config = buildR8Configuration('moderate', customRules);

      expect(config.customRules).toEqual(customRules);
    });

    it('should accept multiple custom keep rules', () => {
      const customRules = [
        '-keep class com.example.MyClass { *; }',
        '-keep class com.example.AnotherClass { *; }',
      ];
      const config = buildR8Configuration('moderate', customRules);

      expect(config.customRules).toEqual(customRules);
    });
  });

  describe('generateR8ConfigurationContent', () => {
    it('should generate valid R8 configuration file content', () => {
      const config = buildR8Configuration();
      const content = generateR8ConfigurationContent(config);

      expect(content).toContain('# R8 Configuration');
      expect(content).toContain('# Generated automatically');
      expect(content).toContain('-optimizationpasses');
    });

    it('should include optimization passes for aggressive level', () => {
      const config = buildR8Configuration('aggressive');
      const content = generateR8ConfigurationContent(config);

      expect(content).toContain('-optimizationpasses 5');
    });

    it('should include optimization passes for moderate level', () => {
      const config = buildR8Configuration('moderate');
      const content = generateR8ConfigurationContent(config);

      expect(content).toContain('-optimizationpasses 3');
    });

    it('should include optimization passes for conservative level', () => {
      const config = buildR8Configuration('conservative');
      const content = generateR8ConfigurationContent(config);

      expect(content).toContain('-optimizationpasses 1');
    });

    it('should include all keep rules in content', () => {
      const config = buildR8Configuration();
      const content = generateR8ConfigurationContent(config);

      config.keepRules.forEach((rule) => {
        expect(content).toContain(rule);
      });
    });

    it('should include custom rules in content', () => {
      const customRules = ['-keep class com.example.MyClass { *; }'];
      const config = buildR8Configuration('moderate', customRules);
      const content = generateR8ConfigurationContent(config);

      expect(content).toContain('# Custom keep rules');
      customRules.forEach((rule) => {
        expect(content).toContain(rule);
      });
    });

    it('should include obfuscation directive for aggressive level', () => {
      const config = buildR8Configuration('aggressive');
      const content = generateR8ConfigurationContent(config);

      expect(content).toContain('-obfuscate');
    });

    it('should include no-obfuscation directive for conservative level', () => {
      const config = buildR8Configuration('conservative');
      const content = generateR8ConfigurationContent(config);

      expect(content).toContain('-dontobfuscate');
    });

    it('should include optimization settings for aggressive level', () => {
      const config = buildR8Configuration('aggressive');
      const content = generateR8ConfigurationContent(config);

      expect(content).toContain('-optimizations');
    });

    it('should include no-optimization directive for conservative level', () => {
      const config = buildR8Configuration('conservative');
      const content = generateR8ConfigurationContent(config);

      expect(content).toContain('-dontoptimize');
    });

    it('should have proper line breaks and formatting', () => {
      const config = buildR8Configuration();
      const content = generateR8ConfigurationContent(config);
      const lines = content.split('\n');

      expect(lines.length).toBeGreaterThan(10);
      expect(lines[0]).toContain('# R8 Configuration');
    });
  });

  describe('addCustomKeepRule', () => {
    it('should add a single custom keep rule', () => {
      const config = buildR8Configuration();
      const rule = '-keep class com.example.MyClass { *; }';
      const updated = addCustomKeepRule(config, rule);

      expect(updated.customRules).toContain(rule);
      expect(updated.customRules.length).toBe(1);
    });

    it('should not modify original configuration', () => {
      const config = buildR8Configuration();
      const rule = '-keep class com.example.MyClass { *; }';
      const updated = addCustomKeepRule(config, rule);

      expect(config.customRules.length).toBe(0);
      expect(updated.customRules.length).toBe(1);
    });

    it('should preserve existing custom rules', () => {
      const config = buildR8Configuration('moderate', [
        '-keep class com.example.FirstClass { *; }',
      ]);
      const rule = '-keep class com.example.SecondClass { *; }';
      const updated = addCustomKeepRule(config, rule);

      expect(updated.customRules.length).toBe(2);
      expect(updated.customRules).toContain('-keep class com.example.FirstClass { *; }');
      expect(updated.customRules).toContain(rule);
    });

    it('should preserve all other configuration properties', () => {
      const config = buildR8Configuration('aggressive');
      const rule = '-keep class com.example.MyClass { *; }';
      const updated = addCustomKeepRule(config, rule);

      expect(updated.enabled).toBe(config.enabled);
      expect(updated.minifyEnabled).toBe(config.minifyEnabled);
      expect(updated.obfuscationEnabled).toBe(config.obfuscationEnabled);
      expect(updated.optimizationEnabled).toBe(config.optimizationEnabled);
      expect(updated.optimizationLevel).toBe(config.optimizationLevel);
      expect(updated.keepRules).toEqual(config.keepRules);
    });
  });

  describe('addCustomKeepRules', () => {
    it('should add multiple custom keep rules', () => {
      const config = buildR8Configuration();
      const rules = [
        '-keep class com.example.FirstClass { *; }',
        '-keep class com.example.SecondClass { *; }',
      ];
      const updated = addCustomKeepRules(config, rules);

      expect(updated.customRules).toEqual(rules);
      expect(updated.customRules.length).toBe(2);
    });

    it('should handle empty rules array', () => {
      const config = buildR8Configuration();
      const updated = addCustomKeepRules(config, []);

      expect(updated.customRules.length).toBe(0);
    });

    it('should preserve existing custom rules', () => {
      const config = buildR8Configuration('moderate', [
        '-keep class com.example.ExistingClass { *; }',
      ]);
      const newRules = [
        '-keep class com.example.FirstClass { *; }',
        '-keep class com.example.SecondClass { *; }',
      ];
      const updated = addCustomKeepRules(config, newRules);

      expect(updated.customRules.length).toBe(3);
      expect(updated.customRules).toContain('-keep class com.example.ExistingClass { *; }');
      expect(updated.customRules).toContain('-keep class com.example.FirstClass { *; }');
      expect(updated.customRules).toContain('-keep class com.example.SecondClass { *; }');
    });

    it('should not modify original configuration', () => {
      const config = buildR8Configuration();
      const rules = [
        '-keep class com.example.FirstClass { *; }',
        '-keep class com.example.SecondClass { *; }',
      ];
      const updated = addCustomKeepRules(config, rules);

      expect(config.customRules.length).toBe(0);
      expect(updated.customRules.length).toBe(2);
    });

    it('should preserve all other configuration properties', () => {
      const config = buildR8Configuration('conservative');
      const rules = [
        '-keep class com.example.FirstClass { *; }',
        '-keep class com.example.SecondClass { *; }',
      ];
      const updated = addCustomKeepRules(config, rules);

      expect(updated.enabled).toBe(config.enabled);
      expect(updated.minifyEnabled).toBe(config.minifyEnabled);
      expect(updated.obfuscationEnabled).toBe(config.obfuscationEnabled);
      expect(updated.optimizationEnabled).toBe(config.optimizationEnabled);
      expect(updated.optimizationLevel).toBe(config.optimizationLevel);
      expect(updated.keepRules).toEqual(config.keepRules);
    });
  });

  describe('Configuration consistency', () => {
    it('should maintain consistent state across all optimization levels', () => {
      const levels: Array<'aggressive' | 'moderate' | 'conservative'> = [
        'aggressive',
        'moderate',
        'conservative',
      ];

      levels.forEach((level) => {
        const config = buildR8Configuration(level);

        expect(config.enabled).toBe(true);
        expect(config.minifyEnabled).toBe(true);
        expect(config.optimizationLevel).toBe(level);
        expect(config.keepRules.length).toBeGreaterThan(0);
      });
    });

    it('should generate valid content for all optimization levels', () => {
      const levels: Array<'aggressive' | 'moderate' | 'conservative'> = [
        'aggressive',
        'moderate',
        'conservative',
      ];

      levels.forEach((level) => {
        const config = buildR8Configuration(level);
        const content = generateR8ConfigurationContent(config);

        expect(content).toContain('# R8 Configuration');
        expect(content).toContain('-optimizationpasses');
        expect(content.length).toBeGreaterThan(100);
      });
    });
  });
});
