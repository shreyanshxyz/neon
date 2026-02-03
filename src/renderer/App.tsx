import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar/PlacesPanel';
import FileList from './components/FileView/FileList';
import Toolbar from './components/Layout/Toolbar';
import FilePreview from './components/FileView/FilePreview';
import { useFileSystem, FileItem } from './hooks/useFileSystem';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{
    isOpen: boolean;
    file: FileItem | null;
    newName: string;
  }>({ isOpen: false, file: null, newName: '' });
  const [newFolderDialog, setNewFolderDialog] = useState<{
    isOpen: boolean;
    name: string;
  }>({ isOpen: false, name: '' });

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

  const handleNavigate = useCallback(
    (path: string) => {
      setSelectedFiles([]);
      setCurrentPath(path);
      navigate(path);
    },
    [navigate]
  );

  const handleFileClick = useCallback(
    (fileId: string, isCtrlClick: boolean) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;

      if (isCtrlClick) {
        setSelectedFiles((prev) =>
          prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
        );
      } else {
        setSelectedFiles([fileId]);
      }
    },
    [files]
  );

  const handleFileDoubleClick = useCallback(
    (fileId: string) => {
      const file = files.find((f) => f.id === fileId);
      if (!file) return;

      if (file.type === 'folder') {
        handleNavigate(file.path);
      } else {
        setPreviewFile(file);
        setIsPreviewOpen(true);
      }
    },
    [files, handleNavigate]
  );

  const handlePreview = useCallback((file: FileItem) => {
    setPreviewFile(file);
    setIsPreviewOpen(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewFile(null);
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
      }
    },
    [deleteFile]
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
  }, [renameDialog, moveFile]);

  const handleCreateFolder = useCallback(() => {
    setNewFolderDialog({ isOpen: true, name: 'New Folder' });
  }, []);

  const confirmCreateFolder = useCallback(async () => {
    const folderPath = pathUtils.join(currentPath, newFolderDialog.name);
    await createFolder(folderPath);
    setNewFolderDialog({ isOpen: false, name: '' });
  }, [newFolderDialog, currentPath, createFolder]);

  return (
    <div className="app-container">
      <Sidebar currentPath={currentPath} onPathChange={handleNavigate} />
      <main className="main-content">
        <Toolbar
          currentPath={currentPath}
          onPathChange={handleNavigate}
          selectedCount={selectedFiles.length}
        />
        <FileList
          files={files}
          loading={loading}
          error={error}
          selectedFiles={selectedFiles}
          currentPath={currentPath}
          hasClipboard={!!clipboard}
          onFileClick={handleFileClick}
          onFileDoubleClick={handleFileDoubleClick}
          onCopy={handleCopy}
          onCut={handleCut}
          onPaste={handlePaste}
          onDelete={handleDelete}
          onRename={handleRename}
          onCreateFolder={handleCreateFolder}
          onPreview={handlePreview}
        />
      </main>
      <FilePreview
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
        readFileContent={readFileContent}
      />

      {renameDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-lg p-6 w-96 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">Rename</h3>
            <input
              type="text"
              value={renameDialog.newName}
              onChange={(e) => setRenameDialog((prev) => ({ ...prev, newName: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setRenameDialog({ isOpen: false, file: null, newName: '' })}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRename}
                className="px-4 py-2 text-sm bg-accent-primary text-white rounded hover:bg-accent-hover transition-colors"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {newFolderDialog.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-lg p-6 w-96 border border-border">
            <h3 className="text-lg font-semibold mb-4 text-text-primary">New Folder</h3>
            <input
              type="text"
              value={newFolderDialog.name}
              onChange={(e) => setNewFolderDialog((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-bg-primary border border-border rounded text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setNewFolderDialog({ isOpen: false, name: '' })}
                className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCreateFolder}
                className="px-4 py-2 text-sm bg-accent-primary text-white rounded hover:bg-accent-hover transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
