import * as fs from 'fs';
import * as path from 'path';

/**
 * Represents an environment variable definition
 */
export interface EnvironmentVariableDefinition {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  required: boolean;
  example: string;
  defaultValue?: string;
  source?: string; // File where it's defined
}

/**
 * Extracts environment variable definitions from code
 * @param sourceDir - Directory to scan
 * @returns Array of environment variable definitions
 */
export function extractEnvironmentVariableDefinitions(sourceDir?: string): {
  success: boolean;
  variables?: EnvironmentVariableDefinition[];
  error?: string;
} {
  try {
    const resolvedDir = sourceDir || path.join(process.cwd(), 'src');

    if (!fs.existsSync(resolvedDir)) {
      return {
        success: false,
        error: `Source directory not found: ${resolvedDir}`,
      };
    }

    const variables: EnvironmentVariableDefinition[] = [];
    const processedVariables = new Set<string>();

    // Scan files for environment variable usage
    const scanDirectory = (dir: string) => {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        // Skip node_modules and other common directories
        if (file === 'node_modules' || file === '.git' || file === 'dist' || file === 'build') {
          continue;
        }

        if (stat.isDirectory()) {
          scanDirectory(filePath);
        } else if (
          file.endsWith('.ts') ||
          file.endsWith('.tsx') ||
          file.endsWith('.js') ||
          file.endsWith('.jsx')
        ) {
          try {
            const content = fs.readFileSync(filePath, 'utf-8');

            // Look for process.env.VARIABLE_NAME patterns
            const envPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
            let match;

            while ((match = envPattern.exec(content)) !== null) {
              const varName = match[1];

              if (!processedVariables.has(varName)) {
                processedVariables.add(varName);

                // Try to find JSDoc comments or inline documentation
                const lines = content.split('\n');
                const matchIndex = content.indexOf(match[0]);
                const lineNum = content.substring(0, matchIndex).split('\n').length - 1;

                let description = '';
                let example = '';
                let type: EnvironmentVariableDefinition['type'] = 'string';

                // Look for comments above the usage
                if (lineNum > 0) {
                  const prevLine = lines[lineNum - 1];
                  if (prevLine.includes('//')) {
                    description = prevLine.replace(/\/\/\s*/, '').trim();
                  }
                }

                // Infer type from usage
                if (content.includes(`parseInt(process.env.${varName})`)) {
                  type = 'number';
                } else if (content.includes(`JSON.parse(process.env.${varName})`)) {
                  type = 'json';
                } else if (
                  content.includes(`process.env.${varName} === 'true'`) ||
                  content.includes(`process.env.${varName} === 'false'`)
                ) {
                  type = 'boolean';
                }

                variables.push({
                  name: varName,
                  description: description || `Environment variable: ${varName}`,
                  type,
                  required: true,
                  example: getExampleValue(varName, type),
                  source: path.relative(process.cwd(), filePath),
                });
              }
            }
          } catch {
            // Skip files that can't be read
          }
        }
      }
    };

    scanDirectory(resolvedDir);

    // Add common mobile development variables if not already found
    const commonVariables = [
      {
        name: 'API_ENDPOINT',
        description: 'Base URL for API requests',
        type: 'string' as const,
        required: true,
        example: 'https://api.example.com',
      },
      {
        name: 'API_KEY',
        description: 'API authentication key',
        type: 'string' as const,
        required: true,
        example: 'your_api_key_here',
      },
      {
        name: 'FIREBASE_CONFIG',
        description: 'Firebase configuration JSON',
        type: 'json' as const,
        required: true,
        example: '{"apiKey":"...","projectId":"..."}',
      },
      {
        name: 'ANALYTICS_TOKEN',
        description: 'Analytics service token',
        type: 'string' as const,
        required: false,
        example: 'your_analytics_token',
      },
    ];

    for (const commonVar of commonVariables) {
      if (!processedVariables.has(commonVar.name)) {
        variables.push(commonVar);
      }
    }

    return {
      success: true,
      variables: variables.sort((a, b) => a.name.localeCompare(b.name)),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to extract environment variable definitions: ${errorMessage}`,
    };
  }
}

/**
 * Gets an example value for an environment variable based on its type
 * @param varName - Variable name
 * @param type - Variable type
 * @returns Example value
 */
function getExampleValue(varName: string, type: EnvironmentVariableDefinition['type']): string {
  const examples: Record<string, string> = {
    API_ENDPOINT: 'https://api.example.com',
    API_KEY: 'sk_live_1234567890abcdef',
    FIREBASE_CONFIG: '{"apiKey":"...","projectId":"..."}',
    ANALYTICS_TOKEN: 'UA-123456789-1',
    DATABASE_URL: 'postgresql://user:password@localhost:5432/dbname',
    JWT_SECRET: 'your_jwt_secret_key',
    STRIPE_KEY: 'sk_test_1234567890abcdef',
  };

  if (examples[varName]) {
    return examples[varName];
  }

  switch (type) {
    case 'number':
      return '42';
    case 'boolean':
      return 'true';
    case 'json':
      return '{}';
    default:
      return 'your_value_here';
  }
}

/**
 * Generates environment variable reference documentation
 * @param variables - Environment variable definitions
 * @returns Markdown documentation
 */
export function generateEnvironmentVariableDocumentation(
  variables: EnvironmentVariableDefinition[]
): string {
  const sections: string[] = [
    '# Environment Variables Reference',
    '',
    'This document describes all environment variables used by the mobile application.',
    '',
    '## Overview',
    '',
    `Total variables: ${variables.length}`,
    `Required variables: ${variables.filter((v) => v.required).length}`,
    `Optional variables: ${variables.filter((v) => !v.required).length}`,
    '',
    '## Variables',
    '',
  ];

  // Group variables by type
  const byType = new Map<string, EnvironmentVariableDefinition[]>();
  for (const variable of variables) {
    if (!byType.has(variable.type)) {
      byType.set(variable.type, []);
    }
    byType.get(variable.type)!.push(variable);
  }

  // Generate documentation for each type
  for (const [type, vars] of byType) {
    sections.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)} Variables`);
    sections.push('');

    for (const variable of vars) {
      sections.push(`#### \`${variable.name}\``);
      sections.push('');
      sections.push(`**Description:** ${variable.description}`);
      sections.push('');
      sections.push(`**Type:** \`${variable.type}\``);
      sections.push('');
      sections.push(`**Required:** ${variable.required ? 'Yes' : 'No'}`);
      sections.push('');
      sections.push(`**Example:**`);
      sections.push('```');
      sections.push(`${variable.name}=${variable.example}`);
      sections.push('```');
      sections.push('');

      if (variable.defaultValue) {
        sections.push(`**Default Value:** \`${variable.defaultValue}\``);
        sections.push('');
      }

      if (variable.source) {
        sections.push(`**Source:** \`${variable.source}\``);
        sections.push('');
      }
    }
  }

  // Add setup instructions
  sections.push('## Setup Instructions');
  sections.push('');
  sections.push('### Local Development');
  sections.push('');
  sections.push('1. Create a `.env.local` file in the project root');
  sections.push('2. Add all required environment variables');
  sections.push('3. Do not commit `.env.local` to version control');
  sections.push('');
  sections.push('Example `.env.local`:');
  sections.push('```');

  for (const variable of variables.filter((v) => v.required)) {
    sections.push(`${variable.name}=${variable.example}`);
  }

  sections.push('```');
  sections.push('');

  // Add EAS setup instructions
  sections.push('### EAS Cloud Builds');
  sections.push('');
  sections.push('For cloud builds via EAS, set environment variables in `eas.json`:');
  sections.push('');
  sections.push('```json');
  sections.push('{');
  sections.push('  "build": {');
  sections.push('    "development": {');
  sections.push('      "env": {');

  const requiredVars = variables.filter((v) => v.required);
  for (let i = 0; i < requiredVars.length; i++) {
    const variable = requiredVars[i];
    const comma = i < requiredVars.length - 1 ? ',' : '';
    sections.push(`        "${variable.name}": "${variable.example}"${comma}`);
  }

  sections.push('      }');
  sections.push('    }');
  sections.push('  }');
  sections.push('}');
  sections.push('```');
  sections.push('');

  // Add security best practices
  sections.push('## Security Best Practices');
  sections.push('');
  sections.push('1. **Never commit secrets to version control**');
  sections.push('   - Use `.env.local` for local development (add to `.gitignore`)');
  sections.push('   - Use EAS secrets for cloud builds');
  sections.push('');
  sections.push('2. **Rotate sensitive credentials regularly**');
  sections.push('   - API keys should be rotated every 90 days');
  sections.push('   - Update all environments when rotating');
  sections.push('');
  sections.push('3. **Use environment-specific values**');
  sections.push('   - Development: Use test/sandbox credentials');
  sections.push('   - Production: Use production credentials with restricted permissions');
  sections.push('');
  sections.push('4. **Validate environment variables at startup**');
  sections.push('   - Ensure all required variables are present');
  sections.push('   - Fail fast with clear error messages');
  sections.push('');

  return sections.join('\n');
}

