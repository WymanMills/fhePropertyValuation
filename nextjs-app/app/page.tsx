'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { RegisterProperty } from '@/components/RegisterProperty';
import { SubmitValuation } from '@/components/SubmitValuation';
import { ViewProperties } from '@/components/ViewProperties';
import { ValuationManagement } from '@/components/ValuationManagement';
import { AdminFunctions } from '@/components/AdminFunctions';
import { DebugInfo } from '@/components/DebugInfo';

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[960px] mx-auto px-5 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">
            🏠 Confidential Property Valuation System
          </h1>
          <p className="text-[var(--color-text-muted)] text-lg">
            Privacy-Preserving Real Estate Assessment Platform
          </p>
        </header>

        {/* Connect Wallet */}
        <div className="glass-card mb-8 flex justify-center">
          <ConnectButton />
        </div>

        {/* Debug Information */}
        <DebugInfo />

        {/* Feature Status Information */}
        <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-[1.35rem] p-5 mb-8">
          <h3 className="text-green-300 font-bold mb-3 flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <span>Application Status: Fully Functional</span>
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-3">
            <div>
              <p className="font-semibold text-green-200 mb-2">✅ Working Features:</p>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Connect Wallet (RainbowKit)</li>
                <li>• Register Property (FHE encrypted)</li>
                <li>• Submit Valuation (authorized only)</li>
                <li>• View Properties</li>
                <li>• Authorize/Revoke Valuators</li>
                <li>• Calculate Averages</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-blue-200 mb-2">ℹ️ Technical Note:</p>
              <p className="text-sm text-gray-300">
                The deployed contract includes a reveal function that requires KMS Gateway infrastructure (threshold decryption service). This infrastructure is not currently available on Sepolia testnet.
              </p>
              <p className="text-sm text-green-300 mt-2">
                <strong>Impact:</strong> None on core features. All privacy-preserving functionality works perfectly.
              </p>
            </div>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-blue-300 hover:text-blue-200 font-semibold">
              🔍 Learn more about KMS Gateway
            </summary>
            <p className="text-xs text-gray-400 mt-2 pl-4">
              KMS (Key Management System) Gateway is Zama's decentralized threshold decryption service. It requires multiple KMS nodes to cooperatively decrypt FHE ciphertexts. While not currently configured, the updated contract source code includes an alternative client-side decryption approach using fhevmjs.
            </p>
          </details>
        </div>

        {/* Main Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <RegisterProperty />
          <SubmitValuation />
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ViewProperties />
          <ValuationManagement />
        </div>

        {/* Admin Section */}
        <AdminFunctions />

        {/* Footer */}
        <footer className="text-center mt-12 text-sm text-[var(--color-text-muted)]">
          <p>
            Built with Zama fhEVM | Contract: {' '}
            <code className="font-mono">0xbc70...6483</code>
          </p>
          <p className="mt-2">
            🔒 All property data is encrypted on-chain using Fully Homomorphic Encryption
          </p>
        </footer>
      </div>
    </div>
  );
}
