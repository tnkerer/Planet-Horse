import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useWallet } from './WalletContext'

interface UserContextValue {
  phorse: number | null
  loading: boolean
  error: Error | null
  updateBalance: () => Promise<void>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected, isAuthorized, address } = useWallet()
  const [phorse, setPhorse] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!address) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `${process.env.API_URL}/user/balance`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )
      if (!res.ok) {
        throw new Error(`Failed to fetch balance: ${res.status}`)
      }
      const data = (await res.json()) as { phorse: number }
      setPhorse(data.phorse)
    } catch (err: any) {
      setError(err)
      setPhorse(null)
    } finally {
      setLoading(false)
    }
  }, [address])

  // Fetch on wallet connect
  useEffect(() => {
    if (isConnected && address) {
      void fetchBalance()
    } else {
      setPhorse(null)
      setError(null)
    }
  }, [isConnected, isAuthorized, address, fetchBalance])

  const updateBalance = useCallback(async () => {
    await fetchBalance()
  }, [fetchBalance, isAuthorized])

  return (
    <UserContext.Provider value={{ phorse, loading, error, updateBalance }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext)
  if (!ctx) {
    throw new Error('useUser must be used within UserProvider')
  }
  return ctx
}
