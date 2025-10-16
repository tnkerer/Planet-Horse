import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useWallet } from './WalletContext'

interface UserContextValue {
  phorse: number | null
  medals: number | null
  wron: number | null
  shards: number | null
  career: string | null
  loading: boolean
  error: Error | null
  updateBalance: () => Promise<void>
  userAddress: string | null
  isExpired: boolean | null
  whoIs: () => Promise<{ address: string; expired: boolean } | null>
}

const UserContext = createContext<UserContextValue | undefined>(undefined)

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected, isAuthorized, address } = useWallet()
  const [phorse, setPhorse] = useState<number | null>(null)
  const [medals, setMedals] = useState<number | null>(null)
  const [wron, setWron] = useState<number | null>(null)
  const [shards, setShards] = useState<number | null>(null)
  const [career, setCareer] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const [userAddress, setUserAddress] = useState<string | null>(null)
  const [isExpired, setIsExpired] = useState<boolean | null>(null)

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
      const data = (await res.json()) as { phorse: number, medals: number, wron: number, shards: number, career: string }
      setPhorse(data.phorse)
      setMedals(data.medals)
      setWron(data.wron)
      setShards(data.shards)
      setCareer(data.career)
    } catch (err: any) {
      setError(err)
      setPhorse(null)
      setMedals(null)
      setWron(null)
      setShards(null)
      setCareer(null)
    } finally {
      setLoading(false)
    }
  }, [address])

  const whoIs = useCallback(async () => {
    try {
      const res = await fetch(
        `${process.env.API_URL}/auth/me`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )
      if (!res.ok) {
        setUserAddress(null)
        setIsExpired(null)
        return null
      }
      const data = (await res.json()) as { address: string; expired: boolean }
      setUserAddress(data.address)
      setIsExpired(data.expired)
      return data
    } catch {
      setUserAddress(null)
      setIsExpired(null)
      return null
    }
  }, [])

  // Fetch on wallet connect
  useEffect(() => {
    if (isConnected && address) {
      void fetchBalance()
      void whoIs()
    } else {
      setPhorse(null)
      setMedals(null)
      setWron(null)
      setShards(null)
      setCareer(null)
      setError(null)
      setUserAddress(null)
      setIsExpired(null)
    }
  }, [isConnected, isAuthorized, address, fetchBalance])

  const updateBalance = useCallback(async () => {
    await fetchBalance()
  }, [fetchBalance, isAuthorized])

  return (
    <UserContext.Provider value={{ phorse, medals, wron, shards, career, loading, error, updateBalance, userAddress, isExpired, whoIs }}>
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
