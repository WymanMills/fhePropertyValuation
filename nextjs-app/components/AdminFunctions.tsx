'use client';

import { useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

export function AdminFunctions() {
  const { address } = useAccount();
  const [valuatorAddress, setValuatorAddress] = useState('');

  const { data: authorizeHash, writeContract: authorize, isPending: isAuthorizePending } = useWriteContract();
  const { data: revokeHash, writeContract: revoke, isPending: isRevokePending } = useWriteContract();

  const { isSuccess: authorizeSuccess } = useWaitForTransactionReceipt({ hash: authorizeHash });
  const { isSuccess: revokeSuccess } = useWaitForTransactionReceipt({ hash: revokeHash });

  const handleAuthorize = () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    if (!valuatorAddress) {
      alert('Please enter a valuator address');
      return;
    }

    authorize({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'authorizeValuator',
      args: [valuatorAddress as `0x${string}`],
    });
  };

  const handleRevoke = () => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    if (!valuatorAddress) {
      alert('Please enter a valuator address');
      return;
    }

    revoke({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'revokeValuator',
      args: [valuatorAddress as `0x${string}`],
    });
  };

  if (authorizeSuccess || revokeSuccess) {
    setTimeout(() => setValuatorAddress(''), 2000);
  }

  return (
    <div className="glass-card">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        ⚙️ Admin Functions
      </h2>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-sm text-blue-200">
        Contract owner can manage valuator authorizations.
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Valuator Address</label>
          <input
            type="text"
            className="form-input font-mono text-sm"
            value={valuatorAddress}
            onChange={(e) => setValuatorAddress(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleAuthorize}
            className="btn-primary flex-1"
            disabled={!address || !valuatorAddress || isAuthorizePending}
          >
            {isAuthorizePending ? 'Authorizing...' : 'Authorize Valuator'}
          </button>

          <button
            onClick={handleRevoke}
            className="btn-secondary flex-1"
            disabled={!address || !valuatorAddress || isRevokePending}
          >
            {isRevokePending ? 'Revoking...' : 'Revoke Valuator'}
          </button>
        </div>

        {authorizeSuccess && (
          <div className="status-success">
            ✓ Valuator authorized successfully!
          </div>
        )}

        {revokeSuccess && (
          <div className="status-success">
            ✓ Valuator revoked successfully!
          </div>
        )}
      </div>
    </div>
  );
}
