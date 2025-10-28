import { useState, useEffect } from 'react';
// import { Aptos, Network } from '@aptos-labs/ts-sdk';

export interface WalletAccount {
  address: string;
  publicKey: string;
}

export const useWallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const aptos = new Aptos(Network.DEVNET);

  // Check if Petra wallet is installed
  const isPetraInstalled = () => {
    return typeof window !== 'undefined' && (
      (window as any).petra || 
      (window as any).aptos || 
      (window as any).martian
    );
  };

  // Connect to Petra or any Aptos wallet
  const connect = async () => {
    if (!isPetraInstalled()) {
      setError('Petra wallet is not installed. Please install it from https://petra.app');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let response;
      if ((window as any).petra) {
        response = await (window as any).petra.connect();
      } else if ((window as any).aptos) {
        response = await (window as any).aptos.connect();
      } else if ((window as any).martian) {
        response = await (window as any).martian.connect();
      }
      
      if (response) {
        setAccount({
          address: response.address,
          publicKey: response.publicKey
        });
        setIsConnected(true);
        console.log('Wallet connected:', response);
      }
    } catch (err) {
      console.error('Wallet connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnect = async () => {
    try {
      await (window as any).petra.disconnect();
      setAccount(null);
      setIsConnected(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to disconnect wallet');
    }
  };

  // Sign and send transaction
  const signAndSendTransaction = async (payload: any) => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      if ((window as any).petra?.signAndSubmitTransaction) {
        return await (window as any).petra.signAndSubmitTransaction(payload);
      }
      if ((window as any).aptos?.signAndSubmitTransaction) {
        return await (window as any).aptos.signAndSubmitTransaction(payload);
      }
      if ((window as any).martian?.signAndSubmitTransaction) {
        return await (window as any).martian.signAndSubmitTransaction(payload);
      }
      throw new Error('No compatible wallet found');
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Transaction failed');
    }
  };

  // Check connection status on mount
  useEffect(() => {
    const checkConnection = async () => {
      console.log('Checking wallet connection...');
      console.log('Window objects:', {
        petra: !!(window as any).petra,
        aptos: !!(window as any).aptos,
        martian: !!(window as any).martian
      });
      
      if (isPetraInstalled()) {
        try {
          let response;
          if ((window as any).petra) {
            response = await (window as any).petra.isConnected();
            if (response) {
              const account = await (window as any).petra.account();
              setAccount({
                address: account.address,
                publicKey: account.publicKey
              });
              setIsConnected(true);
              console.log('Petra wallet already connected:', account);
            }
          }
        } catch (err) {
          console.log('Wallet not connected:', err);
        }
      }
    };

    checkConnection();
  }, []);

  // Network mismatch detection (Devnet by default)
  const expectedNetwork = (import.meta as any).env?.VITE_APTOS_NETWORK || 'devnet';
  const getCurrentNetwork = async (): Promise<string | null> => {
    try {
      if ((window as any).petra?.network) {
        const net = await (window as any).petra.network();
        return (net?.name || '').toLowerCase();
      }
      if ((window as any).aptos?.network) {
        const net = await (window as any).aptos.network();
        return (net?.name || '').toLowerCase();
      }
    } catch {}
    return null;
  };

  return {
    isConnected,
    account,
    isLoading,
    error,
    connect,
    disconnect,
    signAndSendTransaction,
    isPetraInstalled: isPetraInstalled(),
    getCurrentNetwork,
    expectedNetwork
  };
};

// Extend Window interface for Petra
declare global {
  interface Window {
    petra?: {
      connect: () => Promise<{ address: string; publicKey: string }>;
      disconnect: () => Promise<void>;
      isConnected: () => Promise<boolean>;
      account: () => Promise<{ address: string; publicKey: string }>;
      signAndSubmitTransaction: (payload: any) => Promise<any>;
    };
  }
}
