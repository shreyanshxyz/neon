import { useState } from 'react';
import Sidebar from './components/Sidebar/PlacesPanel';
import FileList from './components/FileView/FileList';
import Toolbar from './components/Layout/Toolbar';

function App() {
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  return (
    <div className="app-container">
      <Sidebar 
        currentPath={currentPath}
        onPathChange={setCurrentPath}
      />
      <main className="main-content">
        <Toolbar 
          currentPath={currentPath}
          onPathChange={setCurrentPath}
          selectedCount={selectedFiles.length}
        />
        <FileList 
          currentPath={currentPath}
          selectedFiles={selectedFiles}
          onSelectionChange={setSelectedFiles}
        />
      </main>
    </div>
  );
}

export default App;
