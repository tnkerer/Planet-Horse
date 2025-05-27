export interface Horse {
    id: number
    profile: {
      name: string
      name_slug: string
      sex: string
      type_horse: string
      type_horse_slug: string
      type_jockey: string
      time: string
    }
    staty: {
      status: string
      level: string
      exp: string
      upgradable: boolean
      power: string
      sprint: string
      speed: string
      energy: string
    }
    items: Array<{ id: number }>
  }