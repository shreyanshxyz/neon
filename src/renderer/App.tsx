import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar/PlacesPanel";
import FileList from "./components/FileView/FileList";
import Toolbar from "./components/Layout/Toolbar";
import { useFileSystem } from "./hooks/useFileSystem";

function App() {
  const [homePath, setHomePath] = useState(process.env.HOME || '/home/user');
  const [currentPath, setCurrentPath] = useState(process.env.HOME || '/home/user');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const { files, loading, error, setCurrentPath: navigate } = useFileSystem(currentPath);

  useEffect(() => {
    if (window.filesystem?.homePath) {
      window.filesystem.homePath().then((path) => {
        setHomePath(path);
        if (currentPath === '/home/user' || currentPath === '/home/shreyanshxyz') {
          setCurrentPath(path);
          navigate(path);
        }
      });
    }
  }, []);

  const handleNavigate = (path: string) => {
    setSelectedFiles([]);
    navigate(path);
  };

  const handleFileClick = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    if (file.type === "folder") {
      handleNavigate(file.path);
    } else {
      setSelectedFiles((prev) =>
        prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
      );
    }
  };

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
          onFileClick={handleFileClick}
        />
      </main>
    </div>
  );
}

export default App;
