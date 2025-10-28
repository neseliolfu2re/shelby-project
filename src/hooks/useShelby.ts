import { useState, useEffect } from 'react';
import { ShelbyConfig } from '../types';

export const useShelby = (config: ShelbyConfig) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const baseUrl = import.meta.env.VITE_SHELBY_BASE_URL || 'https://api.shelby.example/shelby/account';
  const downloadBaseUrl = import.meta.env.VITE_SHELBY_DOWNLOAD_BASE_URL || 'https://cdn.shelby.example/shelby/account/blobs';

  // Upload text content as a file to Shelby
  const uploadFile = async (_content: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${baseUrl}/blobs/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ content: _content })
      });
      if (!res.ok) throw new Error(`Shelby upload failed: ${res.status}`);
      const data = await res.json();
      const hash = data.hash as string;
      setIsConnected(true);
      return hash;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (hash: string): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch(`${baseUrl}/blobs/${encodeURIComponent(hash)}/text`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
        }
      });
      if (!res.ok) throw new Error(`Shelby download failed: ${res.status}`);
      const data = await res.json();
      return data.content as string;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initialize Shelby connection with API key
    if (config.apiKey) {
      console.log('Shelby initialized with API key:', config.apiKey);
      setIsConnected(true);
    }
  }, [config]);

  return {
    isConnected,
    isLoading,
    error,
    uploadFile,
    downloadFile,
    uploadBlob: async (file: Blob): Promise<string> => {
      setIsLoading(true);
      setError(null);
      try {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`${baseUrl}/blobs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: form
        });
        if (!res.ok) throw new Error(`Shelby blob upload failed: ${res.status}`);
        const data = await res.json();
        const hash = data.hash as string;
        setIsConnected(true);
        return hash;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    getDownloadUrl: (hash: string): string => {
      return `${downloadBaseUrl}/${encodeURIComponent(hash)}`;
    }
  };
};
