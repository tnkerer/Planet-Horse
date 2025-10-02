// utils/constants/stables.ts
export type PresalePhase = 'UPCOMING' | 'GTD' | 'FCFS' | 'CLOSED'

export type StableDef = {
  id: number
  slug: string            // e.g. 'founder-stable'
  name: string            // e.g. 'Founder Stable'
  src: 'stable'           // all use the same 'stable.gif'
  price: number           // base price in PHORSE (or WRON, if that’s what you charge)
  supplyTotal: number
  supplyLeft: number      // keep this updated from backend
  perUserCap?: number     // optional per-user cap
  paused?: boolean
  saleWindows: {
    gtdStart?: string     // ISO (e.g. '2025-09-22T10:00:00Z')
    gtdEnd?: string
    fcfsStart?: string
    fcfsEnd?: string
  }
  perks?: string[]        // optional UI text (bullets)
}

export const stables: StableDef[] = [
  {
    id: 1,
    slug: 'founder-stable',
    name: 'Founder Stable',
    src: 'stable',
    price: 12000,
    supplyTotal: 400,
    supplyLeft: 400,
    perUserCap: 2,
    saleWindows: {
      gtdStart: '2025-09-22T13:00:00Z', // 1 PM UTC
      gtdEnd:   '2025-09-22T14:00:00Z',
      fcfsStart:'2025-09-22T14:00:00Z',
      fcfsEnd:  '2025-09-29T14:00:00Z',
    },
    perks: ['VIP role', 'Stable naming', 'Revenue share access'],
  },
]


