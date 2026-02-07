import Store from 'electron-store';
import { v4 as uuidv4 } from 'uuid';

interface ParsedQuery {
  keywords: string[];
  fileTypes?: string[];
  dateRange?: { start: Date; end: Date };
  sizeRange?: { min?: number; max?: number };
  namePattern?: string;
  contentQuery?: string;
}

interface SmartFolder {
  id: string;
  name: string;
  query: string;
  parsedQuery: ParsedQuery;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

interface SmartFolderData {
  folders: SmartFolder[];
  version: number;
}

const MAX_FOLDERS = 50;
const CURRENT_VERSION = 1;

class SmartFolderService {
  private store: Store<SmartFolderData>;

  constructor() {
    this.store = new Store<SmartFolderData>({
      name: 'smart-folders',
      defaults: {
        folders: [],
        version: CURRENT_VERSION,
      },
    });
  }

  async getAll(): Promise<SmartFolder[]> {
    return this.store.get('folders') || [];
  }

  async getById(id: string): Promise<SmartFolder | null> {
    const folders = await this.getAll();
    return folders.find((f) => f.id === id) || null;
  }

  async create(data: Omit<SmartFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<SmartFolder> {
    const folders = await this.getAll();

    if (folders.length >= MAX_FOLDERS) {
      throw new Error(
        `Maximum number of smart folders (${MAX_FOLDERS}) reached. Please delete some folders first.`
      );
    }

    const normalizedName = data.name.toLowerCase().trim();
    const existingFolder = folders.find((f) => f.name.toLowerCase().trim() === normalizedName);
    if (existingFolder) {
      throw new Error(
        `A smart folder with the name "${data.name}" already exists. Please choose a different name.`
      );
    }

    const now = new Date().toISOString();
    const newFolder: SmartFolder = {
      id: uuidv4(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    folders.push(newFolder);
    this.store.set('folders', folders);

    return newFolder;
  }

  async update(id: string, updates: Partial<SmartFolder>): Promise<SmartFolder> {
    const folders = await this.getAll();
    const index = folders.findIndex((f) => f.id === id);

    if (index === -1) {
      throw new Error(`Smart folder with ID "${id}" not found.`);
    }

    if (updates.name) {
      const normalizedName = updates.name.toLowerCase().trim();
      const existingFolder = folders.find(
        (f, i) => i !== index && f.name.toLowerCase().trim() === normalizedName
      );
      if (existingFolder) {
        throw new Error(
          `A smart folder with the name "${updates.name}" already exists. Please choose a different name.`
        );
      }
    }

    const updatedFolder = {
      ...folders[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    folders[index] = updatedFolder;
    this.store.set('folders', folders);

    return updatedFolder;
  }

  async delete(id: string): Promise<void> {
    const folders = await this.getAll();
    const filteredFolders = folders.filter((f) => f.id !== id);

    if (filteredFolders.length === folders.length) {
      throw new Error(`Smart folder with ID "${id}" not found.`);
    }

    this.store.set('folders', filteredFolders);
  }

  async execute(id: string): Promise<SmartFolder> {
    const folder = await this.getById(id);
    if (!folder) {
      throw new Error(`Smart folder with ID "${id}" not found.`);
    }
    return folder;
  }

  async clearAll(): Promise<void> {
    this.store.set('folders', []);
  }

  async getCount(): Promise<number> {
    const folders = await this.getAll();
    return folders.length;
  }
}

export { SmartFolderService };
export type { SmartFolder, ParsedQuery };
