// Raw shape from your backend
export interface BackendHorse {
  tokenId: string;
  name: string;
  sex: 'MALE' | 'FEMALE';
  status: string;
  rarity: string;
  exp: number;
  upgradable: boolean;
  level: number;
  currentPower: number;
  currentSprint: number;
  currentSpeed: number;
  currentEnergy: number;
  maxEnergy: number;
  lastRace: string | null;
  createdAt: string;
  updatedAt: string;
  nickname: string | null;
  foodUsed: number;
  gen: number;
  lastBreeding: string;
  currentBreeds: number;
  maxBreeds: number;
  equipments: Array<{
    id: string;
    ownerId: string;
    horseId: string;
    name: string;
    value: number;
    breakable: boolean;
    uses: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Normalized shape used in UI/Phaser
export interface Horse {
  id: number;
  profile: {
    nickname: string | null;
    name: string;
    name_slug: string;
    sex: string;
    type_horse: string;
    type_horse_slug: string;
    type_jockey: string;
    time: string;
    food_used: number;
  };
  staty: {
    status: string;
    started: string;
    breeding: string;
    level: string;
    exp: string;
    upgradable: boolean;
    power: string;
    sprint: string;
    speed: string;
    energy: string;
    generation: string;
  };
  items: BackendHorse['equipments'];
}
