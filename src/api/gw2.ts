import type { AccountInfo, AccountAchievement, AchievementCategory, AchievementDetail } from '../types/gw2'

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
