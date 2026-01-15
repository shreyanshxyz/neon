import React, { useState } from "react";

interface FileItem {
  name: string;
  path: string;
  type: "folder" | "file" | "drive";
  size?: number;
  modified?: number;
  isDirectory?: boolean;
  children?: FileItem[] | null;
}

interface TreeNodeProps {
  node: FileItem;
  level?: number;
  onFolderSelect: (folder: FileItem) => void;
  selectedFolder: FileItem | null;
}

interface TreeViewProps {
  data: FileItem[];
  onFolderSelect: (folder: FileItem) => void;
  selectedFolder: FileItem | null;
}

function TreeNode({
  node,
  level = 0,
  onFolderSelect,
  selectedFolder,
}: TreeNodeProps): JSX.Element {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [children, setChildren] = useState<FileItem[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isSelected = selectedFolder && selectedFolder.path === node.path;

  const handleToggle = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();

    if (node.type === "folder") {
      if (isExpanded) {
        setIsExpanded(false);
      } else {
        if (children === null) {
          setIsLoading(true);
          try {
            const items = await window.electronAPI.readDirectory(node.path);
            const childNodes = items
              .filter((item) => item.isDirectory)
              .map((item) => ({
                name: item.name,
                path: item.path,
                type: "folder" as const,
                children: null,
              }));
            setChildren(childNodes);
          } catch (error) {
            console.error("Failed to load children:", error);
            setChildren([]);
          } finally {
            setIsLoading(false);
          }
        }
        setIsExpanded(true);
      }
    }
  };

  const handleSelect = (): void => {
    if (node.type === "folder") {
      onFolderSelect(node);
    }
  };

  const getIcon = (): string => {
    if (node.type === "drive") {
      return "💾";
    }
    if (node.type === "folder") {
      return isExpanded ? "📂" : "📁";
    }
    return "📄";
  };

  return (
    <div className="tree-node">
      <div
        className={`tree-item ${isSelected ? "selected" : ""}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleSelect}
      >
        {node.type === "folder" && (
          <span className="expand-icon" onClick={handleToggle}>
            {isLoading ? "⏳" : isExpanded ? "▼" : "▶"}
          </span>
        )}
        <span className="node-icon">{getIcon()}</span>
        <span className="node-name" title={node.path}>
          {node.name}
        </span>
      </div>

      {isExpanded && children && (
        <div className="tree-children">
          {children.map((child, index) => (
            <TreeNode
              key={`${child.path}-${index}`}
              node={child}
              level={level + 1}
              onFolderSelect={onFolderSelect}
              selectedFolder={selectedFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeView({
  data,
  onFolderSelect,
  selectedFolder,
}: TreeViewProps): JSX.Element {
  return (
    <div className="tree-view">
      <div className="tree-header">
        <h3>Folders</h3>
      </div>
      <div className="tree-content">
        {data.map((node, index) => (
          <TreeNode
            key={`${node.path}-${index}`}
            node={node}
            onFolderSelect={onFolderSelect}
            selectedFolder={selectedFolder}
          />
        ))}
      </div>
    </div>
  );
}

export default TreeView;
