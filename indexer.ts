import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { InvertedIndex, SearchResult } from "./main";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const INDEX_FILE_PATH = path.join(os.homedir(), ".neon", "search-index.json");
const METADATA_FILE_PATH = path.join(
  os.homedir(),
  ".neon",
  "search-metadata.json"
);
const TEXT_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".js",
  ".ts",
  ".jsx",
  ".tsx",
  ".json",
  ".html",
  ".css",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".h",
  ".hpp",
  ".rs",
  ".go",
  ".php",
  ".rb",
  ".sh",
  ".yml",
  ".yaml",
  ".xml",
  ".csv",
  ".log",
  ".ini",
  ".cfg",
]);

interface IndexMetadata {
  lastIndexed: number;
  fileCount: number;
  totalSize: number;
  rootPaths: string[];
}

export async function walkDir(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);
      if (item.name.startsWith(".") || item.name === "node_modules") {
        continue;
      }
      if (item.isDirectory()) {
        const subFiles = await walkDir(fullPath);
        files.push(...subFiles);
      } else if (item.isFile()) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Cannot read directory: ${dirPath}`, error);
  }
  return files;
}

export function shouldIndex(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

export async function readFileIfText(filePath: string): Promise<string | null> {
  try {
    const stats = await fs.stat(filePath);
    if (stats.size > MAX_FILE_SIZE) {
      return null;
    }
    const content = await fs.readFile(filePath, "utf-8");
    if (content.includes("\0")) {
      return null;
    }
    return content;
  } catch (error) {
    return null;
  }
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token: string) => token.length > 2)
    .filter((token: string) => !Object.prototype.hasOwnProperty(token)) // Skip prototype properties
    .filter(
      (token: string, index: number, arr: string[]) =>
        arr.indexOf(token) === index
    );
}

export async function buildIndex(
  rootPaths: string[],
  onProgress?: (processed: number, total: number) => void,
  onPartialIndex?: (currentIndex: InvertedIndex) => void
): Promise<InvertedIndex> {
  const index: InvertedIndex = {};
  let totalFiles = 0;
  let processedFiles = 0;
  for (const root of rootPaths) {
    try {
      const filePaths = await walkDir(root);
      const indexableFiles = filePaths.filter(shouldIndex);
      totalFiles += indexableFiles.length;
    } catch (error) {
      console.warn(`Failed to count files in ${root}:`, error);
    }
  }
  console.log(
    `Indexing ${totalFiles} files across ${rootPaths.length} directories`
  );

  for (const root of rootPaths) {
    console.log(`Indexing directory: ${root}`);
    let filePaths: string[] = [];
    try {
      filePaths = await walkDir(root);
    } catch (error) {
      console.warn(`Failed to read directory ${root}:`, error);
      continue;
    }
    const batchSize = 20;
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (fp) => {
          if (!shouldIndex(fp)) return;

          try {
            const text = await readFileIfText(fp);
            if (!text) return;
            const tokens = tokenize(text);
            for (const token of tokens) {
              if (!index[token]) {
                index[token] = new Set();
              }
              index[token].add(fp);
            }
          } catch (error) {
            console.warn(`Failed to index file ${fp}:`, error);
          }
          processedFiles++;
          if (onProgress && processedFiles % 100 === 0) {
            onProgress(processedFiles, totalFiles);
            if (onPartialIndex) {
              onPartialIndex(index);
            }
          }
        })
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  console.log(
    `Indexing complete. Processed ${processedFiles} files, created ${
      Object.keys(index).length
    } unique terms.`
  );
  return index;
}

export async function loadIndex(): Promise<InvertedIndex | null> {
  try {
    const data = await fs.readFile(INDEX_FILE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    const index: InvertedIndex = {};
    for (const term of Object.keys(parsed)) {
      if (parsed.hasOwnProperty(term)) {
        index[term] = new Set(parsed[term] as string[]);
      }
    }
    return index;
  } catch (error) {
    return null;
  }
}

export async function loadMetadata(): Promise<IndexMetadata | null> {
  try {
    const data = await fs.readFile(METADATA_FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}

export async function persistMetadata(metadata: IndexMetadata): Promise<void> {
  try {
    const dir = path.dirname(METADATA_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(METADATA_FILE_PATH, JSON.stringify(metadata, null, 2));
  } catch (error) {
    console.error("Failed to persist metadata:", error);
  }
}

export async function persistIndex(
  index: InvertedIndex,
  metadata?: IndexMetadata
): Promise<void> {
  try {
    const dir = path.dirname(INDEX_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    const serializable = Object.fromEntries(
      Object.entries(index).map(([term, paths]) => [term, Array.from(paths)])
    );
    await fs.writeFile(INDEX_FILE_PATH, JSON.stringify(serializable, null, 2));
    if (metadata) {
      await persistMetadata(metadata);
    }
  } catch (error) {
    console.error("Failed to persist index:", error);
  }
}

export async function needsReindex(rootPaths: string[]): Promise<boolean> {
  const metadata = await loadMetadata();
  if (!metadata) return true;
  if (
    metadata.rootPaths.length !== rootPaths.length ||
    !metadata.rootPaths.every((path) => rootPaths.includes(path))
  ) {
    return true;
  }
  const oneDay = 24 * 60 * 60 * 1000;
  if (Date.now() - metadata.lastIndexed > oneDay) {
    return true;
  }
  return false;
}

export async function updateIndex(
  rootPaths: string[],
  onProgress?: (processed: number, total: number) => void,
  onIndexUpdate?: (currentIndex: InvertedIndex) => void
): Promise<InvertedIndex> {
  const existingIndex = (await loadIndex()) || {};
  const metadata = await loadMetadata();
  if (!metadata || (await needsReindex(rootPaths))) {
    console.log("Performing full reindex...");
    const newIndex = await buildIndex(rootPaths, onProgress, onIndexUpdate);
    const newMetadata: IndexMetadata = {
      lastIndexed: Date.now(),
      fileCount: Array.from(
        new Set(Object.values(newIndex).flatMap((paths) => Array.from(paths)))
      ).length,
      totalSize: 0,
      rootPaths,
    };
    await persistIndex(newIndex, newMetadata);
    return newIndex;
  }
  console.log("Performing incremental index update...");
  const updatedIndex = { ...existingIndex };
  let hasChanges = false;
  let processedFiles = 0;
  for (const root of rootPaths) {
    let filePaths: string[] = [];
    try {
      filePaths = await walkDir(root);
    } catch (error) {
      console.warn(`Failed to read directory ${root}:`, error);
      continue;
    }
    for (const filePath of filePaths) {
      if (!shouldIndex(filePath)) continue;
      try {
        const stats = await fs.stat(filePath);
        if (stats.mtime.getTime() > metadata.lastIndexed) {
          const text = await readFileIfText(filePath);
          if (text) {
            for (const [term, paths] of Object.entries(updatedIndex)) {
              paths.delete(filePath);
              if (paths.size === 0) {
                delete updatedIndex[term];
              }
            }
            const tokens = tokenize(text);
            for (const token of tokens) {
              if (!updatedIndex[token]) {
                updatedIndex[token] = new Set();
              }
              updatedIndex[token].add(filePath);
            }
            hasChanges = true;
          }
        }
      } catch (error) {
        continue;
      }
      processedFiles++;
      if (onProgress && processedFiles % 50 === 0) {
        onProgress(processedFiles, filePaths.length);
      }
    }
  }
  if (hasChanges) {
    const updatedMetadata: IndexMetadata = {
      ...metadata,
      lastIndexed: Date.now(),
      fileCount: Array.from(
        new Set(
          Object.values(updatedIndex).flatMap((paths) => Array.from(paths))
        )
      ).length,
    };
    await persistIndex(updatedIndex, updatedMetadata);
  }
  console.log(
    `Incremental update complete. ${
      hasChanges ? "Changes detected and indexed." : "No changes detected."
    }`
  );
  return updatedIndex;
}

export async function searchFiles(
  query: string,
  index: InvertedIndex
): Promise<SearchResult[]> {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];
  const fileScores = new Map<string, number>();
  for (const token of queryTokens) {
    const files = index[token];
    if (!files) continue;
    for (const filePath of files) {
      fileScores.set(filePath, (fileScores.get(filePath) || 0) + 1);
    }
  }
  const results: SearchResult[] = [];
  for (const [filePath, score] of fileScores) {
    if (score >= queryTokens.length) {
      try {
        const stats = await fs.stat(filePath);
        const name = path.basename(filePath);
        const snippet = await getSnippet(filePath, queryTokens);
        results.push({
          path: filePath,
          name,
          snippet,
          mtime: stats.mtime.getTime(),
          size: stats.size,
          score,
        });
      } catch (error) {
        continue;
      }
    }
  }
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

async function getSnippet(
  filePath: string,
  queryTokens: string[]
): Promise<string | undefined> {
  try {
    const content = await readFileIfText(filePath);
    if (!content) return undefined;
    const lines = content.split("\n");
    const lowerQueryTokens = queryTokens.map((t) => t.toLowerCase());
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerQueryTokens.some((token) => lowerLine.includes(token))) {
        return line.trim().substring(0, 100) + (line.length > 100 ? "..." : "");
      }
    }
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        return trimmed.substring(0, 100) + (trimmed.length > 100 ? "..." : "");
      }
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
}
