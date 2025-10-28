import type React from 'react';
import { Wallet, LogOut, User } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export const WalletButton: React.FC = () => {
  const { 
    isConnected, 
    account, 
    isLoading, 
    // error, 
    connect, 
    disconnect, 
    isPetraInstalled 
  } = useWallet();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isPetraInstalled) {
    return (
      <a
        href="https://petra.app"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary flex items-center space-x-2"
      >
        <Wallet className="w-4 h-4" />
        <span>Install Petra</span>
      </a>
    );
  }

  if (isConnected && account) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
          <User className="w-4 h-4 text-white/70" />
          <span className="text-white/90 font-mono text-sm">
            {formatAddress(account.address)}
          </span>
        </div>
        <button
          onClick={disconnect}
          className="btn-secondary flex items-center space-x-2"
          disabled={isLoading}
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={isLoading}
      className="btn-primary flex items-center space-x-2 disabled:opacity-50"
    >
      <Wallet className="w-4 h-4" />
      <span>{isLoading ? 'Connecting...' : 'Connect Wallet'}</span>
    </button>
  );
};
