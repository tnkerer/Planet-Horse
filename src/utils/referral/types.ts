export interface Player {
  id: string
  username: string
  wallet: string
  avatar?: string
  level: number
  totalPoints: number
  racesWon: number
  racesTotal: number
  winRate: number
  tokensEarned: number
  horsesOwned: number
  favoriteHorse?: {
    name: string
    type: "LEGENDARY" | "EPIC" | "RARE" | "UNCOMMON" | "COMMON"
  }
  status: "ONLINE" | "RACING" | "OFFLINE"
  region: string
  joinDate: string
}

export interface FilterOptions {
  level: string
  horseType: string
  status: string
  region: string
}

export type SortOption = "TOTAL_POINTS" | "LEVEL" | "RACES_WON" | "WIN_RATE" | "TOKENS_EARNED" | "HORSES_OWNED"

export interface ReferralData {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  level: number;
  xp: number;             // <-- current XP
  xpForNextLevel: number; // <-- required XP for next level
  referredByRefCode?: string;

  // 🔹 New field for referred players
  referredPlayers: Array<{
    displayName: string; // discordTag, invitation code, or wallet (sliced)
    active: boolean;     // true if updatedAt < 3 days, false otherwise
  }>;
}

export interface Reward {
  type: string
  amount: number | string
  icon: string
}

export interface Milestone {
  id: string
  title: string
  description: string
  requiredReferrals: number
  rewards: Reward[]
  claimed: boolean
}

export interface LeaderboardEntry {
  rank: string;
  wallet: string;
  totalPhorseSpent: number;
}
