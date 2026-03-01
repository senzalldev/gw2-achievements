<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <h3 class="font-semibold text-white mb-4">Browse Achievements</h3>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-4">
      <input
        v-model="search"
        type="text"
        placeholder="Search by name..."
        class="flex-1 bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm
               placeholder-slate-600 focus:outline-none focus:border-amber-400 transition"
      />
      <select
        v-model="selectedCategory"
        class="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:border-amber-400 transition min-w-0 sm:w-56"
      >
        <option value="">All Categories</option>
        <option v-for="cat in sortedCategories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </option>
      </select>
      <select
        v-model="statusFilter"
        class="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:border-amber-400 transition sm:w-40"
      >
        <option value="incomplete">Incomplete</option>
        <option value="all">All</option>
        <option value="done">Completed</option>
        <option value="inprogress">In Progress</option>
      </select>
    </div>

    <!-- Count -->
    <div class="text-xs text-slate-500 mb-3">
      Showing {{ visible.length }} of {{ filtered.length }} achievements
    </div>

    <!-- List -->
    <div v-if="visible.length === 0" class="text-slate-500 text-sm text-center py-8">
      No achievements match your filters.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="item in visible"
        :key="item.account.id"
        class="bg-slate-700/40 rounded-lg p-3 hover:bg-slate-700/70 transition-colors cursor-pointer"
        @click="toggleExpand(item.account.id)"
      >
        <!-- Row summary -->
        <div class="flex items-center gap-3">
          <!-- Status icon -->
          <span class="text-lg shrink-0">
            {{ item.account.done ? '✅' : (item.account.current ?? 0) > 0 ? '🔄' : '⬜' }}
          </span>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-white">{{ item.detail.name }}</span>
              <span v-if="item.category" class="text-xs bg-slate-600 text-amber-300 px-2 py-0.5 rounded-full">
                {{ item.category.name }}
              </span>
            </div>

            <!-- Inline progress for in-progress -->
            <div v-if="!item.account.done && (item.account.current ?? 0) > 0" class="flex items-center gap-2 mt-1">
              <div class="flex-1 bg-slate-600 rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full bg-amber-400"
                  :style="{ width: item.progressPercent + '%' }"
                ></div>
              </div>
              <span class="text-xs text-slate-400 font-mono whitespace-nowrap">
                {{ item.account.current?.toLocaleString() }}/{{ item.account.max?.toLocaleString() }}
              </span>
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="text-xs font-semibold" :class="item.account.done ? 'text-emerald-400' : 'text-purple-400'">
              {{ item.earnedPoints }} / {{ item.totalPoints }} AP
            </div>
            <div class="text-xs text-slate-500">{{ item.progressPercent }}%</div>
          </div>
        </div>

        <!-- Expanded detail -->
        <div v-if="expanded.has(item.account.id)" class="mt-3 pt-3 border-t border-slate-600">
          <p v-if="item.detail.requirement" class="text-xs text-slate-400 mb-2">
            <strong class="text-slate-300">Requirement:</strong> {{ item.detail.requirement }}
          </p>
          <p v-if="item.detail.description" class="text-xs text-slate-400 mb-2">
            {{ item.detail.description }}
          </p>

          <!-- Tiers -->
          <div v-if="item.detail.tiers.length > 1" class="mt-2">
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
        </div>
      </div>
    </div>

    <!-- Load more -->
    <div v-if="filtered.length > visibleCount" class="mt-4 text-center">
      <button
        @click="visibleCount += 50"
        class="text-sm text-amber-400 hover:text-amber-300 border border-amber-400/30 hover:border-amber-400
               px-4 py-2 rounded-lg transition-colors"
      >
        Show more ({{ filtered.length - visibleCount }} remaining)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EnrichedAchievement } from '../composables/useAchievements'
import type { AchievementCategory } from '../types/gw2'

const props = defineProps<{
  achievements: EnrichedAchievement[]
  categories: AchievementCategory[]
  presetCategory?: number | ''
}>()

const search = ref('')
const selectedCategory = ref<number | ''>(props.presetCategory ?? '')

watch(() => props.presetCategory, (val) => {
  if (val !== undefined) selectedCategory.value = val
})
const statusFilter = ref<'all' | 'incomplete' | 'done' | 'inprogress'>('incomplete')
const visibleCount = ref(50)
const expanded = ref(new Set<number>())

const sortedCategories = computed(() =>
  [...props.categories].sort((a, b) => a.name.localeCompare(b.name))
)

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  return props.achievements.filter(a => {
    if (q && !a.detail.name.toLowerCase().includes(q)) return false
    if (selectedCategory.value !== '' && a.category?.id !== selectedCategory.value) return false
    if (statusFilter.value === 'done' && !a.account.done) return false
    if (statusFilter.value === 'incomplete' && a.account.done) return false
    if (statusFilter.value === 'inprogress' && (a.account.done || (a.account.current ?? 0) === 0)) return false
    return true
  })
})

const visible = computed(() => filtered.value.slice(0, visibleCount.value))

function toggleExpand(id: number) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
  // Trigger reactivity
  expanded.value = new Set(expanded.value)
}
</script>
