import React, { useState, useEffect } from "react";
import TreeView from "./components/TreeView";
import FileList from "./components/FileList";
import SearchBar from "./components/SearchBar";
import "./styles.css";

interface FileItem {
  name: string;
  path: string;
  type: "folder" | "file" | "drive";
  size?: number;
  modified?: number;
  isDirectory?: boolean;
}

declare global {
  interface Window {
    electronAPI: {
      getDrives: () => Promise<FileItem[]>;
      readDirectory: (dirPath: string) => Promise<FileItem[]>;
      getHomeDirectory: () => Promise<string>;
      openFile: (filePath: string) => Promise<void>;
      selectDirectory: () => Promise<string | null>;
      platform: string;
    };
  }
}

function App(): JSX.Element {
  const [selectedFolder, setSelectedFolder] = useState<FileItem | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [treeData, setTreeData] = useState<FileItem[]>([]);

  useEffect(() => {
    initializeFileTree();
  }, []);

  const initializeFileTree = async (): Promise<void> => {
    try {
      const drives = await window.electronAPI.getDrives();
      setTreeData(drives);
    } catch (error) {
      console.error("Failed to get drives:", error);
      try {
        const homeDir = await window.electronAPI.getHomeDirectory();
        setTreeData([
          {
            name: "Home",
            path: homeDir,
            type: "folder",
          },
        ]);
      } catch (homeError) {
        console.error("Failed to get home directory:", homeError);
      }
    }
  };

  const handleFolderSelect = async (folder: FileItem): Promise<void> => {
    setSelectedFolder(folder);
    try {
      const fileItems = await window.electronAPI.readDirectory(folder.path);
      setFiles(fileItems);
    } catch (error) {
      console.error("Failed to read directory:", error);
      setFiles([]);
    }
  };

  const handleFileOpen = async (filePath: string): Promise<void> => {
    try {
      await window.electronAPI.openFile(filePath);
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };

  const handleBrowseFolder = async (): Promise<void> => {
    try {
      const folderPath = await window.electronAPI.selectDirectory();
      if (folderPath) {
        const folder: FileItem = {
          name: folderPath.split("/").pop() || folderPath,
          path: folderPath,
          type: "folder",
        };
        setTreeData((prev) => [...prev, folder]);
      }
    } catch (error) {
      console.error("Failed to browse folder:", error);
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Neon</h1>
        <button className="browse-button" onClick={handleBrowseFolder}>
          Browse Folder
        </button>
      </header>

      <div className="app-content">
        <aside className="sidebar">
          <TreeView
            data={treeData}
            onFolderSelect={handleFolderSelect}
            selectedFolder={selectedFolder}
          />
        </aside>

        <main className="main-content">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={`Search ${
              selectedFolder ? selectedFolder.name : "files"
            }...`}
          />

          <FileList
            files={filteredFiles}
            onFileOpen={handleFileOpen}
            selectedFolder={selectedFolder}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
