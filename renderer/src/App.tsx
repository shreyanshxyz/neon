import React, { useState, useEffect } from "react";
import TreeView from "./components/TreeView";
import FileList from "./components/FileList";
import SearchBar from "./components/SearchBar";
import GlobalSearch from "./components/GlobalSearch";
import "./styles.css";

interface FileItem {
  name: string;
  path: string;
  type: "folder" | "file" | "drive";
  size?: number;
  modified?: number;
  isDirectory?: boolean;
}

interface SearchResult {
  path: string;
  name: string;
  snippet?: string;
  mtime: number;
  size: number;
  score?: number;
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
      loadSearchIndex: () => Promise<boolean>;
      buildSearchIndex: (rootPaths: string[]) => Promise<void>;
      searchFiles: (query: string) => Promise<SearchResult[]>;
      getIndexingStatus: () => Promise<boolean>;
      onIndexingComplete: (callback: () => void) => void;
      onIndexingError: (callback: (error: string) => void) => void;
    };
  }
}

type ViewMode = "browser" | "search";

function App(): JSX.Element {
  const [selectedFolder, setSelectedFolder] = useState<FileItem | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [treeData, setTreeData] = useState<FileItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("browser");

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

  useEffect(() => {
    initializeFileTree();
  }, []);

  const initializeFileTree = async (): Promise<void> => {
    try {
      const drives = await window.electronAPI.getDrives();
      const homeDir = await window.electronAPI.getHomeDirectory();

      const treeItems = [...drives];
      if (!treeItems.some((item) => item.path === homeDir)) {
        treeItems.push({
          name: "Home",
          path: homeDir,
          type: "folder",
        });
      }

      setTreeData(treeItems);

      const homeItem = treeItems.find((item) => item.path === homeDir);
      if (homeItem) {
        handleFolderSelect(homeItem);
      }
    } catch (error) {
      console.error("Failed to initialize file tree:", error);
      try {
        const homeDir = await window.electronAPI.getHomeDirectory();
        const homeItem = {
          name: "Home",
          path: homeDir,
          type: "folder" as const,
        };
        setTreeData([homeItem]);
        handleFolderSelect(homeItem);
      } catch (homeError) {
        console.error("Failed to get home directory:", homeError);
      }
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
        <div className="header-actions">
          <div className="view-tabs">
            <button
              className={`tab-button ${viewMode === "browser" ? "active" : ""}`}
              onClick={() => setViewMode("browser")}
            >
              File Browser
            </button>
            <button
              className={`tab-button ${viewMode === "search" ? "active" : ""}`}
              onClick={() => setViewMode("search")}
            >
              Global Search
            </button>
          </div>
          {viewMode === "browser" && (
            <button className="browse-button" onClick={handleBrowseFolder}>
              Browse Folder
            </button>
          )}
        </div>
      </header>

      <div className="app-content">
        {viewMode === "browser" ? (
          <>
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
          </>
        ) : (
          <main className="main-content-full">
            <GlobalSearch onFileOpen={handleFileOpen} />
          </main>
        )}
      </div>
    </div>
  );
}

export default App;
