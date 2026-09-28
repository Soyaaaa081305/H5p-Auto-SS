import React, { useState, useEffect } from 'react';
import { H5PPackage } from './types/h5p';
import { parseH5PFile, fetchH5PFromUrl, revokeAssets } from './lib/h5pParser';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { Toolbar } from './components/Toolbar';
import { DocumentViewer } from './components/DocumentViewer';

export const App: React.FC = () => {
  const [pkg, setPkg] = useState<H5PPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileLoaded = async (file: File | Blob, customName?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (pkg?.assetMap) {
        revokeAssets(pkg.assetMap);
      }

      const parsedPkg = await parseH5PFile(file, customName);
      setPkg(parsedPkg);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to read H5P file. Please verify it is a valid .h5p archive.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlLoaded = async (url: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (pkg?.assetMap) {
        revokeAssets(pkg.assetMap);
      }

      const parsedPkg = await fetchH5PFromUrl(url);
      setPkg(parsedPkg);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load H5P from URL.');
    } finally {
      setIsLoading(false);
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

  const handleReset = () => {
    if (pkg?.assetMap) {
      revokeAssets(pkg.assetMap);
    }
    setPkg(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 text-zinc-900">
      <Header />

      <main className="flex-1">
        {!pkg ? (
          <DropZone
            onFileLoaded={handleFileLoaded}
            onUrlLoaded={handleUrlLoaded}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <div>
            <Toolbar
              pkg={pkg}
              onReset={handleReset}
            />
            <DocumentViewer
              pkg={pkg}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
