import React, { useState, useEffect } from 'react';
import { H5PPackage } from './types/h5p';
import { parseH5PFile, fetchH5PFromUrl, revokeAssets } from './lib/h5pParser';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { Toolbar } from './components/Toolbar';
import { DocumentViewer } from './components/DocumentViewer';

export const App: React.FC = () => {
  const [packages, setPackages] = useState<H5PPackage[]>([]);
  const [activePkgIndex, setActivePkgIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFilesLoaded = async (files: File[]) => {
    if (files.length === 0) return;
    try {
      setIsLoading(true);
      setError(null);

      const parsedList: H5PPackage[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setLoadingMessage(
          files.length > 1
            ? `Parsing module ${i + 1} of ${files.length}: ${file.name}...`
            : `Parsing package structure & extracting slides...`
        );
        try {
          const parsed = await parseH5PFile(file);
          parsedList.push(parsed);
        } catch (itemErr: any) {
          console.error(`Error parsing ${file.name}:`, itemErr);
        }
      }

      if (parsedList.length === 0) {
        throw new Error('Failed to read any valid .h5p archives from the selected file(s).');
      }

      setPackages((prev) => {
        // If already had packages, append them; otherwise replace
        if (prev.length > 0) {
          return [...prev, ...parsedList];
        }
        return parsedList;
      });
      setActivePkgIndex(() => (packages.length > 0 ? packages.length : 0));
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to read H5P file. Please verify it is a valid .h5p archive.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleUrlLoaded = async (url: string) => {
    try {
      setIsLoading(true);
      setLoadingMessage('Fetching H5P package from URL...');
      setError(null);

      const parsedPkg = await fetchH5PFromUrl(url);
      setPackages((prev) => [...prev, parsedPkg]);
      setActivePkgIndex(packages.length);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load H5P from URL.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Support ?url= or ?h5p= in query string
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url') || params.get('h5p');
    if (urlParam) {
      handleUrlLoaded(urlParam);
    }
  }, []);

  const handleSelectPackage = (index: number) => {
    if (index >= 0 && index < packages.length) {
      setActivePkgIndex(index);
    }
  };

  const handleRemovePackage = (index: number) => {
    const targetPkg = packages[index];
    if (targetPkg?.assetMap) {
      revokeAssets(targetPkg.assetMap);
    }

    const nextPackages = packages.filter((_, i) => i !== index);
    setPackages(nextPackages);

    if (nextPackages.length === 0) {
      setActivePkgIndex(0);
    } else if (activePkgIndex >= nextPackages.length) {
      setActivePkgIndex(nextPackages.length - 1);
    }
  };

  const handleResetAll = () => {
    packages.forEach((p) => {
      if (p.assetMap) {
        revokeAssets(p.assetMap);
      }
    });
    setPackages([]);
    setActivePkgIndex(0);
    setError(null);
  };

  const currentPkg = packages[activePkgIndex] || null;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <Header />

      <main className="flex-1">
        {packages.length === 0 || !currentPkg ? (
          <DropZone
            onFilesLoaded={handleFilesLoaded}
            onUrlLoaded={handleUrlLoaded}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            error={error}
          />
        ) : (
          <div>
            <Toolbar
              packages={packages}
              activePkgIndex={activePkgIndex}
              onSelectPackage={handleSelectPackage}
              onRemovePackage={handleRemovePackage}
              onAddFiles={handleFilesLoaded}
              onResetAll={handleResetAll}
            />
            <DocumentViewer
              pkg={currentPkg}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
