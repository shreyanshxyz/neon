export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  modified: Date;
  icon: string;
  path: string;
  selected?: boolean;
}

export interface FolderStats {
  totalItems: number;
  folders: number;
  files: number;
}
