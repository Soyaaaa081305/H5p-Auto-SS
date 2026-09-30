import { useState, useEffect, useRef } from "react";
import type { H5PPackage } from "./types/h5p";
import { parseH5PFile } from "./lib/h5pParser";
import { Header } from "./components/Header";
import { DropZone } from "./components/DropZone";
import { Toolbar } from "./components/Toolbar";
import { DocumentViewer } from "./components/DocumentViewer";

export default function App() {
  const [packages, setPackages] = useState<H5PPackage[]>([]);
  const [active, setActive] = useState<H5PPackage>();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState<string | null>(null);
  const generation = useRef(0);
  const controller = useRef<AbortController>();
  const current = useRef(packages);
  current.current = packages;

  useEffect(
    () => () => {
      generation.current++;
      controller.current?.abort();
      current.current.forEach((p) => p.dispose());
    },
    [],
  );

  // Warn user before leaving or refreshing the site if H5P packages are active
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (packages.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [packages.length]);

  async function importFiles(files: File[]) {
    if (controller.current || !files.length) return;
    const importGeneration = generation.current;
    const job = new AbortController();
    controller.current = job;
    setError(null);
    const successes: H5PPackage[] = [];
    let failures = 0;

    try {
      const count = files.length;
      for (let i = 0; i < count; i++) {
        job.signal.throwIfAborted();
        setLoading(`Reading module ${i + 1} of ${count}…`);
        try {
          successes.push(await parseH5PFile(files[i], undefined, job.signal));
        } catch (e) {
          if (job.signal.aborted) throw e;
          failures++;
        }
      }
      if (failures) {
        setError(
          `${failures} file(s) could not be imported. Check that they are valid, unencrypted H5P or ZIP packages within the documented limits. Successful imports were kept.`,
        );
      }
    } catch {
      setError("Import cancelled. Completed imports were kept.");
    } finally {
      if (generation.current !== importGeneration) {
        successes.forEach((p) => p.dispose());
        controller.current = undefined;
        return;
      }
      if (successes.length) {
        setPackages((prev) => [...prev, ...successes]);
        setActive(successes[0]);
      }
      setLoading("");
      controller.current = undefined;
    }
  }

  const selected = active && packages.includes(active) ? active : packages[0];

  function remove(index: number) {
    const target = packages[index];
    target?.dispose();
    const remaining = packages.filter((p) => p !== target);
    setPackages(remaining);
    if (selected === target) {
      setActive(remaining[Math.min(index, remaining.length - 1)]);
    }
  }

  function reset() {
    generation.current++;
    controller.current?.abort();
    setLoading("");
    packages.forEach((p) => p.dispose());
    setPackages([]);
    setActive(undefined);
    setError(null);
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header />
      <main className="flex-1">
        {loading && (
          <div role="status" className="p-3 text-center text-sm">
            {loading}{" "}
            <button
              className="underline ml-3"
              onClick={() => controller.current?.abort()}
            >
              Cancel import
            </button>
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="p-3 text-center text-sm text-amber-700 dark:text-amber-400"
          >
            {error}
          </p>
        )}
        {selected ? (
          <>
            <Toolbar
              packages={packages}
              activePkgIndex={packages.indexOf(selected)}
              onSelectPackage={(i) => setActive(packages[i])}
              onRemovePackage={remove}
              onAddFiles={(files) => importFiles(files)}
              onResetAll={reset}
            />
            <DocumentViewer key={packages.indexOf(selected)} pkg={selected} />
          </>
        ) : (
          <DropZone
            onFilesLoaded={(files) => importFiles(files)}
            isLoading={!!loading}
            loadingMessage={loading}
          />
        )}
      </main>
    </div>
  );
}
