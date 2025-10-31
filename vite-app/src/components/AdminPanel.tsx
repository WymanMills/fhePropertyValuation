import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract'

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void
}

export default function AdminPanel({ showToast }: Props) {
  const { address } = useAccount()
  const [valuatorAddress, setValuatorAddress] = useState('')

  const { writeContract: authorize, data: authHash, isPending: isAuthPending } = useWriteContract()
  const { writeContract: revoke, data: revokeHash, isPending: isRevokePending } = useWriteContract()
  const { isLoading: isAuthConfirming } = useWaitForTransactionReceipt({ hash: authHash })
  const { isLoading: isRevokeConfirming } = useWaitForTransactionReceipt({ hash: revokeHash })

  const handleAuthorize = async () => {
    if (!address) {
      showToast('Please connect your wallet first', 'error')
      return
    }
    if (!valuatorAddress) {
      showToast('Please enter a valuator address', 'error')
      return
    }

    try {
      authorize({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'authorizeValuator',
        args: [valuatorAddress as `0x${string}`],
      })
    } catch (err: any) {
      showToast(err.message || 'Failed to authorize valuator', 'error')
    }
  }

  const handleRevoke = async () => {
    if (!address) {
      showToast('Please connect your wallet first', 'error')
      return
    }
    if (!valuatorAddress) {
      showToast('Please enter a valuator address', 'error')
      return
    }

    try {
      revoke({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'revokeValuator',
        args: [valuatorAddress as `0x${string}`],
      })
    } catch (err: any) {
      showToast(err.message || 'Failed to revoke valuator', 'error')
    }
  }

  if (authHash && !isAuthConfirming) {
    showToast('Valuator authorized successfully!')
    setValuatorAddress('')
  }

  if (revokeHash && !isRevokeConfirming) {
    showToast('Valuator revoked successfully!')
    setValuatorAddress('')
  }

  return (
    <div className="glass-card">
      <h2 className="section-title">⚙️ Admin Functions</h2>
      <div className="info-text mb-4">
        Contract owner can manage valuator authorizations.
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Valuator Address:</label>
          <input
            type="text"
            value={valuatorAddress}
            onChange={(e) => setValuatorAddress(e.target.value)}
            className="form-input"
            placeholder="0x..."
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleAuthorize}
            disabled={!address || isAuthPending || isAuthConfirming}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAuthPending || isAuthConfirming ? 'Authorizing...' : 'Authorize'}
          </button>
          <button
            onClick={handleRevoke}
            disabled={!address || isRevokePending || isRevokeConfirming}
            className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRevokePending || isRevokeConfirming ? 'Revoking...' : 'Revoke'}
          </button>
        </div>
      </div>
    </div>
  )
}
