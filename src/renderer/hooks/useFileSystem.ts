import { useState, useEffect, useCallback } from "react";

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
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

export function useFileSystem(initialPath: string) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(initialPath);

  const getFileIcon = useCallback((name: string, isDirectory: boolean): string => {
    if (isDirectory) return "folder";

    const parts = name.split(".");
    const ext = parts.length > 1 ? parts.pop()?.toLowerCase() ?? "" : "";
    const iconMap: Record<string, string> = {
      jpg: "image",
      jpeg: "image",
      png: "image",
      gif: "image",
      svg: "image",
      webp: "image",
      mp3: "audio",
      wav: "audio",
      flac: "audio",
      aac: "audio",
      ogg: "audio",
      mp4: "video",
      avi: "video",
      mkv: "video",
      mov: "video",
      webm: "video",
      pdf: "pdf",
      doc: "document",
      docx: "document",
      txt: "text",
      rtf: "document",
      zip: "archive",
      tar: "archive",
      gz: "archive",
      sevenz: "archive",
      rar: "archive",
      js: "code",
      ts: "code",
      jsx: "code",
      tsx: "code",
      py: "code",
      java: "code",
      cpp: "code",
      c: "code",
      h: "code",
      cs: "code",
      go: "code",
      rs: "code",
      html: "web",
      css: "web",
      scss: "web",
      json: "data",
      xml: "data",
      yaml: "data",
      yml: "data",
    };

    const key = ext === "7z" ? "sevenz" : ext;
    return iconMap[key] || "file";
  }, []);

  const loadDirectory = useCallback(
    async (dirPath: string) => {
      setLoading(true);
      setError(null);

      try {
        const entries: FileSystemEntry[] = await window.filesystem.readDir(dirPath);
        const fileItems: FileItem[] = entries.map((entry: FileSystemEntry, index: number) => ({
          id: `${dirPath}-${entry.name}-${index}`,
          name: entry.name,
          type: entry.isDirectory ? "folder" : "file",
          path: entry.path,
          size: 0,
          modified: new Date(),
          icon: getFileIcon(entry.name, entry.isDirectory),
          extension: entry.isDirectory ? "" : (entry.name.split(".").pop()?.toLowerCase() ?? ""),
          hidden: entry.name.startsWith("."),
        }));

        fileItems.sort((a: FileItem, b: FileItem) => {
          if (a.type === "folder" && b.type !== "folder") return -1;
          if (a.type !== "folder" && b.type === "folder") return 1;
          return a.name.localeCompare(b.name);
        });

        setFiles(fileItems);
        setCurrentPath(dirPath);
      } catch (err: unknown) {
        const error = err as { message?: string };
        setError(error.message || "Failed to read directory");
      } finally {
        setLoading(false);
      }
    },
    [getFileIcon]
  );

  useEffect(() => {
    loadDirectory(initialPath);
  }, [initialPath, loadDirectory]);

  return {
    files,
    loading,
    error,
    currentPath,
    setCurrentPath: loadDirectory,
    refresh: () => loadDirectory(currentPath),
  };
}
