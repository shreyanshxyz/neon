# Neon - Minimal File Explorer

A lightweight, cross-platform file explorer built with Electron and React. Features a clean, minimal interface with fast directory navigation and search capabilities.

## Features

- **Cross-platform**: Works on Linux, Windows, and macOS
- **Fast directory navigation**: Lazy-loading folder tree prevents slow startup
- **Real-time search**: Filter files by name with instant results
- **File operations**: Double-click to open files with default system applications
- **Clean UI**: Minimal, modern dark theme interface
- **Browse folders**: Add custom folders to the tree view

## Project Structure

```
neon/
├── package.json
├── main.js
├── preload.js
├── renderer/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── styles.css
│       └── components/
│           ├── TreeView.jsx
│           ├── FileList.jsx
│           └── SearchBar.jsx
└── README.md
```

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone or download the project
2. Install main dependencies:
   ```bash
   npm install
   ```
3. Install renderer dependencies:
   ```bash
   cd renderer
   npm install
   cd ..
   ```

### Running the Application

#### Development Mode

```bash
npm run electron-dev
```

This starts both the React development server and Electron app with DevTools enabled.

#### Production Build

```bash
npm run build
npm start
```

## Usage

1. **Navigate folders**: Click on folders in the left sidebar to expand/collapse them
2. **View files**: Select a folder to see its contents in the right panel
3. **Search files**: Use the search bar at the top to filter files by name
4. **Open files**: Double-click any file to open it with the default system application
5. **Browse folders**: Click "Browse Folder" to add custom directories to the tree

## Key Features Implementation

### Lazy Loading

- Folder contents are loaded on-demand when expanded
- Prevents slow startup with large directory structures
- Only loads the current view's data

### Search Functionality

- Real-time substring search through file names
- Case-insensitive filtering
- Instant results as you type

### Cross-Platform File Access

- Uses Node.js fs module via Electron's main process
- Secure IPC communication prevents direct file system access from renderer
- Handles different drive structures (Windows drives, Unix root)

### Performance Optimizations

- Virtualized rendering for large file lists
- Debounced search input
- Efficient state management with React hooks

## Technologies Used

- **Electron**
- **React**
- **Vite**
- **Node.js**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License

## Future Enhancements

- File operations (copy, move, delete)
- Multiple file selection
- File type filtering
- Keyboard shortcuts
- Custom themes
- Drag and drop support
- File preview pane
