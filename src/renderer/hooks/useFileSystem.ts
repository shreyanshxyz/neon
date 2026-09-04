import { useState, useEffect, useCallback } from 'react';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size: number;
  modified: Date;
  icon: string;
  extension: string;
  hidden: boolean;
}

interface FileSystemEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSymbolicLink: boolean;
}

interface FileStats {
  size: number;
  modified: Date;
  created: Date;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  permissions: string;
}

interface FileReadResult {
  content: string | null;
  isBinary: boolean;
  size: number;
  error: string | null;
}

interface OperationResult {
  success: boolean;
  trashed?: boolean;
  originalPath?: string;
}

interface ClipboardState {
  operation: 'copy' | 'cut';
  paths: string[];
}

const FILE_EXPLORER_CONFIG = {
  showHiddenByDefault: false,
};

export function useFileSystem(initialPath: string) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);

  const getFileIcon = useCallback((name: string, isDirectory: boolean): string => {
    if (isDirectory) return 'folder';

    const parts = name.split('.');
    const ext = parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : '';
    const iconMap: Record<string, string> = {
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      gif: 'image',
      svg: 'image',
      webp: 'image',
      mp3: 'audio',
      wav: 'audio',
      flac: 'audio',
      aac: 'audio',
      ogg: 'audio',
      mp4: 'video',
      avi: 'video',
      mkv: 'video',
      mov: 'video',
      webm: 'video',
      pdf: 'pdf',
      doc: 'document',
      docx: 'document',
      txt: 'text',
      rtf: 'document',
      zip: 'archive',
      tar: 'archive',
      gz: 'archive',
      sevenz: 'archive',
      rar: 'archive',
      js: 'code',
      ts: 'code',
      jsx: 'code',
      tsx: 'code',
      py: 'code',
      java: 'code',
      cpp: 'code',
      c: 'code',
      h: 'code',
      cs: 'code',
      go: 'code',
      rs: 'code',
      html: 'web',
      css: 'web',
      scss: 'web',
      json: 'data',
      xml: 'data',
      yaml: 'data',
      yml: 'data',
    };

    const key = ext === '7z' ? 'sevenz' : ext;
    return iconMap[key] || 'file';
  }, []);

  const loadDirectory = useCallback(
    async (dirPath: string) => {
      if (!dirPath || dirPath.startsWith('smartfolder://')) {
        if (dirPath.startsWith('smartfolder://')) {
          setFiles([]);
          setLoading(false);
          setError(null);
          setCurrentPath(dirPath);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const entries: FileSystemEntry[] = await window.filesystem.readDir(dirPath);
        const fileItems: FileItem[] = await Promise.all(
          entries.map(async (entry: FileSystemEntry, index: number) => {
            const stats: FileStats = await window.filesystem.getStats(entry.path);
            return {
              id: `${dirPath}-${entry.name}-${index}`,
              name: entry.name,
              type: entry.isDirectory ? 'folder' : 'file',
              path: entry.path,
              size: stats.size,
              modified: stats.modified,
              icon: getFileIcon(entry.name, entry.isDirectory),
              extension: entry.isDirectory
                ? ''
                : (entry.name.split('.').pop()?.toLowerCase() ?? ''),
              hidden: entry.name.startsWith('.'),
            };
          })
        );

        fileItems.sort((a: FileItem, b: FileItem) => {
          if (a.type === 'folder' && b.type !== 'folder') return -1;
          if (a.type !== 'folder' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
        });

        const visibleFiles = FILE_EXPLORER_CONFIG.showHiddenByDefault
          ? fileItems
          : fileItems.filter((f) => !f.hidden);

        setFiles(visibleFiles);
        setCurrentPath(dirPath);
      } catch (err: unknown) {
        const error = err as { message?: string };
        setError(error.message || 'Failed to read directory');
      } finally {
        setLoading(false);
      }
    },
    [getFileIcon]
  );

  const readFileContent = useCallback(async (filePath: string): Promise<FileReadResult> => {
    try {
      const result = await window.filesystem.readFile(filePath);
      return result;
    } catch (err: unknown) {
      const error = err as { message?: string };
      return {
        content: null,
        isBinary: false,
        size: 0,
        error: error.message || 'Failed to read file',
      };
    }
  }, []);

  const writeFileContent = useCallback(
    async (filePath: string, content: string): Promise<OperationResult> => {
      try {
        const result = await window.filesystem.writeFile(filePath, content);
        await refresh();
        return result;
      } catch (err: unknown) {
        const error = err as { message?: string };
        return { success: false };
      }
    },
    []
  );

  const copyFile = useCallback(
    async (source: string, destination: string): Promise<OperationResult> => {
      try {
        const result = await window.filesystem.copy(source, destination);
        await refresh();
        return result;
      } catch (err: unknown) {
        const error = err as { message?: string };
        return { success: false };
      }
    },
    []
  );

  const moveFile = useCallback(
    async (source: string, destination: string): Promise<OperationResult> => {
      try {
        const result = await window.filesystem.move(source, destination);
        await refresh();
        return result;
      } catch (err: unknown) {
        const error = err as { message?: string };
        return { success: false };
      }
    },
    []
  );

  const deleteFile = useCallback(async (filePath: string): Promise<OperationResult> => {
    try {
      const result = await window.filesystem.delete(filePath);
      await refresh();
      return result;
    } catch (err: unknown) {
      const error = err as { message?: string };
      return { success: false };
    }
  }, []);

  const createFolder = useCallback(async (folderPath: string): Promise<OperationResult> => {
    try {
      const result = await window.filesystem.createFolder(folderPath);
      await refresh();
      return result;
    } catch (err: unknown) {
      const error = err as { message?: string };
      return { success: false };
    }
  }, []);

  // Clipboard operations
  const copyToClipboard = useCallback((paths: string[]) => {
    setClipboard({ operation: 'copy', paths });
  }, []);

  const cutToClipboard = useCallback((paths: string[]) => {
    setClipboard({ operation: 'cut', paths });
  }, []);

  const pasteFromClipboard = useCallback(
    async (destinationPath: string): Promise<boolean> => {
      if (!clipboard) return false;

      try {
        for (const sourcePath of clipboard.paths) {
          const fileName = sourcePath.split('/').pop();
          const destPath = `${destinationPath}/${fileName}`;

          if (clipboard.operation === 'copy') {
            await window.filesystem.copy(sourcePath, destPath);
          } else if (clipboard.operation === 'cut') {
            await window.filesystem.move(sourcePath, destPath);
          }
        }

        if (clipboard.operation === 'cut') {
          setClipboard(null);
        }

        await refresh();
        return true;
      } catch (err: unknown) {
        const error = err as { message?: string };
        console.error('Paste failed:', error.message);
        return false;
      }
    },
    [clipboard]
  );

  const clearClipboard = useCallback(() => {
    setClipboard(null);
  }, []);

  const refresh = useCallback(async () => {
    await loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  useEffect(() => {
    if (initialPath) {
      loadDirectory(initialPath);
    }
  }, [initialPath, loadDirectory]);

  return {
    files,
    loading,
    error,
    currentPath,
    clipboard,
    setCurrentPath: loadDirectory,
    refresh,
    readFileContent,
    writeFileContent,
    copyFile,
    moveFile,
    deleteFile,
    createFolder,
    copyToClipboard,
    cutToClipboard,
    pasteFromClipboard,
    clearClipboard,
  };
}
