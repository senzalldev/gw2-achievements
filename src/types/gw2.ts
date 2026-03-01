export interface AccountInfo {
  id: string
  name: string
  world: number
  age: number
  guilds: string[]
  created: string
  access: string[]
  commander: boolean
  daily_ap: number
  monthly_ap: number
}

export interface AccountAchievement {
  id: number
  bits?: number[]
  current?: number
  max?: number
  done: boolean
  repeated?: number
  unlocked?: boolean
}

export interface AchievementTier {
  count: number
  points: number
}

export interface AchievementBit {
  type: string
  id?: number
  text?: string
}

export interface AchievementDetail {
  id: number
  name: string
  description: string
  requirement: string
  locked_text?: string
  type: string
  flags: string[]
  tiers: AchievementTier[]
  bits?: AchievementBit[]
  point_cap?: number
  rewards?: unknown[]
  prerequisites?: number[]
}

export interface AchievementCategory {
  id: number
  name: string
  description: string
  order: number
  icon?: string
  achievements: number[]
}
