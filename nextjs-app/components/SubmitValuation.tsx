'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

export function SubmitValuation() {
  const { address } = useAccount();
  const [propertyId, setPropertyId] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [confidenceScore, setConfidenceScore] = useState('');

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'submitValuation',
        args: [BigInt(propertyId), BigInt(estimatedValue), BigInt(confidenceScore)],
      });
    } catch (err: any) {
      console.error('Valuation submission failed:', err);
      let errorMsg = 'Valuation submission failed. ';
      if (err.message?.includes('Not authorized valuator')) {
        errorMsg += '\n\nYou are not authorized as a valuator. Please ask the contract owner to authorize your address first.';
      } else if (err.message?.includes('Property not active')) {
        errorMsg += '\n\nThis property is not active or does not exist.';
      }
      alert(errorMsg);
    }
  };

  if (isSuccess) {
    setTimeout(() => {
      setPropertyId('');
      setEstimatedValue('');
      setConfidenceScore('');
    }, 2000);
  }

  return (
    <div className="glass-card">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        💰 Submit Valuation
      </h2>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-sm text-blue-200">
        Authorized valuators can submit encrypted property valuations.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Property ID</label>
          <input
            type="number"
            className="form-input"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            placeholder="e.g., 1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Estimated Value (USD)</label>
          <input
            type="number"
            className="form-input"
            value={estimatedValue}
            onChange={(e) => setEstimatedValue(e.target.value)}
            placeholder="e.g., 500000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Confidence Score (1-100)</label>
          <input
            type="number"
            className="form-input"
            value={confidenceScore}
            onChange={(e) => setConfidenceScore(e.target.value)}
            placeholder="e.g., 90"
            min="1"
            max="100"
            required
          />
        </div>

        <button
          type="submit"
          className="btn-primary w-full disabled:opacity-50"
          disabled={!address || isPending || isConfirming}
        >
          {isPending ? 'Confirming...' : isConfirming ? 'Submitting...' : 'Submit Valuation'}
        </button>

        {isSuccess && (
          <div className="status-success">
            ✓ Valuation submitted successfully!
          </div>
        )}

        {error && (
          <div className="status-error text-sm">
            {error.message?.includes('Not authorized valuator')
              ? '❌ You are not authorized as a valuator. Please ask the contract owner to authorize your address.'
              : `Error: ${error.message}`}
          </div>
        )}
      </form>
    </div>
  );
}
