// src/domain/models/Horse.ts
export interface Item {
  id: string;
  ownerId: string;
  horseId?: string;
  name: string;
  value: number;
  breakable: boolean;
  uses: number;
  createdAt: string;
  updatedAt: string;
}

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
    stable: string | null;
    horseCareerFactor: number;
    ownerCareerFactor: number;
    legacy: boolean;
  };
  // ← now “items” is literally an array of full Item objects
  items: Item[];
}
