import React, { useState, useEffect, useCallback } from 'react'

import Router from 'next/router'

import { createContext } from 'use-context-selector'
import detectEthereumProvider from '@metamask/detect-provider'

import type { Ethereum } from '../types/ethereum'
import useEthereumProvider from '../hooks/ethereum-provider'

type MataMaskContextProps = {
  ethereum: Ethereum | null
  walletAddress: string
  chainId: string
  connectToMetaMask: () => Promise<void>
}

export const MataMaskContext = createContext<MataMaskContextProps>(null)

export const MataMaskProvider: React.FC = ({ children }) => {
  const [provider, setProvider] = useState<Ethereum>(null)
  const [walletAddress, setWalletAddress] = useState('')
  const [chainId , setChainId] = useState('')

  const {
    connect,
    getAccounts,
    useChainChangedEffect,
    useAccountsChangedEffect,
    getEthereumChainId
  } = useEthereumProvider(provider)

  useEffect(() => {
    async function detectEthereumProviderAsync () {
      const detectedProvider = await detectEthereumProvider() as Ethereum

      if (!detectedProvider) console.warn('Please install MetaMask!')

      if (detectedProvider !== window.ethereum) {
        console.error('Do you have multiple wallets installed?')
      }

      setProvider(detectedProvider)
    }

    detectEthereumProviderAsync()
  }, [])

  useEffect(() => {
    if (provider) {
      (async () => {
        const chainId = await getEthereumChainId()
        setChainId(chainId)
      })()
    }
  }, [provider])

  useEffect(() => {
    if (provider) {
      (async () => {
        const accounts = await getAccounts()
        handlerAccountsChanged(accounts)
      })()
    }
  }, [provider])

  useChainChangedEffect(() => Router.reload())

  useAccountsChangedEffect(handlerAccountsChanged)

  function handlerAccountsChanged (accounts: string[]) {
    if (accounts.length === 0) {
      setWalletAddress('')
    } else if (accounts[0] !== walletAddress) {
      setWalletAddress(accounts[0])
    }
  }

  const connectToMetaMask = useCallback(async () => {
    const accounts = await connect()
    handlerAccountsChanged(accounts)
  }, [])

  return (
    <MataMaskContext.Provider value={{ ethereum: provider, walletAddress, chainId, connectToMetaMask }}>
      {children}
    </MataMaskContext.Provider>
  )
}

export default MataMaskProvider
