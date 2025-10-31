'use client';

import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

export function ValuationManagement() {
  const { address } = useAccount();
  const [propertyId, setPropertyId] = useState('');
  const [lastError, setLastError] = useState<string>('');

  const { data: avgData, refetch, isLoading, isError, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'calculateAverageValuation',
    args: propertyId ? [BigInt(propertyId)] : undefined,
  });

  const handleGetAverage = async () => {
    setLastError('');

    if (!address) {
      setLastError('Please connect your wallet first');
      return;
    }
    if (!propertyId) {
      setLastError('Please enter a property ID');
      return;
    }

    try {
      await refetch();
    } catch (err: any) {
      console.error('Error fetching average:', err);
      setLastError(err.message || 'Failed to fetch average valuation');
    }
  };

  const result = avgData as [boolean, bigint, bigint, bigint] | undefined;

  return (
    <div className="glass-card">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        🔍 Valuation Management
      </h2>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-sm text-blue-200">
        <p className="font-semibold mb-1">📊 Average Valuation Calculator</p>
        <p>View average estimates for properties (requires revealed valuations).</p>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-sm text-blue-200">
        <p className="font-semibold mb-1">ℹ️ Access Control</p>
        <p className="mb-2">Only the <strong>property owner</strong> or <strong>contract owner</strong> can view average valuations.</p>
        <details className="mt-2">
          <summary className="cursor-pointer font-semibold hover:text-blue-100 text-xs">
            📖 How to use this feature
          </summary>
          <div className="mt-2 text-xs space-y-2">
            <p><strong>Step 1:</strong> Register a property first (use "Register Property" section)</p>
            <p><strong>Step 2:</strong> Note the Property ID from the transaction</p>
            <p><strong>Step 3:</strong> Authorize yourself as a valuator (use "Admin Functions")</p>
            <p><strong>Step 4:</strong> Submit a valuation for your property</p>
            <p><strong>Step 5:</strong> Then you can query averages for your property</p>
            <p className="text-yellow-300 mt-2">⚠️ You can only view averages for properties you own!</p>
          </div>
        </details>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mb-4 text-sm text-yellow-200">
        <p className="font-semibold mb-1">💡 Why "Not authorized" error?</p>
        <p>This means the Property ID you entered either:</p>
        <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
          <li>Doesn't exist yet</li>
          <li>Belongs to someone else (you're not the owner)</li>
          <li>You're not the contract owner</li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-gray-200">
            Property ID for Average
          </label>
          <input
            type="number"
            className="form-input hover:border-[var(--accent)] transition-all"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            placeholder="e.g., 1"
            disabled={!address}
            min="1"
          />
          {!address && (
            <p className="text-xs text-gray-500 mt-1">Connect wallet first</p>
          )}
        </div>

        <button
          onClick={handleGetAverage}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!address || !propertyId || isLoading}
        >
          {isLoading ? '⏳ Loading...' : 'Get Average Valuation'}
        </button>

        {/* Connection Status */}
        {!address && (
          <div className="text-sm text-yellow-400 text-center">
            ⚠️ Please connect your wallet to use this feature
          </div>
        )}

        {address && !propertyId && (
          <div className="text-sm text-blue-400 text-center">
            👆 Enter a Property ID above to get started
          </div>
        )}

        {/* Error Display */}
        {lastError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
            <p className="font-semibold">❌ Error:</p>
            <p>{lastError}</p>
          </div>
        )}

        {isError && error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
            <p className="font-semibold mb-2">❌ Access Denied</p>
            {error.message.includes('Not authorized') ? (
              <div className="space-y-2">
                <p className="font-semibold">You can only view averages for properties you own.</p>
                <div className="text-xs bg-black/30 p-2 rounded">
                  <p className="mb-1">To test this feature:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Register a new property (scroll up)</li>
                    <li>Note the Property ID from success message</li>
                    <li>Use that Property ID here</li>
                  </ol>
                </div>
              </div>
            ) : (
              <p className="break-words text-xs">{error.message}</p>
            )}
          </div>
        )}

        {result && (
          <div>
            {result[0] ? (
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">
                  Average Valuation for Property #{propertyId}
                </h4>
                <p><strong>Average Value:</strong> ${result[1].toString()}</p>
                <p><strong>Average Confidence:</strong> {result[2].toString()}%</p>
                <p><strong>Number of Valuations:</strong> {result[3].toString()}</p>
              </div>
            ) : (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">No revealed valuations</h4>
                <p className="text-sm text-gray-400">
                  Total valuations: {result[3].toString()}
                </p>
                <p className="text-sm mt-2">
                  Valuations must be revealed before averages can be calculated.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
