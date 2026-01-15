import { FileItem } from '../types/file';
import { SidebarItem } from '../types/sidebar';

export const mockFiles: FileItem[] = [
  { id: '1', name: 'Documents', type: 'folder', size: 0, modified: new Date('2024-01-15'), icon: 'folder', path: '/home/user/Documents' },
  { id: '2', name: 'Pictures', type: 'folder', size: 0, modified: new Date('2024-01-14'), icon: 'folder', path: '/home/user/Pictures' },
  { id: '3', name: 'Music', type: 'folder', size: 0, modified: new Date('2024-01-10'), icon: 'folder', path: '/home/user/Music' },
  { id: '4', name: 'Videos', type: 'folder', size: 0, modified: new Date('2024-01-12'), icon: 'folder', path: '/home/user/Videos' },
  { id: '5', name: 'Downloads', type: 'folder', size: 0, modified: new Date('2024-01-15'), icon: 'folder', path: '/home/user/Downloads' },
  { id: '6', name: 'project-neon.zip', type: 'file', size: 15728640, modified: new Date('2024-01-15'), icon: 'zip', path: '/home/user/Downloads/project-neon.zip' },
  { id: '7', name: 'README.md', type: 'file', size: 2048, modified: new Date('2024-01-14'), icon: 'text', path: '/home/user/README.md' },
  { id: '8', name: 'photo.jpg', type: 'file', size: 5242880, modified: new Date('2024-01-13'), icon: 'image', path: '/home/user/Pictures/photo.jpg' },
  { id: '9', name: 'music.mp3', type: 'file', size: 1048576, modified: new Date('2024-01-11'), icon: 'audio', path: '/home/user/Music/music.mp3' },
  { id: '10', name: 'video.mp4', type: 'file', size: 20971520, modified: new Date('2024-01-12'), icon: 'video', path: '/home/user/Videos/video.mp4' },
];

export const sidebarPlaces: SidebarItem[] = [
  { id: 'home', name: 'Home', icon: 'home', path: '/home/user', type: 'place', active: true },
  { id: 'desktop', name: 'Desktop', icon: 'desktop', path: '/home/user/Desktop', type: 'place' },
  { id: 'documents', name: 'Documents', icon: 'folder', path: '/home/user/Documents', type: 'place' },
  { id: 'downloads', name: 'Downloads', icon: 'folder', path: '/home/user/Downloads', type: 'place' },
  { id: 'pictures', name: 'Pictures', icon: 'folder', path: '/home/user/Pictures', type: 'place' },
  { id: 'music', name: 'Music', icon: 'folder', path: '/home/user/Music', type: 'place' },
  { id: 'videos', name: 'Videos', icon: 'folder', path: '/home/user/Videos', type: 'place' },
];

export const sidebarStorage: SidebarItem[] = [
  { id: 'root', name: 'Root', icon: 'drive', path: '/', type: 'storage' },
  { id: 'local', name: 'Local Disk', icon: 'drive', path: '/home', type: 'storage' },
];
