import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useRef,
} from 'react'
import { BrowserProvider } from 'ethers'
import {
  ConnectorEvent,
  requestRoninWalletConnector,
  IBaseConnector,
  IConnectResult,
} from '@sky-mavis/tanto-connect'

/** Helpers to inspect the JWT cookie */
function getJwtFromCookie(): string | null {
  const match = document.cookie.match(/(?:^|; )jid=([^;]*)/)
  return match ? match[1] : null
}

function isJwtExpired(token: string): boolean {
  try {
    const [, payload] = token.split('.')
    const { exp } = JSON.parse(atob(payload)) as { exp: number }
    return Date.now() >= exp * 1000
  } catch {
    return true
  }
}

interface WalletContextValue {
  address: string | null
  isConnected: boolean
  isAuthorized: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  /** Pass in an address to override state if needed */
  signIn: (overrideAddress?: string) => Promise<void>
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined)

export const WalletProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [address, setAddress] = useState<string | null>(null)
  const [ isAuthorized, setIsAuthorized ] = useState<boolean>(false)
  const connectorRef = useRef<IBaseConnector | null>(null)

  // Initialize the Ronin connector
  useEffect(() => {
    let mounted = true
    requestRoninWalletConnector()
      .then((connector) => {
        connectorRef.current = connector
        connector.on(
          ConnectorEvent.CONNECT,
          (res: IConnectResult) => mounted && setAddress(res.account)
        )
        connector.on(
          ConnectorEvent.DISCONNECT,
          () => mounted && setAddress(null)
        )
        connector.autoConnect().catch(() => { })
      })
      .catch(console.error)

    return () => {
      mounted = false
    }
  }, [])

  // Connect and optionally trigger SIWE if no valid JWT
  const connect = async (): Promise<void> => {
    const conn = connectorRef.current
    if (!conn) alert('Ronin connector not initialized. Make sure you have Ronin Wallet installed!')
    const { account } = await conn.connect()
    setAddress(account)

    // Only sign in if the JWT is missing or expired
    const jwt = getJwtFromCookie()
    if (!jwt || isJwtExpired(jwt)) {
      await signIn(account)
    }
  }

  // Disconnect from Ronin
  const disconnect = async (): Promise<void> => {
    const conn = connectorRef.current
    if (!conn) throw new Error('Ronin connector not initialized')

    // 2) hit your logout endpoint *with* that header
    await fetch(`${process.env.API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })

    // 2) then disconnect the wallet and clear local state
    await conn.disconnect()
    setAddress(null)
    setIsAuthorized(false)
  }

  // SIWE sign-in flow with optional overrideAddress
  const signIn = async (overrideAddress?: string): Promise<void> => {
    const conn = connectorRef.current
    const addr = overrideAddress ?? address
    if (!conn || !addr) throw new Error('Connect wallet first')

    // 1. Fetch the nonce/message
    const res0 = await fetch(
      `${process.env.API_URL}/auth/nonce?address=${addr}`
    )
    if (!res0.ok) throw new Error('Failed to fetch nonce')
    const { message } = (await res0.json()) as { message: string }

    // 2. Sign the message
    const provider = new BrowserProvider((conn as any).provider)
    const signer = await provider.getSigner()
    const signature = await signer.signMessage(message)

    // 3. Send to backend to verify & set cookie
    const res1 = await fetch(`${process.env.API_URL}/auth/verify`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, signature }),
    })
    if (!res1.ok) {
      throw new Error('Sign-in failed')
    }
    setIsAuthorized(true)
    console.log('🛡️ Signed in successfully')
  }

  // Auto-refresh ~5 minutes before expiry
  useEffect(() => {
    const jwt = getJwtFromCookie()
    if (!jwt) return

    try {
      const [, payload] = jwt.split('.')
      const { exp } = JSON.parse(atob(payload)) as { exp: number }
      const msUntil = exp * 1000 - Date.now() - 5 * 60 * 1000
      if (msUntil > 0) {
        const id = setTimeout(() => {
          void signIn()
        }, msUntil)
        return () => clearTimeout(id)
      }
    } catch (e) {
      console.error('Failed to decode JWT payload', e)
    }
  }, [address])

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: Boolean(address),
        isAuthorized,
        connect,
        disconnect,
        signIn,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext)
  if (!ctx) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return ctx
}
