// src/contexts/WalletContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef
} from 'react'
import {
  ConnectorEvent,
  requestRoninWalletConnector,
  IBaseConnector,
  IConnectResult
} from '@sky-mavis/tanto-connect'

interface WalletContextValue {
  address: string | null
  chainId: number | null
  isConnected: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined)

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const connectorRef = useRef<IBaseConnector | null>(null)

  const isConnected = Boolean(address)

  useEffect(() => {
    let mounted = true

    async function initConnector() {
      try {
        const connector = await requestRoninWalletConnector()
        connectorRef.current = connector

        // CONNECT event delivers an object with .account:string and .chainId:number
        connector.on(
          ConnectorEvent.CONNECT,
          (res: IConnectResult) => {
            if (!mounted) return
            setAddress(res.account)
            setChainId(res.chainId)               // now number
            console.log('Tanto CONNECT', res)
          }
        )

        // ACCOUNTS_CHANGED delivers string[]
        connector.on(
          ConnectorEvent.ACCOUNTS_CHANGED,
          (accounts: string[]) => {
            if (!mounted) return
            setAddress(accounts[0] || null)
            console.log('Tanto ACCOUNTS_CHANGED', accounts)
          }
        )

        // CHAIN_CHANGED now delivers a number
        connector.on(
          ConnectorEvent.CHAIN_CHANGED,
          (newChain: number) => {
            if (!mounted) return
            setChainId(newChain)                 // now number
            console.log('Tanto CHAIN_CHANGED', newChain)
          }
        )

        // DISCONNECT
        connector.on(
          ConnectorEvent.DISCONNECT,
          () => {
            if (!mounted) return
            setAddress(null)
            setChainId(null)
            console.log('Tanto DISCONNECT')
          }
        )

        // auto‐reconnect if possible
        await connector.autoConnect()
      } catch (err) {
        console.error('Tanto init error', err)
      }
    }

    initConnector()
    return () => {
      mounted = false
      // no removeAllListeners — if needed, call connector.off(event, handler)
    }
  }, [])

  const connect = async () => {
    const conn = connectorRef.current
    if (!conn) {
      console.error('Connector not initialized')
      return
    }
    try {
      await conn.connect()
    } catch (err) {
      console.error('Tanto connect error', err)
    }
  }

  const disconnect = async () => {
    const conn = connectorRef.current
    if (!conn) {
      console.error('Connector not initialized')
      return
    }
    try {
      await conn.disconnect()
    } catch (err) {
      console.error('Tanto disconnect error', err)
    }
  }

  return (
    <WalletContext.Provider
      value={{ address, chainId, isConnected, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider>')
  return ctx
}
