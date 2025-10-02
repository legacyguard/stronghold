#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'public', 'locales');
const SUPPORTED_LANGUAGES = ['sk', 'cs', 'en'];
const NAMESPACES = ['common', 'landing', 'onboarding', 'dashboard', 'family', 'emergency', 'will-generator', 'legal'];

// Color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadTranslationFile(language, namespace) {
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    log(colors.red, `❌ Error parsing ${filePath}: ${error.message}`);
    return null;
  }
}

function validateJsonStructure(language, namespace, data) {
  const errors = [];
  const warnings = [];

  // Check file size (max 50KB)
  const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
  const stats = fs.statSync(filePath);
  const sizeKB = stats.size / 1024;

  if (sizeKB > 50) {
    warnings.push(`File size ${sizeKB.toFixed(1)}KB exceeds recommended 50KB`);
  }

  // Check key count (50-400 keys)
  const keys = getAllKeys(data);
  if (keys.length < 50) {
    warnings.push(`Only ${keys.length} keys, consider merging with another namespace (recommended: 50-400)`);
  } else if (keys.length > 400) {
    warnings.push(`${keys.length} keys exceeds recommended maximum of 400, consider splitting`);
  }

  // Check for empty values
  keys.forEach(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], data);
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      errors.push(`Empty value for key: ${key}`);
    }
  });

  // Check for placeholder consistency
  keys.forEach(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], data);
    if (typeof value === 'string') {
      const placeholders = value.match(/\{\{[^}]+\}\}/g) || [];
      const invalidPlaceholders = placeholders.filter(p => !/\{\{[a-zA-Z][a-zA-Z0-9_]*\}\}/.test(p));
      if (invalidPlaceholders.length > 0) {
        errors.push(`Invalid placeholders in ${key}: ${invalidPlaceholders.join(', ')}`);
      }
    }
  });

  return { errors, warnings };
}

function validateTranslationConsistency() {
  log(colors.blue, '\n🔍 Validating translation consistency...\n');

  let totalErrors = 0;
  let totalWarnings = 0;

  // Track keys across languages for consistency
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const namespaceKeys = {};

  for (const namespace of NAMESPACES) {
    log(colors.bold, `📁 Namespace: ${namespace}`);

    const languageData = {};
    const languageKeys = {};

    // Load all languages for this namespace
    for (const language of SUPPORTED_LANGUAGES) {
      const data = loadTranslationFile(language, namespace);
      if (data) {
        languageData[language] = data;
        languageKeys[language] = getAllKeys(data);
      } else {
        log(colors.red, `  ❌ Missing file: ${language}/${namespace}.json`);
        totalErrors++;
      }
    }

    // Validate JSON structure for each language
    for (const [language, data] of Object.entries(languageData)) {
      const { errors, warnings } = validateJsonStructure(language, namespace, data);

      if (errors.length > 0) {
        log(colors.red, `  ❌ ${language}: ${errors.length} error(s)`);
        errors.forEach(error => log(colors.red, `     - ${error}`));
        totalErrors += errors.length;
      }

      if (warnings.length > 0) {
        log(colors.yellow, `  ⚠️  ${language}: ${warnings.length} warning(s)`);
        warnings.forEach(warning => log(colors.yellow, `     - ${warning}`));
        totalWarnings += warnings.length;
      }

      if (errors.length === 0 && warnings.length === 0) {
        log(colors.green, `  ✅ ${language}: Valid (${languageKeys[language].length} keys)`);
      }
    }

    // Check key consistency across languages
    if (Object.keys(languageKeys).length > 1) {
      const baseLanguage = SUPPORTED_LANGUAGES.find(lang => languageKeys[lang]);
      if (baseLanguage) {
        const baseKeys = new Set(languageKeys[baseLanguage]);

        for (const [language, keys] of Object.entries(languageKeys)) {
          if (language === baseLanguage) continue;

          const currentKeys = new Set(keys);
          const missingKeys = [...baseKeys].filter(key => !currentKeys.has(key));
          const extraKeys = [...currentKeys].filter(key => !baseKeys.has(key));

          if (missingKeys.length > 0) {
            log(colors.red, `  ❌ ${language}: Missing ${missingKeys.length} key(s)`);
            missingKeys.slice(0, 5).forEach(key => log(colors.red, `     - ${key}`));
            if (missingKeys.length > 5) {
              log(colors.red, `     ... and ${missingKeys.length - 5} more`);
            }
            totalErrors += missingKeys.length;
          }

          if (extraKeys.length > 0) {
            log(colors.yellow, `  ⚠️  ${language}: Extra ${extraKeys.length} key(s)`);
            extraKeys.slice(0, 5).forEach(key => log(colors.yellow, `     - ${key}`));
            if (extraKeys.length > 5) {
              log(colors.yellow, `     ... and ${extraKeys.length - 5} more`);
            }
            totalWarnings += extraKeys.length;
          }
        }
      }
    }

    console.log('');
  }

  // Summary
  log(colors.bold, '📊 Validation Summary:');
  if (totalErrors === 0 && totalWarnings === 0) {
    log(colors.green, '✅ All translations are valid and consistent!');
  } else {
    if (totalErrors > 0) {
      log(colors.red, `❌ ${totalErrors} error(s) found`);
    }
    if (totalWarnings > 0) {
      log(colors.yellow, `⚠️  ${totalWarnings} warning(s) found`);
    }
  }

  return totalErrors === 0;
}

function generateMissingTranslations() {
  log(colors.blue, '\n🔧 Generating missing translation placeholders...\n');

  for (const namespace of NAMESPACES) {
    const baseLanguage = 'sk'; // Use Slovak as base
    const baseData = loadTranslationFile(baseLanguage, namespace);

    if (!baseData) {
      log(colors.yellow, `⚠️  Skipping ${namespace}: No base file found`);
      continue;
    }

    const baseKeys = getAllKeys(baseData);

    for (const language of SUPPORTED_LANGUAGES) {
      if (language === baseLanguage) continue;

      const filePath = path.join(LOCALES_DIR, language, `${namespace}.json`);
      let currentData = loadTranslationFile(language, namespace) || {};

      let modified = false;
      baseKeys.forEach(key => {
        const value = key.split('.').reduce((obj, k) => obj?.[k], currentData);
        if (value === undefined) {
          // Add missing key with placeholder
          const keyParts = key.split('.');
          let current = currentData;

          for (let i = 0; i < keyParts.length - 1; i++) {
            if (!current[keyParts[i]]) {
              current[keyParts[i]] = {};
            }
            current = current[keyParts[i]];
          }

          const baseValue = key.split('.').reduce((obj, k) => obj?.[k], baseData);
          current[keyParts[keyParts.length - 1]] = `[${language.toUpperCase()}] ${baseValue}`;
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(filePath, JSON.stringify(currentData, null, 2) + '\n');
        log(colors.green, `✅ Updated ${language}/${namespace}.json`);
      }
    }
  }
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'validate':
    const isValid = validateTranslationConsistency();
    process.exit(isValid ? 0 : 1);
    break;

  case 'generate':
    generateMissingTranslations();
    break;

  case 'fix':
    generateMissingTranslations();
    const isValidAfterFix = validateTranslationConsistency();
    process.exit(isValidAfterFix ? 0 : 1);
    break;

  default:
    console.log(`
Usage: node validate-translations.js <command>

Commands:
  validate   - Validate translation files for consistency and structure
  generate   - Generate missing translation placeholders
  fix        - Generate missing translations and validate
    `);
    process.exit(1);
}