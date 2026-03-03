/**
 * One-shot GW2 API fixture fetcher.
 *
 * Run manually to refresh test fixtures:
 *   npx tsx scripts/fetch-fixtures.ts
 *
 * With an account key for account-level data:
 *   GW2_API_KEY=your-key npx tsx scripts/fetch-fixtures.ts
 *
 * Outputs to test/fixtures/:
 *   categories.json                   — all achievement categories
 *   groups.json                       — all achievement groups
 *   achievement-details-sample.json   — details for ~50 representative IDs
 *   account-achievements.json         — only written when GW2_API_KEY is set
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FIXTURES_DIR = join(__dirname, '..', 'test', 'fixtures')
const BASE = 'https://api.guildwars2.com'
const API_KEY = process.env.GW2_API_KEY ?? ''

// Known festival category names to include in the sample (for classification tests)
const FESTIVAL_KEYWORDS = ['halloween', 'wintersday', 'dragon bash', 'lunar new year', 'four winds', 'super adventure']

async function apiFetch<T>(url: string, key?: string): Promise<T> {
  const headers: Record<string, string> = { 'Accept': 'application/json' }
  if (key) headers['Authorization'] = `Bearer ${key}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`)
  return res.json() as Promise<T>
}

function save(filename: string, data: unknown) {
  const path = join(FIXTURES_DIR, filename)
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  console.log(`  ✓ ${filename}  (${Array.isArray(data) ? data.length + ' items' : 'object'})`)
}

interface Category {
  id: number
  name: string
  description: string
  order: number
  achievements: number[]
}

interface Group {
  id: string
  name: string
  description: string
  order: number
  categories: number[]
}

async function main() {
  mkdirSync(FIXTURES_DIR, { recursive: true })
  console.log('Fetching GW2 API fixtures...')

  // --- categories ---
  console.log('\nFetching categories...')
  const categories = await apiFetch<Category[]>(`${BASE}/v2/achievements/categories?ids=all`)
  save('categories.json', categories)

  // --- groups ---
  console.log('Fetching groups...')
  const groups = await apiFetch<Group[]>(`${BASE}/v2/achievements/groups?ids=all`)
  save('groups.json', groups)

  // --- achievement details sample ---
  // Pick representative IDs: a few festival categories + some General ones
  const festivalCats = categories.filter(c =>
    FESTIVAL_KEYWORDS.some(kw => c.name.toLowerCase().includes(kw))
  )
  const generalCats = categories.filter(c =>
    !FESTIVAL_KEYWORDS.some(kw => c.name.toLowerCase().includes(kw))
  )

  const sampleIds = new Set<number>()
  // Up to 5 IDs from each festival category (cap at 8 categories)
  for (const cat of festivalCats.slice(0, 8)) {
    for (const id of cat.achievements.slice(0, 5)) sampleIds.add(id)
  }
  // Up to 5 IDs from first 3 General categories
  for (const cat of generalCats.slice(0, 3)) {
    for (const id of cat.achievements.slice(0, 5)) sampleIds.add(id)
  }

  const ids = [...sampleIds].slice(0, 50)
  console.log(`Fetching details for ${ids.length} achievement IDs...`)
  const details = await apiFetch<unknown[]>(`${BASE}/v2/achievements?ids=${ids.join(',')}`)
  save('achievement-details-sample.json', details)

  // --- account achievements (optional) ---
  if (API_KEY) {
    console.log('Fetching account achievements...')
    const accountAchievements = await apiFetch<unknown[]>(
      `${BASE}/v2/account/achievements`,
      API_KEY,
    )
    save('account-achievements.json', accountAchievements)
  } else {
    console.log('\n(Skipping account-achievements.json — set GW2_API_KEY env var to include it)')
  }

  console.log('\nDone. Fixtures written to test/fixtures/')
}

main().catch((err: unknown) => {
  console.error('Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
