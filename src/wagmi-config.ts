import { http, createConfig, createStorage, injected } from '@wagmi/core'
import { sepolia } from '@wagmi/core/chains'

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected({ target: 'metaMask' }),
  ],
  storage: createStorage({ storage: window.localStorage }),
  transports: {
    [sepolia.id]: http(),
  },
})

declare module '@wagmi/core' {
  interface Register {
    config: typeof config
  }
}
