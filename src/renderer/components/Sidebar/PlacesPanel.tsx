import { Home, Monitor, Folder, Download, Image, Music, Video, HardDrive, Layout } from "lucide-react";
import SidebarItem from "./SidebarItem";
import { useEffect, useState } from "react";

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
  const [homePath, setHomePath] = useState(process.env.HOME || '/home/user');

  useEffect(() => {
    if (window.filesystem?.homePath) {
      window.filesystem.homePath().then(setHomePath);
    }
  }, []);

  const desktopPath = `${homePath}/Desktop`;
  const documentsPath = `${homePath}/Documents`;
  const downloadsPath = `${homePath}/Downloads`;
  const picturesPath = `${homePath}/Pictures`;
  const musicPath = `${homePath}/Music`;
  const videosPath = `${homePath}/Videos`;

  const sidebarPlaces = [
    { id: "home", name: "Home", icon: "home", path: homePath, type: "place" as const },
    { id: "desktop", name: "Desktop", icon: "desktop", path: desktopPath, type: "place" as const },
    { id: "documents", name: "Documents", icon: "folder", path: documentsPath, type: "place" as const },
    { id: "downloads", name: "Downloads", icon: "download", path: downloadsPath, type: "place" as const },
    { id: "pictures", name: "Pictures", icon: "picture", path: picturesPath, type: "place" as const },
    { id: "music", name: "Music", icon: "music", path: musicPath, type: "place" as const },
    { id: "videos", name: "Videos", icon: "video", path: videosPath, type: "place" as const },
  ];

  const sidebarStorage = [
    { id: "root", name: "Root", icon: "drive", path: "/", type: "storage" as const },
    { id: "home", name: "Home", icon: "drive", path: homePath, type: "storage" as const },
  ];

  return (
    <aside className="w-64 bg-bg-secondary border-r border-border flex flex-col shrink-0">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 text-text-primary font-semibold">
          <Layout className="w-5 h-5" />
          <span>Neon</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-3 flex flex-col gap-1 mb-4">
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

        <div className="px-3 flex flex-col gap-1">
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
