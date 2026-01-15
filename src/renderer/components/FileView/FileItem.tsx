import { Folder, FileArchive, FileText, Image, Music, Video, File, FileCode, FileJson, FileType, Globe } from "lucide-react";
import { FileItem as FileItemType } from "../../hooks/useFileSystem";
import { clsx } from "clsx";

interface FileItemProps {
  file: FileItemType;
  selected?: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
}

const getIcon = (file: FileItemType) => {
  if (file.type === "folder") return <Folder className="w-5 h-5 text-blue-400" />;

  const iconColor = "text-text-secondary";
  switch (file.icon) {
    case "archive":
      return <FileArchive className="w-5 h-5 text-amber-400" />;
    case "text":
      return <FileText className={`w-5 h-5 ${iconColor}`} />;
    case "image":
      return <Image className="w-5 h-5 text-purple-400" />;
    case "audio":
      return <Music className="w-5 h-5 text-pink-400" />;
    case "video":
      return <Video className="w-5 h-5 text-red-400" />;
    case "code":
      return <FileCode className="w-5 h-5 text-cyan-400" />;
    case "web":
      return <Globe className="w-5 h-5 text-green-400" />;
    case "data":
      return <FileJson className="w-5 h-5 text-orange-400" />;
    case "document":
      return <FileType className="w-5 h-5 text-blue-300" />;
    case "pdf":
      return <FileText className="w-5 h-5 text-red-500" />;
    default:
      return <File className={`w-5 h-5 ${iconColor}`} />;
  }
};

const formatSize = (bytes: number): string => {
  if (bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default function FileItem({ file, selected, onClick, onDoubleClick }: FileItemProps) {
  return (
    <div
      className={clsx(
        "flex items-center px-4 py-2 border-b border-border/50 cursor-pointer transition-colors",
        selected ? "bg-accent-primary/25 text-text-primary" : "hover:bg-bg-hover"
      )}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {getIcon(file)}
        <span className="text-sm truncate">{file.name}</span>
      </div>
      <div className="w-24 text-right text-sm text-text-secondary">{formatSize(file.size)}</div>
      <div className="w-32 text-right text-sm text-text-secondary">{formatDate(file.modified)}</div>
    </div>
  );
}
