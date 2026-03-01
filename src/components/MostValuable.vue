<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <div class="flex items-center justify-between mb-1 gap-3 flex-wrap">
      <h3 class="font-semibold text-white">
        Most Valuable Remaining
        <span class="text-purple-400">({{ visibleItems.length }})</span>
      </h3>
      <div class="flex items-center gap-3">
        <button
          @click="excludeFestivals = !excludeFestivals"
          class="text-xs px-3 py-1 rounded-lg border transition-colors"
          :class="excludeFestivals
            ? 'border-amber-400 text-amber-400 bg-amber-400/10'
            : 'border-slate-600 text-slate-400 hover:text-slate-200'"
          title="Festival achievements are time-gated and only available during seasonal events"
        >🎪 {{ excludeFestivals ? 'Festivals hidden' : 'Hide festivals' }}</button>
        <button
          v-if="expanded.size > 0"
          @click="expanded = new Set()"
          class="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >Collapse all</button>
      </div>
    </div>
    <p class="text-xs text-slate-500 mb-4">Incomplete achievements with the most AP still earnable — biggest gains first. Click any to see what's left and how to finish it</p>

    <div v-if="visibleItems.length === 0" class="text-slate-500 text-sm text-center py-4">
      No incomplete achievements with AP remaining found.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="item in visibleItems"
        :key="item.account.id"
        class="bg-slate-700/40 rounded-lg overflow-hidden"
      >
        <!-- Row header — always visible, clickable -->
        <div
          class="flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-700/70 transition-colors"
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
        <div v-if="expanded.has(item.account.id)" class="border-t border-slate-600/50 px-4 pb-4 pt-3 space-y-3">
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
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EnrichedAchievement } from '../composables/useAchievements'
import type { AchievementBit } from '../types/gw2'

const props = defineProps<{
  items: EnrichedAchievement[]
  bitNamesCache: Map<string, string>
  resolveBitNames: (bits: AchievementBit[]) => Promise<void>
}>()

defineEmits<{ select: [item: EnrichedAchievement] }>()

const expanded = ref(new Set<number>())
const copyFeedback = ref<number | null>(null)
const excludeFestivals = ref(false)

const FESTIVAL_KEYWORDS = [
  'wintersday', 'halloween', 'shadow of the mad king', 'blood and madness',
  'lunar new year', 'dragon bash', 'festival of the four winds',
  'bazaar of the four winds', 'super adventure', 'seasonal activities',
  'toymaker tixx', 'mad king',
]

const visibleItems = computed(() =>
  excludeFestivals.value
    ? props.items.filter(a => {
        const name = (a.category?.name ?? '').toLowerCase()
        return !FESTIVAL_KEYWORDS.some(kw => name.includes(kw))
      })
    : props.items
)

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
