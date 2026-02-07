import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import WasmRuntime, { WasmResult } from './wasm/WasmRuntime.js';

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
  capabilities: Record<string, { fileTypes: string[]; maxFileSize?: number }>;
  priority?: number;
  wasm: string;
  memoryLimit?: number;
}

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  capabilities: PluginManifest['capabilities'];
  priority: number;
  enabled: boolean;
  wasmPath: string;
  lastError?: string;
}

export interface PluginExecutionResult {
  success: boolean;
  data?: Uint8Array;
  mimeType?: string;
  plugin?: PluginInfo;
  error?: string;
}

interface PluginRecord {
  info: PluginInfo;
  runtime?: WasmRuntime;
  memoryLimitBytes: number;
}

const DEFAULT_MEMORY_LIMIT = 128 * 1024 * 1024;
const EXECUTION_TIMEOUT_MS = 30_000;

export class PluginService {
  private plugins: Map<string, PluginRecord> = new Map();
  private pluginDir: string;

  constructor(pluginDir?: string) {
    this.pluginDir = pluginDir || this.resolvePluginDir();
  }

  async loadPlugins(): Promise<void> {
    this.plugins.clear();

    if (!fs.existsSync(this.pluginDir)) {
      return;
    }

    const entries = await fs.promises.readdir(this.pluginDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(this.pluginDir, entry.name, 'manifest.json');
      if (!fs.existsSync(manifestPath)) continue;
      try {
        const manifest = await this.readManifest(manifestPath);
        const wasmPath = path.join(this.pluginDir, entry.name, manifest.wasm);
        const pluginInfo: PluginInfo = {
          id: manifest.name,
          name: manifest.name,
          version: manifest.version,
          description: manifest.description,
          author: manifest.author,
          capabilities: manifest.capabilities,
          priority: manifest.priority ?? 0,
          enabled: true,
          wasmPath,
        };
        this.plugins.set(pluginInfo.id, {
          info: pluginInfo,
          memoryLimitBytes: manifest.memoryLimit ?? DEFAULT_MEMORY_LIMIT,
        });
      } catch (error: unknown) {
        const err = error as { message?: string };
        console.warn(`[plugins] Failed to load manifest at ${manifestPath}: ${err.message}`);
      }
    }
  }

  listPlugins(): PluginInfo[] {
    return Array.from(this.plugins.values())
      .map((record) => record.info)
      .sort((a, b) => b.priority - a.priority);
  }

  getPluginForFile(filePath: string, capability: string): PluginInfo | null {
    const extension = path.extname(filePath).replace('.', '').toLowerCase();
    const candidates = this.listPlugins().filter((plugin) => plugin.enabled);
    for (const plugin of candidates) {
      const capabilityInfo = plugin.capabilities?.[capability];
      if (!capabilityInfo) continue;
      const fileTypes = capabilityInfo.fileTypes.map((type) => type.toLowerCase());
      if (!fileTypes.includes(extension)) continue;
      return plugin;
    }
    return null;
  }

  async executeCapability(capability: string, filePath: string): Promise<PluginExecutionResult> {
    const plugin = this.getPluginForFile(filePath, capability);
    if (!plugin) {
      return { success: false, error: 'No plugin available' };
    }
    return this.executePlugin(plugin.id, capability, filePath);
  }

  async executePlugin(
    pluginId: string,
    capability: string,
    filePath: string
  ): Promise<PluginExecutionResult> {
    const record = this.plugins.get(pluginId);
    if (!record) {
      return { success: false, error: 'Plugin not found' };
    }
    if (!record.info.enabled) {
      return { success: false, error: 'Plugin disabled' };
    }

    const capabilityInfo = record.info.capabilities?.[capability];
    if (!capabilityInfo) {
      return { success: false, error: 'Plugin does not support capability' };
    }

    try {
      const stats = await fs.promises.stat(filePath);
      if (capabilityInfo.maxFileSize && stats.size > capabilityInfo.maxFileSize) {
        return { success: false, error: 'File exceeds plugin size limit' };
      }

      const input = await fs.promises.readFile(filePath);
      const runtime = await this.ensureRuntime(record);
      const method = this.getMethodForCapability(capability);

      const result = await this.runWithTimeout(
        () => runtime.execute(method, new Uint8Array(input), [path.extname(filePath).slice(1)]),
        EXECUTION_TIMEOUT_MS
      );

      if (!result) {
        return { success: false, error: 'Plugin returned no data', plugin: record.info };
      }

      return {
        success: true,
        data: result.data,
        mimeType: result.mimeType,
        plugin: record.info,
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      record.info.lastError = err.message || 'Plugin execution failed';
      record.info.enabled = false;
      record.runtime?.dispose();
      record.runtime = undefined;
      return {
        success: false,
        error: record.info.lastError,
        plugin: record.info,
      };
    }
  }

  setPluginPriority(pluginId: string, priority: number): void {
    const record = this.plugins.get(pluginId);
    if (!record) return;
    record.info.priority = priority;
  }

  togglePlugin(pluginId: string, enabled: boolean): void {
    const record = this.plugins.get(pluginId);
    if (!record) return;
    record.info.enabled = enabled;
    if (!enabled) {
      record.runtime?.dispose();
      record.runtime = undefined;
    }
  }

  private async readManifest(manifestPath: string): Promise<PluginManifest> {
    const raw = await fs.promises.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(raw) as PluginManifest;
    if (!manifest.name || !manifest.version || !manifest.wasm) {
      throw new Error('Manifest missing required fields');
    }
    return manifest;
  }

  private async ensureRuntime(record: PluginRecord): Promise<WasmRuntime> {
    if (record.runtime) return record.runtime;
    const runtime = await WasmRuntime.create(record.info.wasmPath, {
      memoryLimitBytes: record.memoryLimitBytes,
    });
    record.runtime = runtime;
    return runtime;
  }

  private getMethodForCapability(capability: string): string {
    if (capability === 'preview') return 'preview_file';
    if (capability === 'metadata') return 'extract_metadata';
    return capability;
  }

  private resolvePluginDir(): string {
    const resourcesDir = path.join(process.resourcesPath || '', 'plugins');
    if (fs.existsSync(resourcesDir)) {
      return resourcesDir;
    }

    const candidates = [
      path.join(app.getAppPath(), 'src', 'plugins'),
      path.join(process.cwd(), 'src', 'plugins'),
      path.join(app.getAppPath(), 'plugins'),
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }

    const userPluginsDir = path.join(app.getPath('userData'), 'plugins');
    if (!fs.existsSync(userPluginsDir)) {
      fs.mkdirSync(userPluginsDir, { recursive: true });
    }
    return userPluginsDir;
  }

  private async runWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
    let timeoutId: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('Plugin execution timed out')), timeoutMs);
    });

    try {
      return await Promise.race([fn(), timeoutPromise]);
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
    }
  }
}
