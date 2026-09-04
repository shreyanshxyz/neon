import { ParsedQuery, FILE_TYPE_SYNONYMS } from './FileIndexer.js';

class QueryParser {
  parse(query: string): ParsedQuery {
    const lowerQuery = query.toLowerCase().trim();

    const result: ParsedQuery = {
      keywords: [],
    };

    const fileTypes = this.extractFileTypes(lowerQuery);
    if (fileTypes.length > 0) {
      result.fileTypes = fileTypes;
    }

    const dateRange = this.extractDateRange(lowerQuery);
    if (dateRange) {
      result.dateRange = dateRange;
    }

    const sizeRange = this.extractSizeRange(lowerQuery);
    if (sizeRange) {
      result.sizeRange = sizeRange;
    }

    const namePattern = this.extractNamePattern(lowerQuery);
    if (namePattern) {
      result.namePattern = namePattern;
    }

    const contentQuery = this.extractContentQuery(lowerQuery);
    if (contentQuery) {
      result.contentQuery = contentQuery;
    }

    result.keywords = this.extractKeywords(lowerQuery, result);

    return result;
  }

  private extractFileTypes(query: string): string[] {
    const types: string[] = [];

    const filePatterns = [
      /(\w+)\s+files?/g,
      /(\w+)\s+documents?/g,
      /(\w+)\s+images?/g,
      /(\w+)\s+photos?/g,
      /(\w+)\s+videos?/g,
      /(\w+)\s+audios?/g,
      /type\s*:\s*(\w+)/g,
      /extension\s*:\s*(\w+)/g,
      /\.?(\w+)\s+only/g,
    ];

    for (const pattern of filePatterns) {
      const matches = query.matchAll(pattern);
      for (const match of matches) {
        const type = match[1].toLowerCase();

        if (FILE_TYPE_SYNONYMS[type]) {
          types.push(...FILE_TYPE_SYNONYMS[type]);
        } else {
          types.push(type);
        }
      }
    }

    return [...new Set(types)];
  }

  private extractDateRange(query: string): { start: string; end: string } | null {
    const now = new Date();

    if (/last\s+(\d+)\s+days?|past\s+(\d+)\s+days?/.test(query)) {
      const match = query.match(/last\s+(\d+)\s+days?|past\s+(\d+)\s+days?/);
      const days = parseInt(match?.[1] || match?.[2] || '7');
      return {
        start: new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString(),
        end: now.toISOString(),
      };
    }

    if (/last\s+week/.test(query)) {
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: now.toISOString(),
      };
    }

