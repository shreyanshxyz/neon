import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useVirtualizer } from "@tanstack/react-virtual";

type DirEntry = {
  name: string;
  path: string;
  is_dir: boolean;
  is_symlink: boolean;
  size: number | null;
  modified_ms: number | null;
};

export default function App() {
  const [path, setPath] = useState<string>("");
  const [entries, setEntries] = useState<DirEntry[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const gen = useRef(0);

  const openDir = useCallback(async (next: string) => {
    const id = ++gen.current;
    setLoading(true);
    setError("");
    try {
      const list = await invoke<DirEntry[]>("list_dir", { path: next });
      if (id !== gen.current) return; // stale
      setPath(next);
      setEntries(list);
    } catch (e) {
      if (id !== gen.current) return;
      setError(String(e));
    } finally {
      if (id === gen.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const home = await invoke<string>("home_dir");
      if (!cancelled) openDir(home);
    })();
    return () => {
      cancelled = true;
    };
  }, [openDir]);

  useEffect(() => {
    invoke<string>("home_dir").then(openDir).catch((e) => setError(String(e)));
  }, [openDir]);

  async function goUp() {
    const parent = await invoke<string | null>("parent_dir", { path });
    if (parent) openDir(parent);
  }

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: entries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28,
    overscan: 12,
  });

  return (
    <main>
      <div>
        <button type="button" onClick={goUp} disabled={!path}>
          Up
        </button>
        <span> {path}</span>
        {loading ? <span> …</span> : null}
      </div>
      {error ? <pre>{error}</pre> : null}
      <div
        ref={parentRef}
        style={{ height: "80vh", overflow: "auto" }}
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((v) => {
            const e = entries[v.index];
            return (
              <div
                key={e.path}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: v.size,
                  transform: `translateY(${v.start}px)`,
                }}
              >
                {e.is_dir ? (
                  <button type="button" onClick={() => openDir(e.path)}>
                    [{e.name}]
                  </button>
                ) : (
                  <span>
                    {e.name}
                    {e.size != null ? `  ${e.size}` : ""}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </main>
  );
}
