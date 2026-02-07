import { useMemo, useState } from 'react';
import { Plug, Power, AlertCircle } from 'lucide-react';
import { usePlugins } from '../../hooks/usePlugins';

interface DragState {
  draggingId: string | null;
}

export default function PluginManager() {
  const { plugins, loading, setPriority, togglePlugin, refresh } = usePlugins();
  const [dragState, setDragState] = useState<DragState>({ draggingId: null });

  const orderedPlugins = useMemo(() => {
    return [...plugins].sort((a, b) => b.priority - a.priority);
  }, [plugins]);

  const handleDragStart = (pluginId: string) => {
    setDragState({ draggingId: pluginId });
  };

  const handleDrop = async (targetId: string) => {
    if (!dragState.draggingId || dragState.draggingId === targetId) return;
    const sourceIndex = orderedPlugins.findIndex((plugin) => plugin.id === dragState.draggingId);
    const targetIndex = orderedPlugins.findIndex((plugin) => plugin.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const updated = [...orderedPlugins];
    const [moved] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, moved);

    const basePriority = 100;
    for (let i = 0; i < updated.length; i += 1) {
      const plugin = updated[i];
      const nextPriority = basePriority - i;
      if (plugin.priority !== nextPriority) {
        await setPriority(plugin.id, nextPriority, { skipRefresh: true });
      }
    }
    await refresh();
    setDragState({ draggingId: null });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted text-sm">
        Loading plugins...
      </div>
    );
  }

  if (orderedPlugins.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted text-sm">
        <Plug className="w-10 h-10 mb-2 text-text-muted" />
        No plugins found
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 overflow-auto h-full">
      {orderedPlugins.map((plugin) => {
        const capabilitySummary = Object.entries(plugin.capabilities || {})
          .map(([key, value]) => `${key} (${value.fileTypes.join(', ')})`)
          .join(' • ');

        return (
          <div
            key={plugin.id}
            draggable
            onDragStart={() => handleDragStart(plugin.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(plugin.id)}
            className={`border rounded-lg p-3 space-y-2 transition-colors ${
              dragState.draggingId === plugin.id ? 'border-accent-primary/60 bg-bg-hover' : 'border-border'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plug className="w-4 h-4 text-accent-primary" />
                <div>
                  <div className="text-sm text-text-primary">{plugin.name}</div>
                  <div className="text-xs text-text-muted">
                    v{plugin.version}
                    {plugin.author ? ` • ${plugin.author}` : ''}
                  </div>
                </div>
              </div>
              <button
                onClick={() => togglePlugin(plugin.id, !plugin.enabled)}
                className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  plugin.enabled
                    ? 'bg-green-500/15 text-green-300'
                    : 'bg-red-500/10 text-red-300'
                }`}
              >
                <Power className="w-3 h-3" />
                {plugin.enabled ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div className="text-xs text-text-muted">{plugin.description}</div>

            <div className="text-xs text-text-secondary">Capabilities: {capabilitySummary || 'None'}</div>

            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Priority: {plugin.priority}</span>
              {plugin.lastError && (
                <span className="flex items-center gap-1 text-red-300">
                  <AlertCircle className="w-3 h-3" />
                  {plugin.lastError}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
