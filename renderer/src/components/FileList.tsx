import React from "react";

interface FileItem {
  name: string;
  path: string;
  type: "folder" | "file" | "drive";
  size?: number;
  modified?: number;
  isDirectory?: boolean;
}

interface FileItemProps {
  file: FileItem;
  onFileOpen: (filePath: string) => void;
}

interface FileListProps {
  files: FileItem[];
  onFileOpen: (filePath: string) => void;
  selectedFolder: FileItem | null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();

  const iconMap: Record<string, string> = {
    jpg: "🖼️",
    jpeg: "🖼️",
    png: "🖼️",
    gif: "🖼️",
    svg: "🖼️",
    webp: "🖼️",
    pdf: "📄",
    doc: "📄",
    docx: "📄",
    txt: "📄",
    md: "📄",
    js: "📜",
    jsx: "📜",
    ts: "📜",
    tsx: "📜",
    py: "📜",
    html: "📜",
    css: "📜",
    json: "📜",
    zip: "📦",
    rar: "📦",
    tar: "📦",
    gz: "📦",
    "7z": "📦",
    mp3: "🎵",
    wav: "🎵",
    mp4: "🎥",
    avi: "🎥",
    mov: "🎥",
    exe: "⚙️",
    dmg: "⚙️",
    app: "⚙️",
  };

  return iconMap[ext || ""] || "📄";
}

function FileItem({ file, onFileOpen }: FileItemProps): JSX.Element {
  const handleDoubleClick = (): void => {
    if (file.type === "file") {
      onFileOpen(file.path);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" || e.key === " ") {
      handleDoubleClick();
    }
  };

  return (
    <div
      className="file-item"
      onDoubleClick={handleDoubleClick}
      onKeyPress={handleKeyPress}
      tabIndex={0}
      role="button"
      aria-label={`Open ${file.name}`}
    >
      <div className="file-icon">
        {file.isDirectory ? "📁" : getFileIcon(file.name)}
      </div>

      <div className="file-info">
        <div className="file-name" title={file.name}>
          {file.name}
        </div>
        <div className="file-details">
          {!file.isDirectory && (
            <span className="file-size">{formatFileSize(file.size!)}</span>
          )}
          <span className="file-date">{formatDate(file.modified!)}</span>
        </div>
      </div>
    </div>
  );
}

function FileList({
  files,
  onFileOpen,
  selectedFolder,
}: FileListProps): JSX.Element {
  if (!selectedFolder) {
    return (
      <div className="file-list-empty">
        <div className="empty-state">
          <span className="empty-icon">📂</span>
          <p>Select a folder to view its contents</p>
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="file-list-empty">
        <div className="empty-state">
          <span className="empty-icon">📭</span>
          <p>This folder is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="file-list">
      <div className="file-list-header">
        <h3>{selectedFolder.name}</h3>
        <span className="file-count">{files.length} items</span>
      </div>

      <div className="file-grid">
        {files.map((file, index) => (
          <FileItem
            key={`${file.path}-${index}`}
            file={file}
            onFileOpen={onFileOpen}
          />
        ))}
      </div>
    </div>
  );
}

export default FileList;
