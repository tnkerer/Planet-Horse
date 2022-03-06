import { useCallback, useEffect, useRef } from 'react'

import type {
  Ethereum,
  HandlerAccountsChanged,
  HandlerChainChanged,
  HandlerConnectInfo,
  HandlerDisconnect
} from '../types/ethereum'

export const useEthereumProvider = (provider: Ethereum | null) => {
  const ethereum = useRef(provider)

  useEffect(() => {
    ethereum.current = provider
  }, [provider])

  function subscribe (event: string, handler: Function) {
    return useEffect(() => {
      ethereum.current?.on(event, handler)
      return () => ethereum.current?.removeListener(event, handler)
    }, [ethereum.current])
  }

  function useChainChangedEffect (effect: HandlerChainChanged) {
    return subscribe('chainChanged', effect)
  }

  function useAccountsChangedEffect (effect: HandlerAccountsChanged) {
    return subscribe('accountsChanged', effect)
  }

  function useConnectInfoEffect (effect: HandlerConnectInfo) {
    return subscribe('connect', effect)
  }

  function useDisconnectEffect (effect: HandlerDisconnect) {
    return subscribe('disconnect', effect)
  }

  const getEthereumChainId = useCallback(async () => {
    const chainId = await ethereum.current?.request<string>({ method: 'eth_chainId' })
    return chainId
  }, [])

  const getAccounts = useCallback(async () => {
    const accounts = await ethereum.current?.request<string[]>({ method: 'eth_accounts' })
    return accounts
  }, [])

  const connect = useCallback(async () => {
    const accounts = await ethereum.current?.request<string[]>({ method: 'eth_requestAccounts' })
    return accounts
  }, [])

  return {
    useChainChangedEffect,
    useAccountsChangedEffect,
    useConnectInfoEffect,
    useDisconnectEffect,
    getEthereumChainId,
    getAccounts,
    connect
  }
}

export default useEthereumProvider
