export interface SidebarItem {
  id: string;
  name: string;
  icon: string;
  path: string;
  type: 'place' | 'bookmark' | 'network' | 'storage';
  active?: boolean;
}

export interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
  expanded?: boolean;
}
