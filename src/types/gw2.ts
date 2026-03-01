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
  rewards?: AchievementReward[]
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

export interface AchievementReward {
  type: 'Coins' | 'Item' | 'Mastery' | 'Title'
  id?: number
  count?: number
  region?: string
}

export interface AchievementGroup {
  id: string
  name: string
  description: string
  order: number
  categories: number[]
}

export interface ItemDetail { id: number; name: string }
export interface SkinDetail { id: number; name: string }
export interface MiniDetail { id: number; name: string }

export interface WizardsVaultObjective {
  id: number
  title: string
  track: string
  acclaim: number
  progress_current: number
  progress_complete: number
  claimed: boolean
}

export interface WizardsVaultSection {
  meta_progress_current: number
  meta_progress_complete: number
  meta_reward_item_id: number
  meta_reward_astral: number
  meta_reward_claimed: boolean
  objectives: WizardsVaultObjective[]
}

export interface MasteryLevel { name: string; description: string; point_cost: number; exp_cost: number }
export interface Mastery { id: number; name: string; region: string; levels: MasteryLevel[] }
export interface AccountMastery { id: number; level: number }
export interface MasteryPoints {
  totals: { region: string; spent: number; earned: number }[]
  unlocked: number
}

export interface SavedAccount {
  key: string
  accountName: string
}
