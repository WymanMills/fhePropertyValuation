import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import * as Tabs from '@radix-ui/react-tabs'
import * as Toast from '@radix-ui/react-toast'
import { CONTRACT_ADDRESS, CONTRACT_ABI, SEPOLIA_CHAIN_ID } from '../contract'
import { useState } from 'react'
import RegisterPropertyForm from './RegisterPropertyForm'
import SubmitValuationForm from './SubmitValuationForm'
import ViewProperties from './ViewProperties'
import AdminPanel from './AdminPanel'

export default function PropertyValuationApp() {
  const { address, chainId } = useAccount()
  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message)
    setToastType(type)
    setToastOpen(true)
  }

  const isWrongNetwork = address && chainId !== SEPOLIA_CHAIN_ID

  return (
    <Toast.Provider>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-accent to-success bg-clip-text text-transparent">
            🏠 Confidential Property Valuation System
          </h1>
          <p className="text-gray-400 text-base md:text-lg">
            Privacy-Preserving Real Estate Assessment Platform
          </p>
        </div>

        <div className="glass-card mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <strong>Connection Status:</strong>{' '}
              {address ? (
                <span className={isWrongNetwork ? 'text-error' : 'text-success'}>
                  {isWrongNetwork
                    ? 'Connected to wrong network - Please switch to Sepolia'
                    : `Connected: ${address.substring(0, 6)}...${address.substring(38)} on Sepolia`}
                </span>
              ) : (
                <span className="text-gray-400">Not Connected</span>
              )}
            </div>
            <ConnectButton />
          </div>
        </div>

        {isWrongNetwork && (
          <div className="glass-card mb-6 bg-error/10 border-error">
            <p className="text-error font-semibold">
              ⚠️ Please switch to Sepolia Testnet to use this application
            </p>
          </div>
        )}

        <Tabs.Root defaultValue="register" className="w-full">
          <Tabs.List className="flex gap-2 mb-6 flex-wrap">
            <Tabs.Trigger
              value="register"
              className="px-6 py-3 rounded-lg font-semibold transition-all data-[state=active]:bg-accent data-[state=active]:text-white data-[state=inactive]:bg-glass data-[state=inactive]:text-gray-300"
            >
              📝 Register Property
            </Tabs.Trigger>
            <Tabs.Trigger
              value="valuation"
              className="px-6 py-3 rounded-lg font-semibold transition-all data-[state=active]:bg-accent data-[state=active]:text-white data-[state=inactive]:bg-glass data-[state=inactive]:text-gray-300"
            >
              💰 Submit Valuation
            </Tabs.Trigger>
            <Tabs.Trigger
              value="properties"
              className="px-6 py-3 rounded-lg font-semibold transition-all data-[state=active]:bg-accent data-[state=active]:text-white data-[state=inactive]:bg-glass data-[state=inactive]:text-gray-300"
            >
              📊 View Properties
            </Tabs.Trigger>
            <Tabs.Trigger
              value="admin"
              className="px-6 py-3 rounded-lg font-semibold transition-all data-[state=active]:bg-accent data-[state=active]:text-white data-[state=inactive]:bg-glass data-[state=inactive]:text-gray-300"
            >
              ⚙️ Admin
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="register">
            <RegisterPropertyForm showToast={showToast} />
          </Tabs.Content>

          <Tabs.Content value="valuation">
            <SubmitValuationForm showToast={showToast} />
          </Tabs.Content>

          <Tabs.Content value="properties">
            <ViewProperties />
          </Tabs.Content>

          <Tabs.Content value="admin">
            <AdminPanel showToast={showToast} />
          </Tabs.Content>
        </Tabs.Root>

        <Toast.Root
          open={toastOpen}
          onOpenChange={setToastOpen}
          className={`glass-card fixed bottom-4 right-4 z-50 ${
            toastType === 'success' ? 'border-success' : 'border-error'
          }`}
        >
          <Toast.Title className={toastType === 'success' ? 'text-success' : 'text-error'}>
            {toastType === 'success' ? '✅ Success' : '❌ Error'}
          </Toast.Title>
          <Toast.Description className="text-gray-300 mt-2">{toastMessage}</Toast.Description>
        </Toast.Root>

        <Toast.Viewport />
      </div>
    </Toast.Provider>
  )
}
