import {
  Home,
  Monitor,
  Folder,
  Download,
  Image,
  Music,
  Video,
  HardDrive,
  Layout,
} from 'lucide-react';
import { sidebarPlaces, sidebarStorage } from '../../data/mockData';
import SidebarItem from './SidebarItem';

interface PlacesPanelProps {
  currentPath: string;
  onPathChange: (path: string) => void;
}

const iconMap: Record<string, typeof Home> = {
  home: Home,
  desktop: Monitor,
  folder: Folder,
  download: Download,
  picture: Image,
  music: Music,
  video: Video,
  drive: HardDrive,
};

export default function PlacesPanel({ currentPath, onPathChange }: PlacesPanelProps) {
  return (
    <aside className="w-64 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 text-text-primary font-semibold">
          <Layout className="w-5 h-5" />
          <span>Neon</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-4">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 px-3">
            Places
          </h3>
          {sidebarPlaces.map((item) => {
            const Icon = iconMap[item.icon] || Folder;
            return (
              <SidebarItem
                key={item.id}
                icon={<Icon className="w-4 h-4" />}
                label={item.name}
                active={currentPath === item.path}
                onClick={() => onPathChange(item.path)}
              />
            );
          })}
        </div>

        <div className="px-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1 px-3">
            Storage
          </h3>
          {sidebarStorage.map((item) => (
            <SidebarItem
              key={item.id}
              icon={<HardDrive className="w-4 h-4" />}
              label={item.name}
              active={currentPath === item.path}
              onClick={() => onPathChange(item.path)}
            />
          ))}
        </div>
      </nav>
    </aside>
  );
}
