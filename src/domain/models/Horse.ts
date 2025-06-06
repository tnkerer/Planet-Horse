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
    name: string;
    name_slug: string;
    sex: string;
    type_horse: string;
    type_horse_slug: string;
    type_jockey: string;
    time: string;
  };
  staty: {
    status: string;
    level: string;
    exp: string;
    upgradable: boolean;
    power: string;
    sprint: string;
    speed: string;
    energy: string;
  };
  // ← now “items” is literally an array of full Item objects
  items: Item[];
}
