import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar/PlacesPanel';
import FileList from './components/FileView/FileList';
import Toolbar from './components/Layout/Toolbar';
import RightPanel from './components/RightPanel/RightPanel';
import SearchModal from './components/Search/SearchModal';
import SmartFolderDialog from './components/SmartFolders/SmartFolderDialog';
import { useFileSystem, FileItem } from './hooks/useFileSystem';
import { useSearch } from './hooks/useSearch';
import { useSmartFolders, SmartFolder, ParsedQuery } from './hooks/useSmartFolders';

const pathUtils = {
  join: (...parts: string[]): string => {
    return parts
      .map((part, i) => {
        if (i === 0) return part.replace(/\/$/, '');
        return part.replace(/^\/|\/$/g, '');
      })
      .filter((part) => part.length > 0)
      .join('/');
  },
  dirname: (filepath: string): string => {
    const lastSlash = filepath.lastIndexOf('/');
    return lastSlash === -1 ? '' : filepath.substring(0, lastSlash) || '/';
  },
};

function App() {
  const [homePath, setHomePath] = useState(process.env.HOME || '/home/user');
  const [currentPath, setCurrentPath] = useState(process.env.HOME || '/home/user');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<'preview' | 'chat' | 'plugins'>('preview');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    file: FileItem | null;
    newName: string;
  }>({ isOpen: false, file: null, newName: '' });
  const [newFolderDialog, setNewFolderDialog] = useState<{
    isOpen: boolean;
    name: string;
  }>({ isOpen: false, name: '' });

  const [smartFolderDialog, setSmartFolderDialog] = useState<{
    isOpen: boolean;
    mode: 'create' | 'edit';
    folder: SmartFolder | null;
  }>({ isOpen: false, mode: 'create', folder: null });
  const [isSmartFolderView, setIsSmartFolderView] = useState(false);
  const [currentSmartFolder, setCurrentSmartFolder] = useState<SmartFolder | null>(null);
  const [smartFolderResults, setSmartFolderResults] = useState<FileItem[]>([]);
  const [smartFolderLoading, setSmartFolderLoading] = useState(false);

  const {
    files,
    loading,
    error,
    clipboard,
    setCurrentPath: navigate,
    refresh,
    readFileContent,
    copyFile,
    moveFile,
    deleteFile,
    createFolder,
    copyToClipboard,
    cutToClipboard,
    pasteFromClipboard,
    clearClipboard,
  } = useFileSystem(currentPath);

  const { indexDirectory } = useSearch();
  const {
    folders,
    loading: smartFoldersLoading,
    createFolder: createSmartFolder,
    updateFolder,
    deleteFolder,
    executeFolder,
    loadFolders,
  } = useSmartFolders();

  useEffect(() => {
    if (currentPath && !currentPath.startsWith('smartfolder://')) {
      indexDirectory(currentPath);
    }
  }, [currentPath, indexDirectory]);

  useEffect(() => {
    if (window.filesystem?.homePath) {
      window.filesystem.homePath().then((path: string) => {
        setHomePath(path);
        if (currentPath === '/home/user' || currentPath === '/home/shreyanshxyz') {
          setCurrentPath(path);
          navigate(path);
        }
      });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      if (isCtrl && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
      }

      if (isCtrl && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        setRightPanelTab((prev) => (prev === 'chat' ? 'preview' : 'chat'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSmartFolderSelect = useCallback(
    async (folder: SmartFolder) => {
      setIsSmartFolderView(true);
      setCurrentSmartFolder(folder);
      setCurrentPath(`smartfolder://${folder.id}`);
      setSelectedFiles([]);
      setSmartFolderLoading(true);

      try {
        const result = await executeFolder(folder.id);

        if (result.success && result.results) {
          const fileItems: FileItem[] = result.results.map((r) => ({
            id: r.file.path,
            name: r.file.name,
            type: 'file',
            path: r.file.path,
            size: r.file.size,
            modified: r.file.modified,
            icon: getFileIcon(r.file.name, false),
            extension: r.file.extension,
            hidden: r.file.name.startsWith('.'),
          }));
          setSmartFolderResults(fileItems);
        } else {
          setSmartFolderResults([]);
        }
      } finally {
        setSmartFolderLoading(false);
      }
    },
    [executeFolder]
  );

  const handleNavigate = useCallback(
    (path: string) => {
      setSelectedFiles([]);

      if (path.startsWith('smartfolder://')) {
        const folderId = path.replace('smartfolder://', '');
        const folder = folders.find((f) => f.id === folderId);
        if (folder) {
          handleSmartFolderSelect(folder);
        }
      } else {
        setIsSmartFolderView(false);
        setCurrentSmartFolder(null);
        setCurrentPath(path);
        navigate(path);
      }
    },
    [navigate, folders, handleSmartFolderSelect]
  );

  const handleCreateSmartFolder = useCallback(
    async (name: string, query: string, parsedQuery: ParsedQuery) => {
      const result = await createSmartFolder(name, query, parsedQuery);
      if (!result.success) {
        console.error('Failed to create smart folder:', result.error);
      }
      return result;
    },
    [createSmartFolder]
  );

  const handleUpdateSmartFolder = useCallback(
    async (name: string, query: string, parsedQuery: ParsedQuery) => {
      if (smartFolderDialog.folder) {
        const result = await updateFolder(smartFolderDialog.folder.id, {
          name,
          query,
          parsedQuery,
        });

        if (result.success && currentSmartFolder?.id === smartFolderDialog.folder.id) {
          const updatedFolder = { ...currentSmartFolder, name, query, parsedQuery };
          await handleSmartFolderSelect(updatedFolder);
        }

        return result;
      }
    },
    [updateFolder, smartFolderDialog.folder, currentSmartFolder, handleSmartFolderSelect]
  );

  const handleDeleteSmartFolder = useCallback(
    async (folder: SmartFolder) => {
      if (confirm(`Are you sure you want to delete "${folder.name}"?`)) {
        await deleteFolder(folder.id);
        if (currentSmartFolder?.id === folder.id) {
          handleNavigate(homePath);
        }
      }
    },
    [deleteFolder, currentSmartFolder, homePath, handleNavigate]
  );

  const handleRefreshSmartFolder = useCallback(
    async (folder: SmartFolder) => {
      if (currentSmartFolder?.id === folder.id) {
        await handleSmartFolderSelect(folder);
      }
    },
    [currentSmartFolder, handleSmartFolderSelect]
  );

  const handleFileClick = useCallback(
    (fileId: string, isCtrlClick: boolean) => {
      const fileList = isSmartFolderView ? smartFolderResults : files;
      const file = fileList.find((f) => f.id === fileId);
      if (!file) return;

      if (isCtrlClick) {
        setSelectedFiles((prev) =>
          prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
        );
      } else {
        setSelectedFiles([fileId]);
      }
    },
    [files, smartFolderResults, isSmartFolderView]
  );

  const handleFileDoubleClick = useCallback(
    (fileId: string) => {
      const fileList = isSmartFolderView ? smartFolderResults : files;
      const file = fileList.find((f) => f.id === fileId);
      if (!file) return;

      if (file.type === 'folder') {
        handleNavigate(file.path);
      } else {
        setPreviewFile(file);
        setRightPanelTab('preview');
      }
    },
    [smartFolderResults, files, isSmartFolderView, handleNavigate]
  );

  const handlePreview = useCallback((file: FileItem) => {
    setPreviewFile(file);
    setRightPanelTab('preview');
  }, []);

  const handleCopy = useCallback(
    (file: FileItem) => {
      copyToClipboard([file.path]);
    },
    [copyToClipboard]
  );

  const handleCut = useCallback(
    (file: FileItem) => {
      cutToClipboard([file.path]);
    },
    [cutToClipboard]
  );

  const handlePaste = useCallback(async () => {
    const success = await pasteFromClipboard(currentPath);
    if (success) {
      clearClipboard();
    }
  }, [pasteFromClipboard, currentPath, clearClipboard]);

  const handleDelete = useCallback(
    async (file: FileItem) => {
      if (confirm(`Are you sure you want to move "${file.name}" to trash?`)) {
        await deleteFile(file.path);
        setSelectedFiles([]);
        if (isSmartFolderView && currentSmartFolder) {
          await handleRefreshSmartFolder(currentSmartFolder);
        }
      }
    },
    [deleteFile, isSmartFolderView, currentSmartFolder, handleRefreshSmartFolder]
  );

  const handleRename = useCallback((file: FileItem) => {
    setRenameDialog({
      isOpen: true,
      file,
      newName: file.name,
    });
  }, []);

  const confirmRename = useCallback(async () => {
    if (!renameDialog.file) return;

    const oldPath = renameDialog.file.path;
    const newPath = pathUtils.join(
      oldPath.substring(0, oldPath.lastIndexOf('/')),
      renameDialog.newName
    );

    await moveFile(oldPath, newPath);
    setRenameDialog({ isOpen: false, file: null, newName: '' });
    setSelectedFiles([]);
    if (isSmartFolderView && currentSmartFolder) {
      await handleRefreshSmartFolder(currentSmartFolder);
    }
  }, [renameDialog, moveFile, isSmartFolderView, currentSmartFolder, handleRefreshSmartFolder]);

  const handleCreateFolder = useCallback(() => {
    setNewFolderDialog({ isOpen: true, name: 'New Folder' });
  }, []);

  const confirmCreateFolder = useCallback(async () => {
    const folderPath = pathUtils.join(currentPath, newFolderDialog.name);
    await createFolder(folderPath);
    setNewFolderDialog({ isOpen: false, name: '' });
  }, [newFolderDialog, currentPath, createFolder]);

  const handleFileDrop = useCallback(
    async (sourcePath: string, destPath: string) => {
      const sourceDir = pathUtils.dirname(sourcePath);
      const destDir = pathUtils.dirname(destPath);

      if (sourceDir === destDir) {
        await moveFile(sourcePath, destPath);
      } else {
        await moveFile(sourcePath, destPath);
      }

      setSelectedFiles([]);
      if (isSmartFolderView && currentSmartFolder) {
        await handleRefreshSmartFolder(currentSmartFolder);
      }
    },
    [moveFile, isSmartFolderView, currentSmartFolder, handleRefreshSmartFolder]
  );

  const handleSearchFileSelect = useCallback((file: FileItem) => {
    setSelectedFiles([file.id]);
    if (file.type === 'file') {
      setPreviewFile(file);
      setRightPanelTab('preview');
    }
  }, []);

  const handleSearchNavigate = useCallback(
    (folderPath: string) => {
      handleNavigate(folderPath);
    },
    [handleNavigate]
  );

  const displayedFiles = isSmartFolderView ? smartFolderResults : files;
  const displayedLoading = isSmartFolderView ? smartFolderLoading : loading;
  const selectedFileItems = displayedFiles.filter((file) => selectedFiles.includes(file.id));

  const getStatusText = () => {
    if (displayedLoading) return 'λ loading...';
    if (error) return 'λ error';
    const count = displayedFiles.length;
    const selected = selectedFiles.length;
    if (selected > 0) {
      return `λ ${selected} selected / ${count} items`;
    }
    return `λ ${count} items`;
  };

  return (
    <div className="app-container">
      <div className="terminal-header border-b border-terminal-border">
        <span className="font-terminal text-terminal-green text-sm">λ</span>
        <span className="font-terminal text-terminal-text text-sm ml-2">NEON FILE MANAGER</span>
        <span className="text-terminal-muted text-xs ml-4">v1.0.0</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentPath={currentPath}
          onPathChange={handleNavigate}
          smartFolders={folders}
          onSmartFolderSelect={handleSmartFolderSelect}
          onCreateSmartFolder={() =>
            setSmartFolderDialog({ isOpen: true, mode: 'create', folder: null })
          }
          onEditSmartFolder={(folder) =>
            setSmartFolderDialog({ isOpen: true, mode: 'edit', folder })
          }
          onDeleteSmartFolder={handleDeleteSmartFolder}
          onRefreshSmartFolder={handleRefreshSmartFolder}
        />
        <main className="main-content">
          <Toolbar
            currentPath={currentPath}
            onPathChange={handleNavigate}
            selectedCount={selectedFiles.length}
            isSmartFolderView={isSmartFolderView}
            smartFolderName={currentSmartFolder?.name}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
          <FileList
            files={displayedFiles}
            loading={displayedLoading}
            error={error}
            selectedFiles={selectedFiles}
            currentPath={currentPath}
            hasClipboard={!!clipboard}
            viewMode={viewMode}
            onFileClick={handleFileClick}
            onFileDoubleClick={handleFileDoubleClick}
            onCopy={handleCopy}
            onCut={handleCut}
            onPaste={handlePaste}
            onDelete={handleDelete}
            onRename={handleRename}
            onCreateFolder={handleCreateFolder}
            onPreview={handlePreview}
            onFileDrop={handleFileDrop}
          />
        </main>
        <RightPanel
          tab={rightPanelTab}
          onTabChange={setRightPanelTab}
          file={previewFile}
          selectedFiles={selectedFileItems}
          currentPath={currentPath}
          readFileContent={readFileContent}
        />
      </div>

      <div className="terminal-footer">
        <span className="font-terminal">{getStatusText()}</span>
        <span className="text-terminal-muted">Press Ctrl+F to search • Ctrl+Shift+L for chat</span>
      </div>
      <SearchModal
        isOpen={isSearchOpen}
        files={files}
        currentPath={currentPath}
        onClose={() => setIsSearchOpen(false)}
        onFileSelect={handleSearchFileSelect}
        onNavigateToFolder={handleSearchNavigate}
      />

      <SmartFolderDialog
        isOpen={smartFolderDialog.isOpen}
        onClose={() => setSmartFolderDialog({ isOpen: false, mode: 'create', folder: null })}
        onSave={
          smartFolderDialog.mode === 'create' ? handleCreateSmartFolder : handleUpdateSmartFolder
        }
        folder={smartFolderDialog.folder}
        title={smartFolderDialog.mode === 'create' ? 'Create Smart Folder' : 'Edit Smart Folder'}
        existingFolders={folders}
      />

      {renameDialog.isOpen && (
        <div className="terminal-modal-overlay">
          <div className="terminal-modal p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-terminal-text font-terminal">Rename</h3>
            <input
              type="text"
              value={renameDialog.newName}
              onChange={(e) => setRenameDialog((prev) => ({ ...prev, newName: e.target.value }))}
              className="terminal-input w-full"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRenameDialog({ isOpen: false, file: null, newName: '' })}
                className="terminal-btn"
              >
                Cancel
              </button>
              <button onClick={confirmRename} className="terminal-btn-primary">
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {newFolderDialog.isOpen && (
        <div className="terminal-modal-overlay">
          <div className="terminal-modal p-6 w-96">
            <h3 className="text-lg font-semibold mb-4 text-terminal-text font-terminal">
              New Folder
            </h3>
            <input
              type="text"
              value={newFolderDialog.name}
              onChange={(e) => setNewFolderDialog((prev) => ({ ...prev, name: e.target.value }))}
              className="terminal-input w-full"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setNewFolderDialog({ isOpen: false, name: '' })}
                className="terminal-btn"
              >
                Cancel
              </button>
              <button onClick={confirmCreateFolder} className="terminal-btn-primary">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getFileIcon(name: string, isDirectory: boolean): string {
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
    mp4: 'video',
    pdf: 'pdf',
    doc: 'document',
    docx: 'document',
    txt: 'text',
    zip: 'archive',
    js: 'code',
    ts: 'code',
    jsx: 'code',
    tsx: 'code',
    py: 'code',
    java: 'code',
    html: 'web',
    css: 'web',
    json: 'data',
  };

  return iconMap[ext] || 'file';
}

export default App;
