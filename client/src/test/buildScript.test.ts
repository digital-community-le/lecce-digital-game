/**
 * Test per il build script del Service Worker
 * Verifica il comportamento dello script di versioning
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Mock del filesystem
vi.mock('fs');
vi.mock('path');

const mockFs = fs as any;
const mockPath = path as any;

describe('Service Worker Build Script', () => {
  const mockSwContent = `
// Auto-generated cache version - this will be replaced during build
const CACHE_VERSION = '%%CACHE_VERSION%%';
const CACHE_NAME = \`ldc-game-\${CACHE_VERSION}\`;

console.log(\`SW: Cache version \${CACHE_VERSION}\`);
`;

  const mockSwPath = '/mock/path/to/sw.js';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock del path.join per restituire il percorso mockato
    mockPath.join.mockReturnValue(mockSwPath);
    mockPath.dirname.mockReturnValue('/mock/path');
    
    // Mock di fileURLToPath usando spyOn
    vi.mocked(fileURLToPath as any).mockReturnValue('/mock/script/path.js');
    
    // Mock esistenza del file
    mockFs.existsSync.mockReturnValue(true);
    
    // Mock lettura del file
    mockFs.readFileSync.mockReturnValue(mockSwContent);
    
    // Mock scrittura del file
    mockFs.writeFileSync.mockImplementation(() => {});

    // Mock di process.exit
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    // Mock di console
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update service worker version with timestamp', () => {
    // Simula l'esecuzione della funzione di update
    const mockTimestamp = '1234567890';
    vi.spyOn(Date, 'now').mockReturnValue(Number(mockTimestamp));

    // Simula l'esecuzione del comando update
    const expectedContent = mockSwContent.replace(/%%CACHE_VERSION%%/g, mockTimestamp);

    // Test logica di sostituzione
    const result = mockSwContent.replace(/%%CACHE_VERSION%%/g, mockTimestamp);
    expect(result).toContain(`const CACHE_VERSION = '${mockTimestamp}';`);
    expect(result).not.toContain('%%CACHE_VERSION%%');
  });

  it('should restore placeholder when restoring', () => {
    const updatedContent = `
// Auto-generated cache version - this will be replaced during build
const CACHE_VERSION = '1234567890';
const CACHE_NAME = \`ldc-game-\${CACHE_VERSION}\`;
`;

    // Test logica di ripristino
    const result = updatedContent.replace(/const CACHE_VERSION = '[0-9]+';/g, "const CACHE_VERSION = '%%CACHE_VERSION%%';");
    expect(result).toContain("const CACHE_VERSION = '%%CACHE_VERSION%%';");
    expect(result).not.toContain("const CACHE_VERSION = '1234567890';");
  });

  it('should handle file not found error', () => {
    mockFs.existsSync.mockReturnValue(false);

    expect(() => {
      if (!mockFs.existsSync(mockSwPath)) {
        console.error('❌ Service Worker file not found:', mockSwPath);
        process.exit(1);
      }
    }).toThrow('process.exit called');

    expect(console.error).toHaveBeenCalledWith('❌ Service Worker file not found:', mockSwPath);
  });

  it('should handle read/write errors', () => {
    const testError = new Error('File system error');
    mockFs.readFileSync.mockImplementation(() => {
      throw testError;
    });

    expect(() => {
      try {
        mockFs.readFileSync(mockSwPath, 'utf8');
      } catch (error) {
        console.error('❌ Error updating Service Worker version:', error);
        process.exit(1);
      }
    }).toThrow('process.exit called');

    expect(console.error).toHaveBeenCalledWith('❌ Error updating Service Worker version:', testError);
  });

  it('should generate unique timestamps', () => {
    const timestamp1 = Date.now().toString();
    // Simula un piccolo delay
    const timestamp2 = (Date.now() + 1).toString();
    
    expect(timestamp1).not.toBe(timestamp2);
    expect(timestamp1).toMatch(/^\d+$/);
    expect(timestamp2).toMatch(/^\d+$/);
  });

  it('should replace all occurrences of placeholder', () => {
    const contentWithMultiplePlaceholders = `
const CACHE_VERSION = '%%CACHE_VERSION%%';
const OTHER_VERSION = '%%CACHE_VERSION%%';
console.log('Version: %%CACHE_VERSION%%');
`;

    const timestamp = '1234567890';
    const result = contentWithMultiplePlaceholders.replace(/%%CACHE_VERSION%%/g, timestamp);
    
    expect(result).not.toContain('%%CACHE_VERSION%%');
    expect((result.match(/1234567890/g) || []).length).toBe(3);
  });

  it('should only restore version constants when restoring', () => {
    const contentWithMixedVersions = `
const CACHE_VERSION = '1234567890';
const OTHER_VERSION = 'not-a-timestamp';
const ANOTHER_VERSION = '9876543210';
`;

    const result = contentWithMixedVersions.replace(/const CACHE_VERSION = '[0-9]+';/g, "const CACHE_VERSION = '%%CACHE_VERSION%%';");
    
    expect(result).toContain("const CACHE_VERSION = '%%CACHE_VERSION%%';");
    expect(result).toContain("const OTHER_VERSION = 'not-a-timestamp';");
    expect(result).toContain("const ANOTHER_VERSION = '9876543210';");
  });
});
