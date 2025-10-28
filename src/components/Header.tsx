import React from 'react';
import { Sparkles, Zap, Shield, AlertTriangle } from 'lucide-react';
import { WalletButton } from './WalletButton';
import { useWallet } from '../hooks/useWallet';

export const Header: React.FC = () => {
  const { getCurrentNetwork, expectedNetwork } = useWallet();
  const [mismatch, setMismatch] = React.useState<string | null>(null);

  React.useEffect(() => {
    const check = async () => {
      const current = await getCurrentNetwork?.();
      if (current && current !== expectedNetwork) {
        setMismatch(current);
      } else {
        setMismatch(null);
      }
    };
    check();
  }, [getCurrentNetwork, expectedNetwork]);
  return (
    <header className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-accent-500 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-ping"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Shelby Notes</h1>
              <p className="text-xs text-white/60">Anonymous & Live Note Board</p>
            </div>
          </div>

          {/* Features */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-white/70">
              <Zap className="w-4 h-4 text-accent-500" />
              <span className="text-sm">Fast Access</span>
            </div>
            <div className="flex items-center space-x-2 text-white/70">
              <Shield className="w-4 h-4 text-primary-500" />
              <span className="text-sm">Decentralized</span>
            </div>
          </div>

          {/* Wallet Button */}
          <div className="flex items-center space-x-3">
            {mismatch && (
              <div className="hidden md:flex items-center space-x-2 text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs">Network: {mismatch} (expected {expectedNetwork})</span>
              </div>
            )}
            <WalletButton />
          </div>
        </div>
      </div>
    </header>
  );
};
