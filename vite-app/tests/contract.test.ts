import { describe, it, expect } from 'vitest'
import { CONTRACT_ADDRESS, CONTRACT_ABI, SEPOLIA_CHAIN_ID } from '../src/contract'

describe('Contract Configuration', () => {
  it('should have valid contract address', () => {
    expect(CONTRACT_ADDRESS).toBeDefined()
    expect(CONTRACT_ADDRESS).toMatch(/^0x[a-fA-F0-9]{40}$/)
  })

  it('should have contract ABI defined', () => {
    expect(CONTRACT_ABI).toBeDefined()
    expect(Array.isArray(CONTRACT_ABI)).toBe(true)
    expect(CONTRACT_ABI.length).toBeGreaterThan(0)
  })

  it('should have correct Sepolia chain ID', () => {
    expect(SEPOLIA_CHAIN_ID).toBe(11155111)
  })

  it('should have registerProperty function in ABI', () => {
    const registerPropertyFunc = CONTRACT_ABI.find(
      (item: any) => item.type === 'function' && item.name === 'registerProperty'
    )
    expect(registerPropertyFunc).toBeDefined()
  })

  it('should have submitValuation function in ABI', () => {
    const submitValuationFunc = CONTRACT_ABI.find(
      (item: any) => item.type === 'function' && item.name === 'submitValuation'
    )
    expect(submitValuationFunc).toBeDefined()
  })

  it('should have PropertyRegistered event in ABI', () => {
    const propertyRegisteredEvent = CONTRACT_ABI.find(
      (item: any) => item.type === 'event' && item.name === 'PropertyRegistered'
    )
    expect(propertyRegisteredEvent).toBeDefined()
  })
})
