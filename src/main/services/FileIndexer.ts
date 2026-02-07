import fs from 'fs';
import path from 'path';

interface FileIndex {
  path: string;
  name: string;
  extension: string;
  content: string;
  preview: string;
  modified: Date;
  size: number;
  tokens: string[];
}

interface SearchResult {
  file: FileIndex;
  score: number;
  matches: {
    name?: boolean;
    content?: string[];
    path?: boolean;
  };
}

interface ParsedQuery {
  keywords: string[];
  fileTypes?: string[];
  dateRange?: { start: string; end: string };
  sizeRange?: { min?: number; max?: number };
  namePattern?: string;
  contentQuery?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PREVIEW_LENGTH = 1000;

const FILE_TYPE_SYNONYMS: Record<string, string[]> = {
  javascript: ['js', 'jsx', 'ts', 'tsx'],
  python: ['py', 'pyw'],
  java: ['java'],
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
  document: ['pdf', 'doc', 'docx', 'txt', 'rtf'],
  video: ['mp4', 'avi', 'mkv', 'mov', 'wmv'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg'],
  archive: ['zip', 'tar', 'gz', 'rar', '7z'],
  code: ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'go', 'rs'],
  web: ['html', 'htm', 'css', 'scss'],
  data: ['json', 'xml', 'yaml', 'yml', 'csv'],
};

class FileIndexer {
  private index: Map<string, FileIndex> = new Map();
  private indexingInProgress = false;
  private indexedCount = 0;

  async indexDirectory(dirPath: string): Promise<void> {
    this.index.clear();
    this.indexingInProgress = true;
    this.indexedCount = 0;

    try {
      await this.indexDirectoryRecursive(dirPath);
    } finally {
      this.indexingInProgress = false;
    }
  }

  private async indexDirectoryRecursive(dirPath: string): Promise<void> {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        if (
          !entry.name.startsWith('.') &&
          !['node_modules', 'dist', 'build', '.git'].includes(entry.name)
        ) {
          await this.indexDirectoryRecursive(fullPath);
        }
      } else if (entry.isFile()) {
        await this.indexFile(fullPath);
      }
    }
  }

  async indexFile(filePath: string): Promise<void> {
    try {
      const stats = await fs.promises.stat(filePath);

      if (stats.size > MAX_FILE_SIZE) {
        return;
      }

      const buffer = await fs.promises.readFile(filePath);
      const isBinary = buffer.slice(0, 8000).some((byte) => byte === 0);

      if (isBinary) {
        const fileIndex: FileIndex = {
          path: filePath,
          name: path.basename(filePath),
          extension: path.extname(filePath).toLowerCase().slice(1),
          content: '',
          preview: `[Binary file - ${this.formatFileSize(stats.size)}]`,
          modified: stats.mtime,
          size: stats.size,
          tokens: this.tokenize(path.basename(filePath)),
        };
        this.index.set(filePath, fileIndex);
        this.indexedCount++;
        return;
      }

      const content = buffer.toString('utf-8');
      const preview = content.slice(0, MAX_PREVIEW_LENGTH);

      const fileIndex: FileIndex = {
        path: filePath,
        name: path.basename(filePath),
        extension: path.extname(filePath).toLowerCase().slice(1),
        content: content,
        preview,
        modified: stats.mtime,
        size: stats.size,
        tokens: this.tokenize(content),
      };

      this.index.set(filePath, fileIndex);
      this.indexedCount++;
    } catch (error) {
      console.error(`Failed to index ${filePath}:`, error);
    }
  }

  search(parsedQuery: ParsedQuery): SearchResult[] {
    const results: SearchResult[] = [];

    for (const fileIndex of this.index.values()) {
      const result = this.calculateRelevance(fileIndex, parsedQuery);
      if (result.score > 0) {
        results.push(result);
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private calculateRelevance(file: FileIndex, query: ParsedQuery): SearchResult {
    let score = 0;
    const matches: SearchResult['matches'] = {};

    if (query.fileTypes && query.fileTypes.length > 0) {
      const matchesType = query.fileTypes.some(
        (type) =>
          file.extension === type ||
          file.extension === type.toLowerCase() ||
          this.isFileTypeMatch(file.extension, type)
      );
      if (!matchesType) {
        return { file, score: 0, matches: {} };
      }
      score += 15;
    }

    if (query.dateRange) {
      const startDate = new Date(query.dateRange.start);
      const endDate = new Date(query.dateRange.end);
      if (file.modified < startDate || file.modified > endDate) {
        return { file, score: 0, matches: {} };
      }
    }

    if (query.sizeRange) {
      if (query.sizeRange.min !== undefined && file.size < query.sizeRange.min) {
        return { file, score: 0, matches: {} };
      }
      if (query.sizeRange.max !== undefined && file.size > query.sizeRange.max) {
        return { file, score: 0, matches: {} };
      }
    }

    if (query.namePattern) {
      const nameLower = file.name.toLowerCase();
      const patternLower = query.namePattern.toLowerCase();
      if (!nameLower.includes(patternLower)) {
        return { file, score: 0, matches: {} };
      }
      score += 40;
      matches.name = true;
    }

    if (query.contentQuery) {
      const contentMatches = this.findContentMatches(file.content, query.contentQuery);
      if (contentMatches.length === 0) {
        return { file, score: 0, matches: {} };
      }
      score += 30 + Math.min(20, contentMatches.length * 2);
      matches.content = contentMatches;
    }

    if (query.keywords.length > 0) {
      const nameTokens = this.tokenize(file.name);
      const contentTokens = file.tokens;

      let keywordMatches = 0;
      for (const keyword of query.keywords) {
        const keywordLower = keyword.toLowerCase();

        if (nameTokens.some((token) => token.includes(keywordLower))) {
          score += 25;
          keywordMatches++;
          if (!matches.name) matches.name = true;
        }

        if (contentTokens.some((token) => token.includes(keywordLower))) {
          score += 15;
          keywordMatches++;
        }

        if (file.path.toLowerCase().includes(keywordLower)) {
          score += 10;
          matches.path = true;
        }
      }

      if (keywordMatches === query.keywords.length) {
        score += 20;
      }
    }

    const daysSinceModified = (Date.now() - file.modified.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceModified < 7) {
      score += 10;
    }

    return { file, score, matches };
  }

  private findContentMatches(content: string, query: string): string[] {
    const matches: string[] = [];
    const lines = content.split('\n');
    const queryLower = query.toLowerCase();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.toLowerCase().includes(queryLower)) {
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length, i + 2);
        const context = lines.slice(start, end).join('\n');
        matches.push(context);

        if (matches.length >= 5) break;
      }
    }

    return matches;
  }

  private isFileTypeMatch(extension: string, type: string): boolean {
    const synonyms = FILE_TYPE_SYNONYMS[type.toLowerCase()];
    if (synonyms) {
      return synonyms.includes(extension.toLowerCase());
    }
    return extension.toLowerCase() === type.toLowerCase();
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 1);
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getIndexedCount(): number {
    return this.indexedCount;
  }

  isIndexing(): boolean {
    return this.indexingInProgress;
  }

  clearIndex(): void {
    this.index.clear();
    this.indexedCount = 0;
  }
}

export { FileIndexer, FILE_TYPE_SYNONYMS };
export type { FileIndex, SearchResult, ParsedQuery };
