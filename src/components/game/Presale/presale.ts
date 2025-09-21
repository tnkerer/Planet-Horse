// types/presale.ts
export type Preflight = {
  eligible: boolean
  reasons: string[]
  sale: {
    gtd: boolean
    fcfs: boolean
    discount: number
    gtdUsed: boolean
    fcfsUsed: boolean
    discountList: string[]
  }
  canUseGtd: boolean
  canUseFcfs: boolean
  hasDiscount: boolean
  discountEligible: boolean
  discountPct: number
}

export type PresalePhase = 'GTD' | 'FCFS'

export type StableDef = {
  id: number
  name: string
  src: 'stable'          // single image
  price: number          // base price
  supplyLeft: number
  perUserCap?: number
  paused?: boolean
}
