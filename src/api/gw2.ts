import type { AccountInfo, AccountAchievement, AchievementCategory, AchievementDetail, ItemDetail, SkinDetail, MiniDetail, WizardsVaultSection, Mastery, AccountMastery, MasteryPoints } from '../types/gw2'

const BASE_URL = 'https://api.guildwars2.com/v2'

async function apiFetch<T>(path: string, apiKey?: string): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`)
  if (apiKey) url.searchParams.set('access_token', apiKey)

  const response = await fetch(url.toString())

  if (!response.ok) {
    if (response.status === 401) throw new Error('Invalid API key. Please check your key and try again.')
    if (response.status === 403) throw new Error('API key does not have the required permissions. Make sure "Progression" is enabled.')
    const body = await response.text().catch(() => '')
    throw new Error(`API error ${response.status}: ${body || response.statusText}`)
  }

  return response.json()
}

export async function validateKey(apiKey: string): Promise<AccountInfo> {
  return apiFetch<AccountInfo>('/account', apiKey)
}

export async function getAccountAchievements(apiKey: string): Promise<AccountAchievement[]> {
  return apiFetch<AccountAchievement[]>('/account/achievements', apiKey)
}

export async function getAchievementCategories(): Promise<AchievementCategory[]> {
  return apiFetch<AchievementCategory[]>('/achievements/categories?ids=all')
}

export async function getAchievementDetails(ids: number[]): Promise<AchievementDetail[]> {
  const chunks: number[][] = []
  for (let i = 0; i < ids.length; i += 200) {
    chunks.push(ids.slice(i, i + 200))
  }

  const results = await Promise.all(
    chunks.map(chunk => apiFetch<AchievementDetail[]>(`/achievements?ids=${chunk.join(',')}`))
  )

  return results.flat().filter(Boolean)
}

async function resolveByType<T extends { id: number; name: string }>(
  endpoint: string, ids: number[]
): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map()
  const chunks: number[][] = []
  for (let i = 0; i < ids.length; i += 200) chunks.push(ids.slice(i, i + 200))
  const results = await Promise.all(chunks.map(chunk => apiFetch<T[]>(`${endpoint}?ids=${chunk.join(',')}`)))
  const map = new Map<number, string>()
  for (const item of results.flat().filter(Boolean)) map.set(item.id, item.name)
  return map
}

export async function resolveItems(ids: number[]): Promise<Map<number, string>> {
  return resolveByType<ItemDetail>('/items', ids)
}

export async function resolveSkins(ids: number[]): Promise<Map<number, string>> {
  return resolveByType<SkinDetail>('/skins', ids)
}

export async function resolveMinis(ids: number[]): Promise<Map<number, string>> {
  return resolveByType<MiniDetail>('/minis', ids)
}

export async function getWizardsVaultDaily(key: string): Promise<WizardsVaultSection> {
  return apiFetch<WizardsVaultSection>('/account/wizardsvault/daily', key)
}

export async function getWizardsVaultWeekly(key: string): Promise<WizardsVaultSection> {
  return apiFetch<WizardsVaultSection>('/account/wizardsvault/weekly', key)
}

export async function getWizardsVaultSpecial(key: string): Promise<WizardsVaultSection> {
  return apiFetch<WizardsVaultSection>('/account/wizardsvault/special', key)
}

export async function getMasteries(): Promise<Mastery[]> {
  return apiFetch<Mastery[]>('/masteries?ids=all')
}

export async function getAccountMasteries(key: string): Promise<AccountMastery[]> {
  return apiFetch<AccountMastery[]>('/account/masteries', key)
}

export async function getAccountMasteryPoints(key: string): Promise<MasteryPoints> {
  return apiFetch<MasteryPoints>('/account/mastery/points', key)
}
