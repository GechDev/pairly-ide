import { SUPPORTED_LANGUAGES, type SupportedLanguage } from '@pairly/contracts';

export interface LanguageDefinition {
  id: SupportedLanguage;
  name: string;
  pistonLanguage: string;
  version: string;
  extension: string;
  defaultFilename: string;
  aliases: string[];
  compiled: boolean;
}

/**
 * 23 Programming Languages Supported in Sandboxed Runner.
 * Conforms to SRS FR-EXEC-01 (target at least 20 languages).
 */
export const LANGUAGE_REGISTRY: Record<SupportedLanguage, LanguageDefinition> = {
  python: {
    id: 'python',
    name: 'Python 3',
    pistonLanguage: 'python',
    version: '3.10.0',
    extension: '.py',
    defaultFilename: 'main.py',
    aliases: ['py', 'python3'],
    compiled: false,
  },
  javascript: {
    id: 'javascript',
    name: 'JavaScript (Node.js)',
    pistonLanguage: 'javascript',
    version: '18.15.0',
    extension: '.js',
    defaultFilename: 'index.js',
    aliases: ['js', 'node'],
    compiled: false,
  },
  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    pistonLanguage: 'typescript',
    version: '5.0.3',
    extension: '.ts',
    defaultFilename: 'index.ts',
    aliases: ['ts'],
    compiled: true,
  },
  go: {
    id: 'go',
    name: 'Go',
    pistonLanguage: 'go',
    version: '1.20.2',
    extension: '.go',
    defaultFilename: 'main.go',
    aliases: ['golang'],
    compiled: true,
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    pistonLanguage: 'rust',
    version: '1.68.2',
    extension: '.rs',
    defaultFilename: 'main.rs',
    aliases: ['rs'],
    compiled: true,
  },
  cpp: {
    id: 'cpp',
    name: 'C++',
    pistonLanguage: 'cpp',
    version: '10.2.0',
    extension: '.cpp',
    defaultFilename: 'main.cpp',
    aliases: ['c++', 'cc', 'cxx'],
    compiled: true,
  },
  c: {
    id: 'c',
    name: 'C',
    pistonLanguage: 'c',
    version: '10.2.0',
    extension: '.c',
    defaultFilename: 'main.c',
    aliases: [],
    compiled: true,
  },
  java: {
    id: 'java',
    name: 'Java',
    pistonLanguage: 'java',
    version: '15.0.2',
    extension: '.java',
    defaultFilename: 'Main.java',
    aliases: [],
    compiled: true,
  },
  csharp: {
    id: 'csharp',
    name: 'C# (.NET)',
    pistonLanguage: 'csharp.net',
    version: '7.0.400',
    extension: '.cs',
    defaultFilename: 'Program.cs',
    aliases: ['cs', 'dotnet'],
    compiled: true,
  },
  ruby: {
    id: 'ruby',
    name: 'Ruby',
    pistonLanguage: 'ruby',
    version: '3.2.2',
    extension: '.rb',
    defaultFilename: 'main.rb',
    aliases: ['rb'],
    compiled: false,
  },
  php: {
    id: 'php',
    name: 'PHP',
    pistonLanguage: 'php',
    version: '8.2.3',
    extension: '.php',
    defaultFilename: 'index.php',
    aliases: [],
    compiled: false,
  },
  swift: {
    id: 'swift',
    name: 'Swift',
    pistonLanguage: 'swift',
    version: '5.8.0',
    extension: '.swift',
    defaultFilename: 'main.swift',
    aliases: [],
    compiled: true,
  },
  kotlin: {
    id: 'kotlin',
    name: 'Kotlin',
    pistonLanguage: 'kotlin',
    version: '1.8.20',
    extension: '.kt',
    defaultFilename: 'main.kt',
    aliases: ['kt'],
    compiled: true,
  },
  bash: {
    id: 'bash',
    name: 'Bash Shell',
    pistonLanguage: 'bash',
    version: '5.2.0',
    extension: '.sh',
    defaultFilename: 'script.sh',
    aliases: ['sh', 'shell'],
    compiled: false,
  },
  sql: {
    id: 'sql',
    name: 'SQLite / SQL',
    pistonLanguage: 'sqlite3',
    version: '3.36.0',
    extension: '.sql',
    defaultFilename: 'script.sql',
    aliases: ['sqlite'],
    compiled: false,
  },
  perl: {
    id: 'perl',
    name: 'Perl',
    pistonLanguage: 'perl',
    version: '5.36.0',
    extension: '.pl',
    defaultFilename: 'main.pl',
    aliases: ['pl'],
    compiled: false,
  },
  r: {
    id: 'r',
    name: 'R Language',
    pistonLanguage: 'rscript',
    version: '4.1.1',
    extension: '.r',
    defaultFilename: 'main.r',
    aliases: ['rscript'],
    compiled: false,
  },
  scala: {
    id: 'scala',
    name: 'Scala',
    pistonLanguage: 'scala',
    version: '3.2.2',
    extension: '.scala',
    defaultFilename: 'Main.scala',
    aliases: [],
    compiled: true,
  },
  dart: {
    id: 'dart',
    name: 'Dart',
    pistonLanguage: 'dart',
    version: '2.19.6',
    extension: '.dart',
    defaultFilename: 'main.dart',
    aliases: [],
    compiled: false,
  },
  elixir: {
    id: 'elixir',
    name: 'Elixir',
    pistonLanguage: 'elixir',
    version: '1.14.2',
    extension: '.ex',
    defaultFilename: 'main.ex',
    aliases: ['ex', 'exs'],
    compiled: false,
  },
  lua: {
    id: 'lua',
    name: 'Lua',
    pistonLanguage: 'lua',
    version: '5.4.4',
    extension: '.lua',
    defaultFilename: 'main.lua',
    aliases: [],
    compiled: false,
  },
  zig: {
    id: 'zig',
    name: 'Zig',
    pistonLanguage: 'zig',
    version: '0.10.1',
    extension: '.zig',
    defaultFilename: 'main.zig',
    aliases: [],
    compiled: true,
  },
  haskell: {
    id: 'haskell',
    name: 'Haskell',
    pistonLanguage: 'haskell',
    version: '9.0.1',
    extension: '.hs',
    defaultFilename: 'main.hs',
    aliases: ['hs'],
    compiled: true,
  },
};

/**
 * Detects the language ID from a filename or extension.
 */
export function detectLanguageFromFilename(filename: string): SupportedLanguage {
  const lower = filename.toLowerCase();
  for (const def of Object.values(LANGUAGE_REGISTRY)) {
    if (lower.endsWith(def.extension)) {
      return def.id;
    }
  }

  // Check aliases
  const ext = lower.split('.').pop();
  if (ext) {
    for (const def of Object.values(LANGUAGE_REGISTRY)) {
      if (def.aliases.includes(ext)) {
        return def.id;
      }
    }
  }

  return 'javascript';
}

/**
 * Retrieves the full language definition by ID or alias.
 */
export function getLanguageDefinition(
  identifier: string
): LanguageDefinition | undefined {
  const normalized = identifier.toLowerCase().trim();

  // Direct match
  if (normalized in LANGUAGE_REGISTRY) {
    return LANGUAGE_REGISTRY[normalized as SupportedLanguage];
  }

  // Alias match
  return Object.values(LANGUAGE_REGISTRY).find((def) =>
    def.aliases.includes(normalized)
  );
}
