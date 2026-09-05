import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useVirtualizer } from "@tanstack/react-virtual";
import { ChevronUp, File, Folder, Link2, Loader2 } from "lucide-react";

type DirEntry = {
  name: string;
  path: string;
  is_dir: boolean;
  is_symlink: boolean;
  size: number | null;
  modified_ms: number | null;
};

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const idx = Math.min(i, units.length - 1);
  const val = bytes / 1024 ** idx;
  const digits = val >= 100 ? 0 : 1;
  return `${val.toFixed(digits)} ${units[idx]}`;
}

function FileIcon({ isDir }: { isDir: boolean }) {
  return (
    <span className="size-4 shrink-0 text-stone-500">
      {isDir ? <Folder size={14} strokeWidth={1.75} /> : <File size={14} strokeWidth={1.75} />}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="h-7 bg-stone-800/50 rounded-sm animate-pulse" />
  );
}

function EmptyState({ onUp }: { onUp: () => void }) {
  return (
    <div className="px-2 py-8 text-center">
      <p className="text-[13px] text-stone-500">Empty folder</p>
      <button
        type="button"
        onClick={onUp}
        className="mt-2 text-[12px] text-stone-400 hover:text-stone-200 underline underline-offset-2"
      >
        Go up
      </button>
    </div>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border-l-2 border-red-500/50 bg-red-500/10 px-2 py-1.5">
      <div className="flex items-center gap-2 text-[12px]">
        <span className="text-red-400">Error:</span>
        <code className="flex-1 break-all text-stone-300 font-mono">{message}</code>
        <button
          type="button"
          onClick={onRetry}
          className="text-red-400 hover:text-red-300 underline underline-offset-1"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function isStale(current: number, id: number): boolean {
  return id !== current;
}

function canGoUp(path: string): boolean {
  if (!path) return false;
  if (path === "/") return false;
  return true;
}

function DirRow({ entry, onOpen }: { entry: DirEntry; onOpen: (p: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(entry.path)}
      className="group w-full flex h-7 items-center gap-1.5 px-2 text-left text-[13px] rounded-sm cursor-pointer hover:bg-stone-800/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-stone-300/30"
    >
      <FileIcon isDir />
      <span className="truncate font-medium text-stone-100">{entry.name}</span>
      {entry.is_symlink && (
        <Link2 size={12} className="text-stone-500 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}

function FileRow({ entry }: { entry: DirEntry }) {
  return (
    <div className="group w-full flex h-7 items-center gap-1.5 px-2 text-[13px] rounded-sm cursor-pointer hover:bg-stone-800/60">
      <FileIcon isDir={false} />
      <span className="truncate text-stone-300" title={entry.name}>{entry.name}</span>
      {entry.is_symlink && (
        <Link2 size={12} className="text-stone-500 shrink-0" aria-hidden="true" />
      )}
      {entry.size !== null && (
        <span className="ml-auto text-stone-500 font-mono text-[11px] shrink-0 whitespace-nowrap">
          {formatBytes(entry.size)}
        </span>
      )}
    </div>
  );
}

function EntryRow({ entry, onOpen }: { entry: DirEntry; onOpen: (p: string) => void }) {
  if (entry.is_dir) return <DirRow entry={entry} onOpen={onOpen} />;
  return <FileRow entry={entry} />;
}

export default function App() {
  const [path, setPath] = useState("");
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const gen = useRef(0);

  const openDir = useCallback(async (next: string) => {
    const id = ++gen.current;
    setLoading(true);
    setError("");
    try {
      const list = await invoke<DirEntry[]>("list_dir", { path: next });
      if (isStale(gen.current, id)) return;
      setPath(next);
      setEntries(list);
    } catch (e) {
      if (isStale(gen.current, id)) return;
      setError(String(e));
    } finally {
      if (!isStale(gen.current, id)) setLoading(false);
    }
  }, []);

  const goUp = useCallback(async () => {
    if (!path) return;
    const parent = await invoke<string | null>("parent_dir", { path });
    if (parent) openDir(parent);
  }, [path, openDir]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const home = await invoke<string>("home_dir");
        if (!cancelled) openDir(home);
      } catch (e) {
        if (!cancelled) setError(String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [openDir]);

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 16,
  });

  const showUp = canGoUp(path);
  const showSkeleton = loading && entries.length === 0;
  const showEmpty = !loading && !error && entries.length === 0;
  const showList = entries.length > 0;
  const hasError = error !== "";

  return (
    <div className="h-screen flex flex-col bg-stone-950 text-stone-100 overflow-hidden">
      <header className="h-8 shrink-0 flex items-center gap-2 px-2 border-b border-stone-800 bg-stone-950">
        <button
          type="button"
          onClick={goUp}
          disabled={!showUp}
          className="size-6 flex items-center justify-center rounded-sm text-stone-400 hover:text-stone-100 hover:bg-stone-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Go up"
        >
          <ChevronUp size={14} />
        </button>
        <span className="truncate text-[13px] text-stone-400 font-normal" title={path}>
          {path || "—"}
        </span>
        {loading && <Loader2 size={12} className="animate-spin text-stone-500 shrink-0 ml-auto" />}
      </header>

      {hasError ? (
        <ErrorBanner message={error} onRetry={() => (path ? openDir(path) : openDir("/"))} />
      ) : null}

      <div ref={parentRef} className="flex-1 overflow-auto min-h-0">
        {showSkeleton ? (
          <div className="px-2 py-2 space-y-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : null}

        {showEmpty ? <EmptyState onUp={goUp} /> : null}

        {showList ? (
          <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
            {virtualizer.getVirtualItems().map((v) => {
              const e = entries[v.index];
              return (
                <div
                  key={e.path}
                  data-index={v.index}
                  className="absolute left-0 top-0 w-full px-1"
                  style={{ transform: `translateY(${v.start}px)`, height: v.size }}
                >
                  <EntryRow entry={e} onOpen={openDir} />
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}