/**
 * Generates environment variable example file
 * @param variables - Environment variable definitions
 * @returns .env.example file content
 */
export function generateEnvironmentExampleFile(variables: EnvironmentVariableDefinition[]): string {
  const lines: string[] = [
    '# Environment Variables Example',
    '# Copy this file to .env.local and fill in your values',
    '# Do not commit .env.local to version control',
    '',
  ];

  // Group by required/optional
  const required = variables.filter((v) => v.required);
  const optional = variables.filter((v) => !v.required);

  if (required.length > 0) {
    lines.push('# Required Variables');
    for (const variable of required) {
      lines.push(`# ${variable.description}`);
      lines.push(`${variable.name}=${variable.example}`);
      lines.push('');
    }
  }

  if (optional.length > 0) {
    lines.push('# Optional Variables');
    for (const variable of optional) {
      lines.push(`# ${variable.description}`);
      lines.push(`# ${variable.name}=${variable.example}`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Comprehensive environment variable documentation generation
 * @param sourceDir - Directory to scan
 * @param outputDir - Directory to save documentation
 * @returns Generation result
 */
export function generateEnvironmentDocumentation(sourceDir?: string, outputDir?: string): {
  success: boolean;
  files?: string[];
  error?: string;
} {
  try {
    // Extract variable definitions
    const extractResult = extractEnvironmentVariableDefinitions(sourceDir);
    if (!extractResult.success) {
      return {
        success: false,
        error: extractResult.error,
      };
    }

    const variables = extractResult.variables || [];
    const resolvedOutputDir = outputDir || path.join(process.cwd(), 'docs');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(resolvedOutputDir)) {
      fs.mkdirSync(resolvedOutputDir, { recursive: true });
    }

    const files: string[] = [];

    // Generate and save documentation
    const documentation = generateEnvironmentVariableDocumentation(variables);
    const docPath = path.join(resolvedOutputDir, 'ENVIRONMENT_VARIABLES.md');
    fs.writeFileSync(docPath, documentation, 'utf-8');
    files.push(docPath);

    // Generate and save example file
    const exampleContent = generateEnvironmentExampleFile(variables);
    const examplePath = path.join(process.cwd(), '.env.example');
    fs.writeFileSync(examplePath, exampleContent, 'utf-8');
    files.push(examplePath);

    return {
      success: true,
      files,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Failed to generate environment documentation: ${errorMessage}`,
    };
  }
}
