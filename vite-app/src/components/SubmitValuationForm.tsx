import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract'

interface Props {
  showToast: (message: string, type?: 'success' | 'error') => void
}

export default function SubmitValuationForm({ showToast }: Props) {
  const { address } = useAccount()
  const [propertyId, setPropertyId] = useState('')
  const [amount, setAmount] = useState('')
  const [confidence, setConfidence] = useState('')

  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({ hash })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!address) {
      showToast('Please connect your wallet first', 'error')
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'submitValuation',
        args: [BigInt(propertyId), BigInt(amount), parseInt(confidence)],
      })
    } catch (err: any) {
      showToast(err.message || 'Failed to submit valuation', 'error')
    }
  }

  if (hash && !isConfirming && !error) {
    showToast(`Valuation submitted! Transaction: ${hash.substring(0, 10)}...`)
    setPropertyId('')
    setAmount('')
    setConfidence('')
  }

  return (
    <div className="glass-card">
      <h2 className="section-title">💰 Submit Valuation</h2>
      <div className="info-text mb-4">
        Authorized valuators can submit encrypted property valuations.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Property ID:</label>
          <input
            type="number"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="form-input"
            min="1"
            placeholder="e.g., 1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Estimated Value (USD):</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="form-input"
            min="1"
            placeholder="e.g., 500000"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Confidence Score (1-100):</label>
          <input
            type="number"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            className="form-input"
            min="1"
            max="100"
            placeholder="e.g., 90"
            required
          />
        </div>

        <button
          type="submit"
          disabled={!address || isPending || isConfirming}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? 'Submitting...' : 'Submit Valuation'}
        </button>

        {error && <div className="text-error text-sm">Error: {error.message}</div>}
      </form>
    </div>
  )
}
