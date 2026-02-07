import { useCallback, useEffect, useMemo, useState } from 'react';

export interface UsePluginsReturn {
  plugins: PluginInfo[];
  loading: boolean;
  executeCapability: (capability: string, filePath: string) => Promise<PluginExecuteResponse>;
  setPriority: (pluginId: string, priority: number, options?: { skipRefresh?: boolean }) => Promise<void>;
  togglePlugin: (pluginId: string, enabled: boolean) => Promise<void>;
  refresh: () => Promise<void>;
}

const emptyResponse: PluginExecuteResponse = {
  success: false,
  error: 'Plugins unavailable',
};

export function usePlugins(): UsePluginsReturn {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const canUsePlugins = useMemo(() => Boolean(window.plugins), []);

  const refresh = useCallback(async () => {
    if (!window.plugins) {
      setPlugins([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const response = await window.plugins.list();
    if (response.success && response.plugins) {
      setPlugins(response.plugins);
    } else {
      setPlugins([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const executeCapability = useCallback(
    async (capability: string, filePath: string): Promise<PluginExecuteResponse> => {
      if (!window.plugins) return emptyResponse;
      return window.plugins.execute({ capability, filePath });
    },
    []
  );

  const setPriority = useCallback(
    async (pluginId: string, priority: number, options?: { skipRefresh?: boolean }) => {
    if (!window.plugins) return;
    await window.plugins.setPriority({ pluginId, priority });
    if (!options?.skipRefresh) {
      await refresh();
    }
  }, [refresh]);

  const togglePlugin = useCallback(async (pluginId: string, enabled: boolean) => {
    if (!window.plugins) return;
    await window.plugins.toggle({ pluginId, enabled });
    await refresh();
  }, [refresh]);

  return { plugins, loading: loading && canUsePlugins, executeCapability, setPriority, togglePlugin, refresh };
}
