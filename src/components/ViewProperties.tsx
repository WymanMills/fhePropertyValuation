import { useState } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../contract'

export default function ViewProperties() {
  const { address } = useAccount()
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data: properties, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getOwnerProperties',
    args: address ? [address] : undefined,
    query: {
      enabled: shouldFetch && !!address,
    },
  })

  const handleLoadProperties = () => {
    if (!address) {
      alert('Please connect your wallet first')
      return
    }
    setShouldFetch(true)
  }

  return (
    <div className="glass-card">
      <h2 className="section-title">📊 View Properties</h2>
      <div className="info-text mb-4">
        View properties you own and their valuation history.
      </div>

      <button
        onClick={handleLoadProperties}
        disabled={!address || isLoading}
        className="btn-primary w-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Loading...' : 'Load My Properties'}
      </button>

      {error && <div className="text-error text-sm mb-4">Error: {error.message}</div>}

      {properties && (
        <div className="space-y-3">
          {(properties as bigint[]).length === 0 ? (
            <div className="info-text text-center">No properties found.</div>
          ) : (
            (properties as bigint[]).map((propertyId) => (
              <div key={propertyId.toString()} className="glass-card bg-glass/50">
                <h4 className="font-bold text-lg">Property #{propertyId.toString()}</h4>
                <p className="text-sm text-gray-400 mt-1">Property registered on blockchain</p>
                <p className="text-xs text-gray-500 mt-1">
                  <strong>Owner:</strong> You
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
