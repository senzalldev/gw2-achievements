<template>
  <div class="space-y-6">
    <div v-if="loading" class="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
      <div class="text-3xl mb-2 animate-pulse">🏛️</div>
      <p class="text-slate-400 text-sm">Loading your Wizard's Vault objectives...</p>
    </div>

    <div v-else-if="error" class="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <p class="text-red-300 text-sm p-3 bg-red-900/20 border border-red-800 rounded-lg">{{ error }}</p>
    </div>

    <template v-else>
      <div class="flex justify-end">
        <button
          @click="collapseAll++"
          class="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >Collapse all</button>
      </div>
      <VaultSection v-if="daily"   key="daily"   title="Daily"   reset-label="Resets at 00:00 UTC"            :section="daily"   :collapse-signal="collapseAll" />
      <VaultSection v-if="weekly"  key="weekly"  title="Weekly"  reset-label="Resets Monday at 07:30 UTC"     :section="weekly"  :collapse-signal="collapseAll" />
      <VaultSection v-if="special" key="special" title="Special" reset-label="Limited-time objectives"        :section="special" :collapse-signal="collapseAll" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineComponent, h, computed, watch } from 'vue'
import { getWizardsVaultDaily, getWizardsVaultWeekly, getWizardsVaultSpecial } from '../api/gw2'
import type { WizardsVaultSection, WizardsVaultObjective } from '../types/gw2'

// ── inline sub-component ──────────────────────────────────────────────────────

