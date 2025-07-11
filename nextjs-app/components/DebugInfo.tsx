'use client';

import { useAccount, useChainId } from 'wagmi';
import { sepolia } from 'wagmi/chains';

export function DebugInfo() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const chainId = useChainId();

  return (
    <div className="glass-card mb-8">
      <h3 className="text-lg font-bold mb-3">🔍 Debug Information</h3>

      <div className="space-y-2 text-sm">
        <div className="flex gap-2">
          <span className="font-semibold">Connection Status:</span>
          {isConnecting && <span className="text-yellow-400">🔄 Connecting...</span>}
          {isConnected && <span className="text-green-400">✅ Connected</span>}
          {isDisconnected && <span className="text-red-400">❌ Disconnected</span>}
        </div>

        <div className="flex gap-2">
          <span className="font-semibold">Wallet Address:</span>
          <span className="font-mono text-gray-300">
            {address ? address : 'Not connected'}
          </span>
        </div>

        <div className="flex gap-2">
          <span className="font-semibold">Current Chain ID:</span>
          <span className={chainId === sepolia.id ? 'text-green-400' : 'text-red-400'}>
            {chainId || 'Unknown'}
            {chainId === sepolia.id ? ' (Sepolia ✅)' : ' ⚠️ Wrong network!'}
          </span>
        </div>

        <div className="flex gap-2">
          <span className="font-semibold">Expected Chain:</span>
          <span className="text-gray-300">
            {sepolia.id} (Sepolia)
          </span>
        </div>

        {chainId && chainId !== sepolia.id && (
          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 font-semibold">⚠️ Wrong Network!</p>
            <p className="text-sm text-gray-300 mt-1">
              Please switch to Sepolia testnet in your wallet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
