'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useBlockNumber } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

export function ViewProperties() {
  const { address } = useAccount();
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const { data: properties, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getOwnerProperties',
    args: address ? [address] : undefined,
  });

  // Auto-refresh when new blocks are mined (in case user registered a property)
  useEffect(() => {
    if (address && hasLoaded && blockNumber) {
      refetch();
    }
  }, [blockNumber, address, hasLoaded, refetch]);

  const handleLoad = async () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    setLoading(true);
    try {
      await refetch();
      setHasLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        📊 View My Properties
      </h2>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-sm text-blue-200">
        <p className="font-semibold mb-1">🏢 Your Property Portfolio</p>
        <p>View all properties you've registered. Click "Load" to fetch from blockchain.</p>
        {hasLoaded && (
          <p className="text-xs text-green-300 mt-2">
            ✨ Auto-refreshing: Updates automatically when new blocks are mined
          </p>
        )}
      </div>

      {!address && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4 text-sm text-yellow-200">
          ⚠️ Please connect your wallet to view your properties
        </div>
      )}

      <button
        onClick={handleLoad}
        className="btn-primary w-full mb-4"
        disabled={!address || loading}
      >
        {loading ? '⏳ Loading...' : hasLoaded ? '🔄 Refresh My Properties' : '📥 Load My Properties'}
      </button>

      {hasLoaded && properties && (
        <div className="space-y-3">
          {(properties as bigint[]).length === 0 ? (
            <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-6 text-center">
              <p className="text-gray-400 mb-2">📭 No properties found</p>
              <p className="text-xs text-gray-500">
                Register your first property using the form above
              </p>
            </div>
          ) : (
            <>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
                <p className="text-sm text-green-300">
                  ✅ Found <strong>{(properties as bigint[]).length}</strong> {(properties as bigint[]).length === 1 ? 'property' : 'properties'}
                </p>
              </div>
              {(properties as bigint[]).map((id, index) => (
                <div
                  key={id.toString()}
                  className="bg-accent/10 border border-accent/20 rounded-lg p-4 hover:border-accent/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-lg text-white">Property #{id.toString()}</h4>
                      <p className="text-xs text-gray-400 mt-1">
                        Registered #{index + 1} in your portfolio
                      </p>
                    </div>
                    <span className="text-2xl">🏠</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-sm text-gray-300">
                      <strong>Owner:</strong> <span className="text-green-300">You</span>
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                      <strong>Status:</strong> <span className="text-blue-300">Active</span>
                    </p>
                  </div>
                  <div className="mt-3 bg-blue-500/10 rounded-lg p-2">
                    <p className="text-xs text-blue-200">
                      💡 Use this Property ID ({id.toString()}) to submit valuations or query averages
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {!hasLoaded && address && (
        <div className="text-center text-gray-500 py-6 text-sm">
          👆 Click "Load My Properties" to fetch your registered properties
        </div>
      )}
    </div>
  );
}