const VaultSection = defineComponent({
  name: 'VaultSection',
  props: {
    title: { type: String, required: true },
    resetLabel: { type: String, required: true },
    section: { type: Object as () => WizardsVaultSection, required: true },
    collapseSignal: { type: Number, default: 0 },
  },
  setup(props) {
    const expanded = ref(true)
    watch(() => props.collapseSignal, () => { expanded.value = false })

    const done = computed(() =>
      props.section.objectives.filter(o => o.claimed || o.progress_current >= o.progress_complete).length
    )
    const total = computed(() => props.section.objectives.length)
    const totalAcclaim = computed(() => props.section.objectives.reduce((s, o) => s + o.acclaim, 0))
    const metaPct = computed(() =>
      props.section.meta_progress_complete > 0
        ? Math.min(100, Math.round(props.section.meta_progress_current / props.section.meta_progress_complete * 100))
        : 100
    )

    function isDone(o: WizardsVaultObjective) {
      return o.claimed || o.progress_current >= o.progress_complete
    }
    function objPct(o: WizardsVaultObjective) {
      return o.progress_complete > 0
        ? Math.min(100, Math.round(o.progress_current / o.progress_complete * 100))
        : 100
    }

    return () => {
      const sec = props.section

      // ── header (always visible, clickable) ──────────────────────────────
      const header = h(
        'button',
        {
          class: 'w-full flex items-center justify-between gap-3 text-left group',
          onClick: () => { expanded.value = !expanded.value },
        },
        [
          h('div', { class: 'flex items-center gap-3' }, [
            h('span', { class: 'text-xl' }, '🏛️'),
            h('div', {}, [
              h('h3', { class: 'font-semibold text-white group-hover:text-amber-300 transition-colors' }, props.title),
              h('p', { class: 'text-xs text-slate-500' }, props.resetLabel),
            ]),
          ]),
          h('div', { class: 'flex items-center gap-4 shrink-0' }, [
            h('div', { class: 'text-right' }, [
              h('div', { class: 'text-sm font-semibold text-amber-400' }, `${done.value} / ${total.value} done`),
              h('div', { class: 'text-xs text-slate-500' }, `${totalAcclaim.value} ✦ available`),
            ]),
            h('span', {
              class: `text-slate-400 transition-transform duration-200 ${expanded.value ? 'rotate-180' : ''}`,
              style: { display: 'inline-block' },
            }, '▼'),
          ]),
        ]
      )

      // ── collapsible body ─────────────────────────────────────────────────
      const body = expanded.value
        ? h('div', { class: 'mt-4 space-y-4' }, [

            // meta reward progress bar
            h('div', { class: 'p-3 bg-slate-700/40 rounded-lg' }, [
              h('div', { class: 'flex items-center justify-between text-xs mb-1.5' }, [
                h('span', { class: 'text-slate-400' }, 'Meta reward progress'),
                h('span', { class: sec.meta_reward_claimed ? 'text-emerald-400' : 'text-amber-400' },
                  sec.meta_reward_claimed
                    ? '✓ Claimed'
                    : `${sec.meta_progress_current} / ${sec.meta_progress_complete}`
                ),
              ]),
              h('div', { class: 'w-full bg-slate-600 rounded-full h-1.5' }, [
                h('div', {
                  class: `h-1.5 rounded-full ${sec.meta_reward_claimed ? 'bg-emerald-500' : 'bg-amber-400'}`,
                  style: { width: metaPct.value + '%' },
                }),
              ]),
              h('div', { class: 'text-xs text-slate-500 mt-1' },
                `+${sec.meta_reward_astral} ✦ Astral Acclaim on completion`
              ),
            ]),

            // objective list
            h('div', { class: 'space-y-2' },
              sec.objectives.map(obj =>
                h('div', {
                  key: obj.id,
                  class: `flex items-center gap-3 rounded-lg px-3 py-2.5 ${isDone(obj) ? 'bg-slate-700/20' : 'bg-slate-700/50'}`,
                }, [
                  h('span', { class: 'text-lg shrink-0' }, isDone(obj) ? '✅' : '⬜'),
                  h('div', { class: 'flex-1 min-w-0' }, [
                    h('div', {
                      class: `text-sm font-medium ${isDone(obj) ? 'text-slate-500 line-through' : 'text-white'}`,
                    }, obj.title),
                    obj.progress_complete > 1
                      ? h('div', { class: 'flex items-center gap-2 mt-1' }, [
                          h('div', { class: 'flex-1 bg-slate-600 rounded-full h-1' }, [
                            h('div', {
                              class: `h-1 rounded-full ${isDone(obj) ? 'bg-emerald-500' : 'bg-amber-400'}`,
                              style: { width: objPct(obj) + '%' },
                            }),
                          ]),
                          h('span', { class: 'text-xs text-slate-500 font-mono whitespace-nowrap' },
                            `${obj.progress_current} / ${obj.progress_complete}`
                          ),
                        ])
                      : null,
                  ]),
                  h('div', {
                    class: `text-xs font-semibold shrink-0 ${isDone(obj) ? 'text-slate-600' : 'text-amber-400'}`,
                  }, `+${obj.acclaim} ✦`),
                ])
              )
            ),
          ])
        : null

      return h('div', { class: 'bg-slate-800 rounded-xl p-5 border border-slate-700' }, [header, body])
    }
  },
})

// ── main component ────────────────────────────────────────────────────────────

const props = defineProps<{ apiKey: string }>()

const loading = ref(true)
const error = ref('')
const daily = ref<WizardsVaultSection | null>(null)
const weekly = ref<WizardsVaultSection | null>(null)
const special = ref<WizardsVaultSection | null>(null)
const collapseAll = ref(0)

onMounted(async () => {
  const results = await Promise.allSettled([
    getWizardsVaultDaily(props.apiKey),
    getWizardsVaultWeekly(props.apiKey),
    getWizardsVaultSpecial(props.apiKey),
  ])
  if (results[0].status === 'fulfilled') daily.value = results[0].value
  if (results[1].status === 'fulfilled') weekly.value = results[1].value
  if (results[2].status === 'fulfilled') special.value = results[2].value

  if (!daily.value && !weekly.value && !special.value) {
    const msg = results[0].status === 'rejected' ? (results[0].reason as Error).message : 'Unknown error'
    error.value = msg
  }
  loading.value = false
})
</script>
