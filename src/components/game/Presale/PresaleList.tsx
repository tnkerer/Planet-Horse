// components/Presale/PresaleList.tsx
'use client'
import React, { useCallback, useEffect, useState } from 'react'
import styles from './styles.module.scss'
import PresaleCard from './PresaleCard'
import type { Preflight, StableDef } from './presale'

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL

const PresaleList: React.FC = () => {
  const [preflight, setPreflight] = useState<Preflight | null>(null)

  const refetchPreflight = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/user/stable/preflight`, { credentials: 'include' })
      if (!res.ok) throw new Error(`preflight failed ${res.status}`)
      const data: Preflight = await res.json()
      setPreflight(data)
    } catch (e) {
      console.error(e)
    }
  }, [])

  useEffect(() => {
    refetchPreflight()
  }, [refetchPreflight])

  useEffect(() => {
    (async () => {
      const res = await fetch(`${process.env.API_URL}/user/stable/preflight`, { credentials: 'include' })
      if (!res.ok) return console.error('preflight failed', res.status)
      const data: Preflight = await res.json()
      setPreflight(data)
    })()
  }, [])

  const handleBuy = async (phase: 'GTD' | 'FCFS', quantity: number) => {
    console.log(`Buying ${phase} stable!`)
  }

  if (!preflight) return null

  return (
    <div className={styles.grid}>
      <PresaleCard
        cardType="GTD"
        stable={{
          id: 1,
          name: 'GTD Stable Mint',
          src: 'stable',
          price: 220,
          supplyLeft: 400,
          perUserCap: 1,
        }}
        preflight={preflight}
        onBuy={async (qty) => handleBuy('GTD', qty)}
        onAfterBuy={refetchPreflight}
      />
      <PresaleCard
        cardType="FCFS"
        stable={{
          id: 2,
          name: 'FCFS Stable Mint',
          src: 'stable',
          price: 250,
          supplyLeft: 400,
          perUserCap: 1,
        }}
        preflight={preflight}
        onBuy={async (qty) => handleBuy('FCFS', qty)}
        onAfterBuy={refetchPreflight}
      />
    </div>
  )
}

export default PresaleList
