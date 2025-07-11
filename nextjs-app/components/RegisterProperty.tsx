'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

export function RegisterProperty() {
  const { address } = useAccount();
  const [area, setArea] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [floorLevel, setFloorLevel] = useState('');
  const [locationScore, setLocationScore] = useState('');
  const [registeredPropertyId, setRegisteredPropertyId] = useState<bigint | null>(null);

  const { data: hash, writeContract, isPending, error: writeError } = useWriteContract();
  const { data: receipt, isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const publicClient = usePublicClient();

  // Extract Property ID from transaction receipt
  useEffect(() => {
    if (isSuccess && receipt && publicClient) {
      try {
        const logs = receipt.logs;

        // Find PropertyRegistered event
        const propertyRegisteredEvent = logs.find((log) => {
          try {
            const decoded = publicClient.decodeEventLog({
              abi: CONTRACT_ABI,
              data: log.data,
              topics: log.topics,
            });
            return decoded.eventName === 'PropertyRegistered';
          } catch {
            return false;
          }
        });

        if (propertyRegisteredEvent) {
          const decoded = publicClient.decodeEventLog({
            abi: CONTRACT_ABI,
            data: propertyRegisteredEvent.data,
            topics: propertyRegisteredEvent.topics,
          });

          if (decoded.eventName === 'PropertyRegistered') {
            const propertyId = (decoded.args as any).propertyId;
            setRegisteredPropertyId(propertyId);
            console.log('Property registered with ID:', propertyId.toString());
          }
        }
      } catch (error) {
        console.error('Error extracting Property ID:', error);
      }
    }
  }, [isSuccess, receipt, publicClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteredPropertyId(null);

    if (!address) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'registerProperty',
        args: [
          BigInt(area),
          BigInt(bedrooms),
          BigInt(bathrooms),
          BigInt(yearBuilt),
          BigInt(floorLevel),
          BigInt(locationScore),
        ],
      });
    } catch (error: any) {
      console.error('Registration failed:', error);
      alert(`Registration failed: ${error.message}`);
    }
  };

  // Reset form after success
  useEffect(() => {
    if (isSuccess && registeredPropertyId) {
      const timer = setTimeout(() => {
        setArea('');
        setBedrooms('');
        setBathrooms('');
        setYearBuilt('');
        setFloorLevel('');
        setLocationScore('');
      }, 5000); // Keep form filled for 5 seconds so user can see what they registered

      return () => clearTimeout(timer);
    }
  }, [isSuccess, registeredPropertyId]);

  return (
    <div className="glass-card">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        📝 Register Property
      </h2>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 text-sm text-blue-200">
        Register your property with encrypted details. All sensitive information is protected using FHE encryption.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-2">Area (sqm)</label>
          <input
            type="number"
            className="form-input"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="e.g., 120"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Bedrooms</label>
            <input
              type="number"
              className="form-input"
              value={bedrooms}
              onChange={(e) => setBedrooms(e.target.value)}
              placeholder="e.g., 3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Bathrooms</label>
            <input
              type="number"
              className="form-input"
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              placeholder="e.g., 2"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Year Built</label>
            <input
              type="number"
              className="form-input"
              value={yearBuilt}
              onChange={(e) => setYearBuilt(e.target.value)}
              placeholder="e.g., 2010"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">Floor Level</label>
            <input
              type="number"
              className="form-input"
              value={floorLevel}
              onChange={(e) => setFloorLevel(e.target.value)}
              placeholder="e.g., 5"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Location Score (1-100)</label>
          <input
            type="number"
            className="form-input"
            value={locationScore}
            onChange={(e) => setLocationScore(e.target.value)}
            placeholder="e.g., 85"
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
          {isPending ? 'Confirming...' : isConfirming ? 'Registering...' : 'Register Property'}
        </button>

        {writeError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-400">
            <p className="font-semibold">❌ Registration Failed</p>
            <p className="text-xs mt-1">{writeError.message}</p>
          </div>
        )}

        {isSuccess && registeredPropertyId && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-semibold text-green-300 mb-2">Property Registered Successfully!</p>
                <div className="bg-green-900/30 rounded-lg p-3 mb-2">
                  <p className="text-lg font-bold text-green-200">
                    Property ID: <span className="text-white">{registeredPropertyId.toString()}</span>
                  </p>
                </div>
                <p className="text-xs text-gray-300 mb-2">
                  ⚠️ <strong>Important:</strong> Save this Property ID! You'll need it to:
                </p>
                <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                  <li>Submit valuations for this property</li>
                  <li>Query average valuations</li>
                  <li>Manage your property data</li>
                </ul>
                <p className="text-xs text-blue-300 mt-2">
                  💡 Click "Load My Properties" below to see all your properties
                </p>
              </div>
            </div>
          </div>
        )}

        {isSuccess && !registeredPropertyId && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="font-semibold text-green-300">✅ Property Registered!</p>
            <p className="text-xs text-gray-300 mt-1">
              Extracting Property ID from transaction...
            </p>
          </div>
        )}
      </form>
    </div>
  );
}