    if (/last\s+month/.test(query)) {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 1);
      return { start: start.toISOString(), end: now.toISOString() };
    }

    const yearMatch = query.match(/(?:from|in)\s+(\d{4})/);
    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      return {
        start: new Date(year, 0, 1).toISOString(),
        end: new Date(year, 11, 31, 23, 59, 59).toISOString(),
      };
    }

    if (/today/.test(query)) {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    }

    if (/yesterday/.test(query)) {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { start: start.toISOString(), end: end.toISOString() };
    }

    return null;
  }

  private extractSizeRange(query: string): { min?: number; max?: number } | null {
    const largeMatch = query.match(
      /(?:over|larger than|more than|bigger than)\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i
    );
    if (largeMatch) {
      const size = this.parseSize(largeMatch[1], largeMatch[2]);
      return { min: size };
    }

    const smallMatch = query.match(
      /(?:under|smaller than|less than)\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i
    );
    if (smallMatch) {
      const size = this.parseSize(smallMatch[1], smallMatch[2]);
      return { max: size };
    }

    const aroundMatch = query.match(
      /(?:around|about|approximately)\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i
    );
    if (aroundMatch) {
      const size = this.parseSize(aroundMatch[1], aroundMatch[2]);
      const tolerance = size * 0.2;
      return { min: size - tolerance, max: size + tolerance };
    }

    const betweenMatch = query.match(
      /between\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)\s+and\s+(\d+(?:\.\d+)?)\s*(kb|mb|gb)/i
    );
    if (betweenMatch) {
      return {
        min: this.parseSize(betweenMatch[1], betweenMatch[2]),
        max: this.parseSize(betweenMatch[3], betweenMatch[4]),
      };
    }

    return null;
  }

  private parseSize(value: string, unit: string): number {
    const num = parseFloat(value);
    const unitLower = unit.toLowerCase();

    if (unitLower === 'kb') return num * 1024;
    if (unitLower === 'mb') return num * 1024 * 1024;
    if (unitLower === 'gb') return num * 1024 * 1024 * 1024;
    return num;
  }

  private extractNamePattern(query: string): string | null {
    const patterns = [
      /named\s+([\w\-_.]+)/,
      /called\s+([\w\-_.]+)/,
      /with name\s+([\w\-_.]+)/,
      /name\s*:\s*([\w\-_.]+)/,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractContentQuery(query: string): string | null {
    const patterns = [
      /containing\s+['"](.+?)['"]/,
      /with\s+['"](.+?)['"]/,
      /has\s+['"](.+?)['"]/,
      /including\s+['"](.+?)['"]/,
      /['"](.+?)['"]\s+in content/,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractKeywords(query: string, parsed: ParsedQuery): string[] {
    let remaining = query;

    remaining = remaining.replace(/\w+\s+files?/g, '');
    remaining = remaining.replace(/\w+\s+documents?/g, '');
    remaining = remaining.replace(/type\s*:\s*\w+/g, '');

    remaining = remaining.replace(/last\s+\d+\s+days?/g, '');
    remaining = remaining.replace(/last\s+week/g, '');
    remaining = remaining.replace(/last\s+month/g, '');
    remaining = remaining.replace(/from\s+\d{4}/g, '');
    remaining = remaining.replace(/in\s+\d{4}/g, '');
    remaining = remaining.replace(/today|yesterday/g, '');

    remaining = remaining.replace(
      /(?:over|under|larger than|smaller than|more than|less than|around|about|approximately)\s+\d+(?:\.\d+)?\s*(?:kb|mb|gb)/gi,
      ''
    );
    remaining = remaining.replace(
      /between\s+\d+(?:\.\d+)?\s*(?:kb|mb|gb)\s+and\s+\d+(?:\.\d+)?\s*(?:kb|mb|gb)/gi,
      ''
    );

    remaining = remaining.replace(/named\s+[\w\-_.]+/g, '');
    remaining = remaining.replace(/called\s+[\w\-_.]+/g, '');
    remaining = remaining.replace(/with name\s+[\w\-_.]+/g, '');

    remaining = remaining.replace(/containing\s+['"].+?['"]/g, '');
    remaining = remaining.replace(/with\s+['"].+?['"]/g, '');
    remaining = remaining.replace(/['"].+?['"]\s+in content/g, '');

    const stopWords = new Set([
      'find',
      'search',
      'for',
      'the',
      'a',
      'an',
      'and',
      'or',
      'in',
      'on',
      'at',
      'to',
      'from',
      'by',
      'with',
      'of',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'get',
      'show',
      'me',
      'my',
    ]);

    const words = remaining
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopWords.has(word));

    return [...new Set(words)];
  }

  getSuggestions(partial: string): string[] {
    const suggestions: string[] = [];
    const lower = partial.toLowerCase();

    if (lower.includes('file') || lower.includes('type')) {
      suggestions.push(
        'javascript files',
        'python files',
        'image files',
        'document files',
        'code files'
      );
    }

    if (lower.includes('last') || lower.includes('from')) {
      suggestions.push(
        'from last week',
        'from last month',
        'from today',
        'from yesterday',
        'from 2024'
      );
    }

    if (lower.includes('size') || lower.includes('mb') || lower.includes('kb')) {
      suggestions.push('over 10MB', 'under 1MB', 'larger than 100KB', 'between 1MB and 10MB');
    }

    if (suggestions.length === 0) {
      suggestions.push(
        'javascript files from last week',
        'images larger than 1MB',
        'files containing "TODO"',
        'documents from 2024',
        'code files named main'
      );
    }

    return suggestions;
  }
}

export { QueryParser };
export default QueryParser;
