<template>
  <div class="space-y-4">
    <!-- Four smart filter sections -->
    <div v-for="section in sections" :key="section.id" class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <!-- Section header card (always visible, clickable) -->
      <div
        class="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-700/30 transition-colors"
        @click="toggleSection(section.id)"
      >
        <span class="text-2xl shrink-0">{{ section.icon }}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-semibold text-white">{{ section.title }}</h3>
            <span class="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
              {{ section.items.length }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">{{ section.description }}</p>
        </div>
        <span
          class="text-slate-400 text-xs transition-transform duration-200 shrink-0"
          :style="{ display: 'inline-block', transform: openSections.has(section.id) ? 'rotate(180deg)' : 'rotate(0deg)' }"
        >▼</span>
      </div>

      <!-- Achievement list (expanded) -->
      <div v-if="openSections.has(section.id)" class="border-t border-slate-700/50">
        <div v-if="section.items.length === 0" class="text-slate-500 text-sm text-center py-8">
          No achievements found for this filter.
        </div>
        <div v-else class="divide-y divide-slate-700/30">
          <div v-for="item in section.items" :key="item.account.id">
            <!-- Row header -->
            <div
              class="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-700/50 transition-colors"
              @click="toggleExpand(item)"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="text-sm font-medium text-white">{{ item.detail.name }}</span>
                  <span v-if="item.category" class="text-xs bg-slate-600 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
                    {{ item.category.name }}
                  </span>
                  <span v-if="item.detail.rewards?.some(r => r.type === 'Title')"
                        class="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
                    🎖️ Title
                  </span>
                  <span v-if="item.detail.rewards?.some(r => r.type === 'Mastery')"
                        class="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
                    🌟 Mastery
                  </span>
                  <span v-if="item.detail.flags?.includes('Repeatable')"
                        class="text-xs bg-sky-900/40 text-sky-300 px-2 py-0.5 rounded-full shrink-0">
                    🔁 Repeatable
                  </span>
                </div>

                <!-- Progress bar -->
                <div class="flex items-center gap-2 mt-1.5">
                  <div class="flex-1 bg-slate-600 rounded-full h-1.5">
                    <div
                      class="h-1.5 rounded-full"
                      :class="item.progressPercent >= 50 ? 'bg-amber-400' : 'bg-sky-500'"
                      :style="{ width: item.progressPercent + '%' }"
                    ></div>
                  </div>
                  <span class="text-xs text-slate-500 whitespace-nowrap">{{ item.progressPercent }}%</span>
                </div>
              </div>

              <div class="text-right shrink-0">
                <div class="text-sm font-bold text-purple-400">+{{ (item.totalPoints - item.earnedPoints).toLocaleString() }} AP</div>
                <div class="text-xs text-slate-500">remaining</div>
              </div>

              <span
                class="text-slate-400 text-xs transition-transform duration-200 shrink-0"
                :style="{ display: 'inline-block', transform: expanded.has(item.account.id) ? 'rotate(180deg)' : 'rotate(0deg)' }"
              >▼</span>
            </div>

            <!-- Expanded detail -->
            <div v-if="expanded.has(item.account.id)" class="border-t border-slate-600/50 px-4 pb-4 pt-3 space-y-3 bg-slate-900/20">
              <div v-if="item.detail.locked_text" class="flex items-start gap-2 p-2 rounded-lg bg-amber-900/20 border border-amber-900/40">
                <span class="text-amber-400 shrink-0">🔒</span>
                <p class="text-xs text-amber-300"><strong class="text-amber-400">Unlock requirement:</strong> {{ item.detail.locked_text }}</p>
              </div>
              <p v-if="item.detail.requirement" class="text-xs text-slate-400">
                <strong class="text-slate-300">How to complete:</strong> {{ item.detail.requirement }}
              </p>
              <p v-if="item.detail.description" class="text-xs text-slate-400">{{ item.detail.description }}</p>

              <a
                :href="wikiUrl(item.detail.name)"
                target="_blank"
                rel="noopener"
                @click.stop
                class="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >📖 View on GW2 Wiki ↗</a>

              <!-- Tiers -->
              <div v-if="item.detail.tiers.length > 1">
                <div class="text-xs text-slate-500 mb-1">Tiers:</div>
                <div class="flex flex-wrap gap-2">
                  <span
                    v-for="(tier, i) in item.detail.tiers"
                    :key="i"
                    class="text-xs px-2 py-0.5 rounded"
                    :class="(item.account.current ?? 0) >= tier.count
                      ? 'bg-emerald-900/50 text-emerald-400'
                      : 'bg-slate-700 text-slate-400'"
                  >
                    {{ tier.count.toLocaleString() }} → {{ tier.points }} AP
                  </span>
                </div>
              </div>

              <!-- Still to do: bit-based -->
              <div v-if="item.detail.bits?.length && !item.account.done">
                <div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
                  <h4 class="text-sm font-semibold text-amber-400">
                    Still to do
                    <span class="text-slate-500 font-normal text-xs ml-1">
                      ({{ remainingBitsFor(item).length }} of {{ displayableBitCount(item) }} left)
                    </span>
                  </h4>
                  <button
                    v-if="remainingBitsFor(item).length > 0"
                    @click.stop="copyRemaining(item)"
                    class="text-xs px-3 py-1 rounded-lg border transition-colors shrink-0"
                    :class="copyFeedback === item.account.id
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-900/20'
                      : 'border-amber-400/40 text-amber-400 hover:border-amber-400 hover:bg-amber-400/10'"
                  >
                    {{ copyFeedback === item.account.id ? '✓ Copied!' : '📋 Copy my to-do list' }}
                  </button>
                </div>

                <ul v-if="remainingBitsFor(item).length > 0" class="space-y-1 mb-2">
                  <li
                    v-for="(bit, idx) in remainingBitsFor(item)"
                    :key="idx"
                    class="flex items-start gap-2 text-xs text-amber-100"
                  >
                    <span class="text-amber-400 mt-0.5 shrink-0">○</span>
                    <span>{{ getBitName(bit) }}</span>
                  </li>
                </ul>

                <details v-if="doneBitsFor(item).length > 0" class="mt-1">
                  <summary class="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors select-none">
                    Completed ({{ doneBitsFor(item).length }})
                  </summary>
                  <ul class="mt-1.5 space-y-1 pl-1">
                    <li
                      v-for="(bit, idx) in doneBitsFor(item)"
                      :key="idx"
                      class="flex items-start gap-2 text-xs text-slate-600"
                    >
                      <span class="shrink-0">✓</span>
                      <span>{{ getBitName(bit) }}</span>
                    </li>
                  </ul>
                </details>
              </div>

              <!-- Still to do: count-based -->
              <div
                v-else-if="!item.account.done && item.account.current != null && item.account.max != null"
                class="space-y-2"
              >
                <div v-if="nextTierFor(item)" class="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                  <span>→</span>
                  <span>
                    Next milestone: {{ nextTierFor(item)?.count.toLocaleString() }}
                    ({{ ((nextTierFor(item)?.count ?? 0) - (item.account.current ?? 0)).toLocaleString() }} more → +{{ nextTierFor(item)?.points }} AP)
                  </span>
                </div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs text-slate-400">
                    {{ item.account.current.toLocaleString() }} / {{ item.account.max.toLocaleString() }}
                    ({{ (item.account.max - item.account.current).toLocaleString() }} to go)
                  </span>
                  <button
                    @click.stop="copyRemaining(item)"
                    class="text-xs px-3 py-1 rounded-lg border transition-colors shrink-0"
                    :class="copyFeedback === item.account.id
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-900/20'
                      : 'border-amber-400/40 text-amber-400 hover:border-amber-400 hover:bg-amber-400/10'"
                  >
                    {{ copyFeedback === item.account.id ? '✓ Copied!' : '📋 Copy progress' }}
                  </button>
                </div>
                <p class="text-xs text-slate-500">The wiki has a full breakdown of what counts as progress.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Raids This Week -->
    <div v-if="raidWings.length > 0" class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div
        class="flex items-center gap-4 p-5 cursor-pointer hover:bg-slate-700/30 transition-colors"
        @click="raidsExpanded = !raidsExpanded"
      >
        <span class="text-2xl shrink-0">⚔️</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 class="font-semibold text-white">Raids This Week</h3>
            <span class="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
              {{ raidsDone }} / {{ raidsTotal }} events
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">Resets Monday at 07:30 UTC</p>
        </div>
        <span
          class="text-slate-400 text-xs transition-transform duration-200 shrink-0"
          :style="{ display: 'inline-block', transform: raidsExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }"
        >▼</span>
      </div>
      <div v-if="raidsExpanded" class="border-t border-slate-700/50 divide-y divide-slate-700/30">
        <div v-for="wing in raidWings" :key="wing.id" class="p-4">
          <div class="flex items-center justify-between mb-2">
            <span
              class="text-sm font-medium"
              :class="wingDoneCount(wing) === wing.events.length ? 'text-emerald-400' : 'text-white'"
            >{{ formatWingId(wing.id) }}</span>
            <span class="text-xs text-slate-500">{{ wingDoneCount(wing) }} / {{ wing.events.length }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="event in wing.events"
              :key="event.id"
              class="text-xs px-2.5 py-1 rounded-lg"
              :class="doneRaids.includes(event.id) ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-700 text-slate-400'"
            >{{ formatEventId(event.id) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FAQ Section -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold text-white mb-4">Frequently Asked Questions</h3>
      <div class="space-y-2">
        <details
          v-for="faq in faqs"
          :key="faq.q"
          class="bg-slate-700/40 rounded-lg overflow-hidden"
        >
          <summary class="px-4 py-3 cursor-pointer text-sm font-medium text-slate-200 hover:text-white transition-colors select-none list-none flex items-center justify-between gap-3">
            <span>{{ faq.q }}</span>
            <span class="text-amber-400 text-xs shrink-0">▼</span>
          </summary>
          <div class="px-4 pb-4 pt-2 text-xs text-slate-400 leading-relaxed border-t border-slate-600/50">
            {{ faq.a }}
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getRaidWings, getAccountRaids } from '../api/gw2'
import type { RaidWing } from '../types/gw2'
import type { EnrichedAchievement } from '../composables/useAchievements'
import type { AchievementBit } from '../types/gw2'

const props = defineProps<{
  achievements: EnrichedAchievement[]
  bitNamesCache: Map<string, string>
  resolveBitNames: (bits: AchievementBit[]) => Promise<void>
  apiKey: string
}>()

const raidWings = ref<RaidWing[]>([])
const doneRaids = ref<string[]>([])
const raidsExpanded = ref(true)

const raidsTotal = computed(() => raidWings.value.reduce((s, w) => s + w.events.length, 0))
const raidsDone = computed(() => doneRaids.value.length)

function wingDoneCount(wing: RaidWing): number {
  return wing.events.filter(e => doneRaids.value.includes(e.id)).length
}

function formatWingId(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatEventId(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

onMounted(async () => {
  try {
    const [wings, done] = await Promise.all([getRaidWings(), getAccountRaids(props.apiKey)])
    raidWings.value = wings
    doneRaids.value = done
  } catch {
    // silent — not everyone raids
  }
})

const openSections = ref(new Set<string>())
const expanded = ref(new Set<number>())
const copyFeedback = ref<number | null>(null)

function toggleSection(id: string) {
  if (openSections.value.has(id)) {
    openSections.value.delete(id)
  } else {
    openSections.value.add(id)
  }
  openSections.value = new Set(openSections.value)
}

const masteryAchievements = computed(() =>
  props.achievements
    .filter(a => !a.account.done && a.detail.rewards?.some(r => r.type === 'Mastery'))
    .sort((a, b) => b.progressPercent - a.progressPercent)
)

const titleAchievements = computed(() =>
  props.achievements
    .filter(a => !a.account.done && a.detail.rewards?.some(r => r.type === 'Title'))
    .sort((a, b) => b.progressPercent - a.progressPercent)
)

const skinAchievements = computed(() =>
  props.achievements
    .filter(a => !a.account.done && a.detail.bits?.some(b => ['Skin', 'Minipet', 'Item'].includes(b.type)))
    .sort((a, b) => b.progressPercent - a.progressPercent)
)

const repeatableAchievements = computed(() =>
  props.achievements
    .filter(a => a.detail.flags?.includes('Repeatable') && !a.account.done && (a.totalPoints - a.earnedPoints) > 0)
    .sort((a, b) => (b.totalPoints - b.earnedPoints) - (a.totalPoints - a.earnedPoints))
)

const sections = computed(() => [
  {
    id: 'mastery',
    icon: '🌟',
    title: 'Mastery Points',
    description: 'Incomplete achievements that reward mastery points — the currency for unlocking masteries across each expansion.',
    items: masteryAchievements.value,
  },
  {
    id: 'titles',
    icon: '🎖️',
    title: 'Titles',
    description: 'Achievements that unlock an account title on completion — wear them to show off your dedication.',
    items: titleAchievements.value,
  },
  {
    id: 'skins',
    icon: '👗',
    title: 'Skins & Collections',
    description: 'Achievements that track skin, mini, or item collection — great for wardrobe and collection completionists.',
    items: skinAchievements.value,
  },
  {
    id: 'repeatable',
    icon: '🔁',
    title: 'Repeatable',
    description: 'Achievements you can complete multiple times. They still earn AP each time up to their cap — ideal for ongoing progress.',
    items: repeatableAchievements.value,
  },
])

const faqs = [
  {
    q: 'How do Achievement Points work?',
    a: "AP don't give you power, but reaching milestones (every 500 AP up to 50,000) rewards laurels, gold, gems, and exclusive skins. Progress is account-wide and permanent.",
  },
  {
    q: 'Why do some players have 40,000+ AP?',
    a: 'Years of play, annual festival runs, PvP and WvW grinds, and grinding long-term collections all add up. The highest AP players have been playing since launch and repeat every festival each year.',
  },
  {
    q: "Why can't I progress a specific achievement?",
    a: "Possible reasons: prerequisites not met, time-gated content (festivals or dailies not yet available), group content (raids or strikes requiring a party), or removed content (Living World Season 1 story missions are no longer playable).",
  },
  {
    q: 'What are repeatable achievements?',
    a: 'Some achievements reset daily, annually, or after each completion. They still earn AP each time up to their point cap. Daily and annual festival achievements are the most common examples.',
  },
  {
    q: 'What are meta achievements?',
    a: 'Meta achievements are umbrella goals that require completing a defined subset of related sub-achievements — usually not 100% of them. They often reward exclusive items, titles, or large AP bonuses.',
  },
]

async function toggleExpand(item: EnrichedAchievement) {
  const id = item.account.id
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
    if (item.detail.bits?.some(b => b.type !== 'Text' && b.id != null)) {
      props.resolveBitNames(item.detail.bits!)
    }
  }
  expanded.value = new Set(expanded.value)
}

function wikiUrl(name: string): string {
  return `https://wiki.guildwars2.com/wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`
}

function nextTierFor(item: EnrichedAchievement) {
  if (item.detail.tiers.length <= 1) return null
  const current = item.account.current ?? 0
  return item.detail.tiers.find(t => t.count > current) ?? null
}

function isDisplayableBit(bit: AchievementBit): boolean {
  if (bit.type === 'Text') return !!bit.text?.trim()
  return bit.id != null
}

function remainingBitsFor(item: EnrichedAchievement): AchievementBit[] {
  if (!item.detail.bits) return []
  const doneBitIndices = new Set(item.account.bits ?? [])
  return item.detail.bits.filter((bit, idx) => !doneBitIndices.has(idx) && isDisplayableBit(bit))
}

function doneBitsFor(item: EnrichedAchievement): AchievementBit[] {
  if (!item.detail.bits) return []
  const doneBitIndices = new Set(item.account.bits ?? [])
  return item.detail.bits.filter((bit, idx) => doneBitIndices.has(idx) && isDisplayableBit(bit))
}

function displayableBitCount(item: EnrichedAchievement): number {
  return item.detail.bits?.filter(isDisplayableBit).length ?? 0
}

function getBitName(bit: AchievementBit): string {
  if (bit.type === 'Text') return bit.text!.trim()
  if (bit.id != null) {
    const cacheKey = `${bit.type.toLowerCase()}:${bit.id}`
    return props.bitNamesCache.get(cacheKey) ?? `${bit.type} #${bit.id}`
  }
  return 'Unknown task'
}

async function copyRemaining(item: EnrichedAchievement) {
  let text = ''
  if (item.detail.bits?.length && !item.account.done) {
    const remaining = remainingBitsFor(item)
    if (remaining.length === 0) return
    text = `${item.detail.name} — ${remaining.length} remaining:\n`
    text += remaining.map(b => `- ${getBitName(b)}`).join('\n')
  } else if (item.account.current != null && item.account.max != null) {
    const left = item.account.max - item.account.current
    text = `${item.detail.name} — ${item.account.current.toLocaleString()}/${item.account.max.toLocaleString()} (${item.progressPercent}% done), ${left.toLocaleString()} remaining`
  }
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copyFeedback.value = item.account.id
    setTimeout(() => { copyFeedback.value = null }, 2000)
  } catch {
    // Clipboard not available
  }
}
</script>
