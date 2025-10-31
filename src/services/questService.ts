export type QuestDifficulty = 'SIMPLE' | 'MEDIUM' | 'ADVANCED';

export type QuestType =
  | 'WIN_RACES'
  | 'RUN_RACES'
  | 'BREED_HORSES'
  | 'LEVEL_UP_HORSES'
  | 'EQUIP_ITEMS'
  | 'OPEN_CHESTS'
  | 'SPEND_PHORSE'
  | 'EARN_PHORSE'
  | 'UPGRADE_ITEMS'
  | 'RECYCLE_ITEMS'
  | 'RESTORE_ENERGY'
  | 'CLAIM_REWARDS'
  | 'DAILY_CHECKIN';

export const QUEST_TYPE_LABELS: Record<QuestType, string> = {
  WIN_RACES: 'Win Races',
  RUN_RACES: 'Complete Races',
  BREED_HORSES: 'Breed Horses',
  LEVEL_UP_HORSES: 'Level Up Horses',
  EQUIP_ITEMS: 'Equip Items',
  OPEN_CHESTS: 'Open Chests',
  SPEND_PHORSE: 'Spend PHORSE',
  EARN_PHORSE: 'Earn PHORSE',
  UPGRADE_ITEMS: 'Upgrade Items',
  RECYCLE_ITEMS: 'Recycle Items',
  RESTORE_ENERGY: 'Restore Energy',
  CLAIM_REWARDS: 'Claim Rewards',
  DAILY_CHECKIN: 'Daily Check-in',
};

export interface QuestReward {
  type: 'phorse' | 'wron' | 'medals' | 'item';
  amount: number;
  itemName?: string;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  questType: QuestType;
  reward: QuestReward[];
  questsToComplete: number;
  difficulty: QuestDifficulty;
  isDailyQuest: boolean;
  horsesToUnlock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserQuestProgress {
  quest: Quest;
  progress: number;
  completed: boolean;
  claimed: boolean;
  completedAt: string | null;
  claimedAt: string | null;
}

export interface CheckinStatus {
  canCheckin: boolean;
  streak: number;
  totalCheckins: number;
  lastCheckinAt: string | null;
  nextCheckinAt: string | null;
}

export interface CheckinResponse {
  success: boolean;
  streak: number;
  totalCheckins: number;
  reward: {
    phorse?: number;
    medals?: number;
  };
}

export interface ClaimResponse {
  success: boolean;
  rewards: QuestReward[];
}

export class QuestService {
  private baseURL: string;

  constructor(authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>) {
    this.baseURL = process.env.API_URL || 'http://localhost:3001';
    this.authFetch = authFetch;
  }

  private authFetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;

  async listQuests(): Promise<UserQuestProgress[]> {
    const response = await this.authFetch(`${this.baseURL}/quest/list`);
    if (!response.ok) {
      throw new Error(`Failed to fetch quests: ${response.statusText}`);
    }
    return response.json();
  }

  async claimQuest(questId: number): Promise<ClaimResponse> {
    const response = await this.authFetch(`${this.baseURL}/quest/claim`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ questId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to claim quest');
    }

    return response.json();
  }

  async dailyCheckin(): Promise<CheckinResponse> {
    const response = await this.authFetch(`${this.baseURL}/quest/checkin`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to check in');
    }

    return response.json();
  }

  async getCheckinStatus(): Promise<CheckinStatus> {
    const response = await this.authFetch(`${this.baseURL}/quest/checkin/status`);
    if (!response.ok) {
      throw new Error(`Failed to fetch checkin status: ${response.statusText}`);
    }
    return response.json();
  }

  // ADMIN ONLY: Create quest
  async createQuest(questData: {
    id: number;
    title: string;
    description: string;
    questType: QuestType;
    reward: QuestReward[];
    questsToComplete: number;
    difficulty: QuestDifficulty;
    isDailyQuest?: boolean;
    horsesToUnlock?: number;
  }): Promise<Quest> {
    const response = await this.authFetch(`${this.baseURL}/quest/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(questData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to create quest');
    }

    return response.json();
  }

  // ADMIN ONLY: Sync quest seed data to all users
  async syncQuestSeedData(): Promise<{
    success: boolean;
    questsUpserted: number;
    usersProcessed: number;
    userQuestsInitialized: number;
    durationMs: number;
  }> {
    const response = await this.authFetch(`${this.baseURL}/quest/admin/sync`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || 'Failed to sync quest data');
    }

    return response.json();
  }
}
