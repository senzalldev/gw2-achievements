<template>
  <div class="space-y-6">
    <div v-if="loading" class="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
      <div class="text-3xl mb-2 animate-pulse">🏛️</div>
      <p class="text-slate-400 text-sm">Loading daily progress...</p>
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
      <SimpleChecklist
        v-if="allBosses.length > 0"
        title="World Bosses" icon="🐉"
        reset-label="Resets at 00:00 UTC"
        :all-ids="allBosses" :done-ids="doneBosses" :name-map="WORLD_BOSS_NAMES"
        :collapse-signal="collapseAll"
      />
      <SimpleChecklist
        title="Map Chests" icon="🗺️"
        reset-label="Resets at 00:00 UTC"
        :all-ids="ALL_MAP_CHEST_IDS" :done-ids="doneChests" :name-map="MAP_CHEST_NAMES"
        :collapse-signal="collapseAll"
      />
      <SimpleChecklist
        title="Dungeon Paths" icon="🏰"
        reset-label="Resets at 00:00 UTC"
        :all-ids="ALL_DUNGEON_IDS" :done-ids="donePaths" :name-map="DUNGEON_PATH_NAMES"
        :collapse-signal="collapseAll"
      />
      <RaidChecklist
        v-if="raidWings.length > 0"
        title="Raids" reset-label="Resets Monday at 07:30 UTC"
        :wings="raidWings" :done-events="doneRaids"
        :collapse-signal="collapseAll"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineComponent, h, computed, watch } from 'vue'
import {
  getWizardsVaultDaily, getWizardsVaultWeekly, getWizardsVaultSpecial,
  getAccountWorldBosses, getAccountMapChests, getAccountDungeons, getAccountRaids,
  getAllWorldBosses, getRaidWings,
} from '../api/gw2'
import type { WizardsVaultSection, WizardsVaultObjective, RaidWing } from '../types/gw2'

// ── static name maps ──────────────────────────────────────────────────────────

const WORLD_BOSS_NAMES: Record<string, string> = {
  admiral_taidha_covington: 'Admiral Taidha Covington',
  claw_of_jormag: 'Claw of Jormag',
  drakkar: 'Drakkar',
  fire_elemental: 'Fire Elemental',
  great_jungle_wurm: 'Great Jungle Wurm',
  inquest_golem_mark_ii: 'Inquest Golem Mark II',
  karka_queen: 'Karka Queen',
  megadestroyer: 'Megadestroyer',
  mists_and_monsters_titans: 'Mists and Monsters: Titans',
  modniir_ulgoth: 'Modniir Ulgoth',
  shadow_behemoth: 'Shadow Behemoth',
  svanir_shaman_chief: 'Svanir Shaman Chief',
  tequatl_the_sunless: 'Tequatl the Sunless',
  the_shatterer: 'The Shatterer',
  triple_trouble_wurm: 'Triple Trouble Wurm',
}

const MAP_CHEST_NAMES: Record<string, string> = {
  amnytas_heros_choice_chest: "Amnytas Hero's Choice Chest",
  auric_basin_heros_choice_chest: "Auric Basin Hero's Choice Chest",
  citadel_of_zakiros_heros_choice_chest: "Citadel of Zakiros Hero's Choice Chest",
  convergence_heros_choice_chest: "Convergence Hero's Choice Chest",
  crystal_oasis_heros_choice_chest: "Crystal Oasis Hero's Choice Chest",
  domain_of_vabbi_heros_choice_chest: "Domain of Vabbi Hero's Choice Chest",
  dragons_end_heros_choice_chest: "Dragon's End Hero's Choice Chest",
  dragons_stand_heros_choice_chest: "Dragon's Stand Hero's Choice Chest",
  echovald_wilds_heros_choice_chest: "Echovald Wilds Hero's Choice Chest",
  elon_riverlands_heros_choice_chest: "Elon Riverlands Hero's Choice Chest",
  gyala_delve_heros_choice_chest: "Gyala Delve Hero's Choice Chest",
  inner_nayos_heros_choice_chest: "Inner Nayos Hero's Choice Chest",
  new_kaineng_city_heros_choice_chest: "New Kaineng City Hero's Choice Chest",
  seitung_province_heros_choice_chest: "Seitung Province Hero's Choice Chest",
  skywatch_archipelago_heros_choice_chest: "Skywatch Archipelago Hero's Choice Chest",
  tangled_depths_heros_choice_chest: "Tangled Depths Hero's Choice Chest",
  the_desolation_heros_choice_chest: "The Desolation Hero's Choice Chest",
  verdant_brink_heros_choice_chest: "Verdant Brink Hero's Choice Chest",
  wild_island_heros_choice_chest: "Wild Island Hero's Choice Chest",
}

const DUNGEON_PATH_NAMES: Record<string, string> = {
  ac_story: 'AC Story', hodgins: 'AC — Hodgins', detha: 'AC — Detha', tzark: 'AC — Tzark',
  cm_story: 'CM Story', asura: 'CM — Asura', seraph: 'CM — Seraph', butler: 'CM — Butler',
  ta_story: 'TA Story', leurent: 'TA — Leurent', vevina: 'TA — Vevina', aetherpath: 'TA — Aetherpath',
  se_story: 'SE Story', fergg: 'SE — Fergg', rasalov: 'SE — Rasalov', koptev: 'SE — Koptev',
  cof_story: 'CoF Story', ferrah: 'CoF — Ferrah', magg: 'CoF — Magg', rhiannon: 'CoF — Rhiannon',
  hotw_story: 'HotW Story', butcher: 'HotW — Butcher', plunderer: 'HotW — Plunderer', zealot: 'HotW — Zealot',
  coe_story: 'CoE Story', submarine: 'CoE — Submarine', teleporter: 'CoE — Teleporter', front_door: 'CoE — Front Door',
  arah_story: 'Arah Story', jotun: 'Arah — Jotun', mursaat: 'Arah — Mursaat', forgotten: 'Arah — Forgotten', seer: 'Arah — Seer',
}

const RAID_WING_NAMES: Record<string, string> = {
  spirit_vale: 'Spirit Vale',
  salvation_pass: 'Salvation Pass',
  stronghold_of_the_faithful: 'Stronghold of the Faithful',
  bastion_of_the_penitent: 'Bastion of the Penitent',
  hall_of_chains: 'Hall of Chains',
  mythwright_gambit: 'Mythwright Gambit',
  the_key_of_ahdashim: 'The Key of Ahdashim',
  mount_balrior: 'Mount Balrior',
}

const RAID_EVENT_NAMES: Record<string, string> = {
  vale_guardian: 'Vale Guardian', spirit_woods: 'Spirit Woods', gorseval: 'Gorseval', sabetha: 'Sabetha',
  slothasor: 'Slothasor', bandit_trio: 'Bandit Trio', matthias: 'Matthias',
  escort: 'Escort', keep_construct: 'Keep Construct', twisted_castle: 'Twisted Castle', xera: 'Xera',
  cairn: 'Cairn', mursaat_overseer: 'Mursaat Overseer', samarog: 'Samarog', deimos: 'Deimos',
  soulless_horror: 'Soulless Horror', river_of_souls: 'River of Souls', statues_of_grenth: 'Statues of Grenth', voice_in_the_void: 'Voice in the Void',
  conjured_amalgamate: 'Conjured Amalgamate', twin_largos: 'Twin Largos', qadim: 'Qadim',
  gate: 'Gate', adina: 'Adina', sabir: 'Sabir', qadim_the_peerless: 'Qadim the Peerless',
  camp: 'Camp', greer: 'Greer', decima: 'Decima', ura: 'Ura',
}

const ALL_MAP_CHEST_IDS = Object.keys(MAP_CHEST_NAMES)
const ALL_DUNGEON_IDS = Object.keys(DUNGEON_PATH_NAMES)

function formatId(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

// ── SimpleChecklist sub-component ────────────────────────────────────────────

const SimpleChecklist = defineComponent({
  name: 'SimpleChecklist',
  props: {
    title: { type: String, required: true },
    icon: { type: String, required: true },
    resetLabel: { type: String, required: true },
    allIds: { type: Array as () => string[], required: true },
    doneIds: { type: Array as () => string[], required: true },
    nameMap: { type: Object as () => Record<string, string>, required: true },
    collapseSignal: { type: Number, default: 0 },
  },
  setup(props) {
    const expanded = ref(true)
    watch(() => props.collapseSignal, () => { expanded.value = false })

    const doneSet = computed(() => new Set(props.doneIds))
    const done = computed(() => props.allIds.filter(id => doneSet.value.has(id)).length)
    const total = computed(() => props.allIds.length)

    const sortedIds = computed(() =>
      [...props.allIds].sort((a, b) => {
        const aDone = doneSet.value.has(a)
        const bDone = doneSet.value.has(b)
        if (aDone === bDone) return 0
        return aDone ? 1 : -1
      })
    )

    return () => {
      const header = h(
        'button',
        {
          class: 'w-full flex items-center justify-between gap-3 text-left group',
          onClick: () => { expanded.value = !expanded.value },
        },
        [
          h('div', { class: 'flex items-center gap-3' }, [
            h('span', { class: 'text-xl' }, props.icon),
            h('div', {}, [
              h('h3', { class: 'font-semibold text-white group-hover:text-amber-300 transition-colors' }, props.title),
              h('p', { class: 'text-xs text-slate-500' }, props.resetLabel),
            ]),
          ]),
          h('div', { class: 'flex items-center gap-4 shrink-0' }, [
            h('div', { class: 'text-sm font-semibold text-amber-400' }, `${done.value} / ${total.value} done`),
            h('span', {
              class: `text-slate-400 transition-transform duration-200 ${expanded.value ? 'rotate-180' : ''}`,
              style: { display: 'inline-block' },
            }, '▼'),
          ]),
        ]
      )

      const body = expanded.value
        ? h('div', { class: 'mt-4 space-y-1' },
            sortedIds.value.map(id => {
              const isDone = doneSet.value.has(id)
              const name = props.nameMap[id] ?? formatId(id)
              return h('div', {
                key: id,
                class: `flex items-center gap-3 rounded-lg px-3 py-2 ${isDone ? 'bg-slate-700/20' : 'bg-slate-700/50'}`,
              }, [
                h('span', { class: 'text-base shrink-0' }, isDone ? '✅' : '⬜'),
                h('span', { class: `text-sm ${isDone ? 'text-slate-500 line-through' : 'text-white'}` }, name),
              ])
            })
          )
        : null

      return h('div', { class: 'bg-slate-800 rounded-xl p-5 border border-slate-700' }, [header, body])
    }
  },
})

// ── RaidChecklist sub-component ───────────────────────────────────────────────

const RaidChecklist = defineComponent({
  name: 'RaidChecklist',
  props: {
    title: { type: String, required: true },
    resetLabel: { type: String, required: true },
    wings: { type: Array as () => RaidWing[], required: true },
    doneEvents: { type: Array as () => string[], required: true },
    collapseSignal: { type: Number, default: 0 },
  },
  setup(props) {
    const expanded = ref(true)
    watch(() => props.collapseSignal, () => { expanded.value = false })

    const doneSet = computed(() => new Set(props.doneEvents))
    const total = computed(() => props.wings.reduce((s, w) => s + w.events.length, 0))
    const done = computed(() => props.wings.reduce((s, w) => s + w.events.filter(e => doneSet.value.has(e.id)).length, 0))

    return () => {
      const header = h(
        'button',
        {
          class: 'w-full flex items-center justify-between gap-3 text-left group',
          onClick: () => { expanded.value = !expanded.value },
        },
        [
          h('div', { class: 'flex items-center gap-3' }, [
            h('span', { class: 'text-xl' }, '⚔️'),
            h('div', {}, [
              h('h3', { class: 'font-semibold text-white group-hover:text-amber-300 transition-colors' }, props.title),
              h('p', { class: 'text-xs text-slate-500' }, props.resetLabel),
            ]),
          ]),
          h('div', { class: 'flex items-center gap-4 shrink-0' }, [
            h('div', { class: 'text-sm font-semibold text-amber-400' }, `${done.value} / ${total.value} done`),
            h('span', {
              class: `text-slate-400 transition-transform duration-200 ${expanded.value ? 'rotate-180' : ''}`,
              style: { display: 'inline-block' },
            }, '▼'),
          ]),
        ]
      )

      const body = expanded.value
        ? h('div', { class: 'mt-4 space-y-4' },
            props.wings.map(wing => {
              const wingDone = wing.events.filter(e => doneSet.value.has(e.id)).length
              const wingName = RAID_WING_NAMES[wing.id] ?? formatId(wing.id)
              const allWingDone = wingDone === wing.events.length

              return h('div', { key: wing.id }, [
                h('div', { class: 'flex items-center justify-between mb-2' }, [
                  h('span', { class: `text-sm font-medium ${allWingDone ? 'text-emerald-400' : 'text-white'}` }, wingName),
                  h('span', { class: 'text-xs text-slate-500' }, `${wingDone} / ${wing.events.length}`),
                ]),
                h('div', { class: 'flex flex-wrap gap-2' },
                  wing.events.map(event => {
                    const eventDone = doneSet.value.has(event.id)
                    const eventName = RAID_EVENT_NAMES[event.id] ?? formatId(event.id)
                    return h('span', {
                      key: event.id,
                      class: `text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                        eventDone ? 'bg-emerald-900/40 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`,
                    }, [
                      h('span', {}, eventDone ? '✅' : '⬜'),
                      h('span', {}, eventName),
                    ])
                  })
                ),
              ])
            })
          )
        : null

      return h('div', { class: 'bg-slate-800 rounded-xl p-5 border border-slate-700' }, [header, body])
    }
  },
})

// ── VaultSection sub-component ────────────────────────────────────────────────

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

      const body = expanded.value
        ? h('div', { class: 'mt-4 space-y-4' }, [

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

const allBosses = ref<string[]>([])
const doneBosses = ref<string[]>([])
const doneChests = ref<string[]>([])
const donePaths = ref<string[]>([])
const raidWings = ref<RaidWing[]>([])
const doneRaids = ref<string[]>([])

onMounted(async () => {
  const results = await Promise.allSettled([
    getWizardsVaultDaily(props.apiKey),   // 0
    getWizardsVaultWeekly(props.apiKey),  // 1
    getWizardsVaultSpecial(props.apiKey), // 2
    getAccountWorldBosses(props.apiKey),  // 3
    getAccountMapChests(props.apiKey),    // 4
    getAccountDungeons(props.apiKey),     // 5
    getAccountRaids(props.apiKey),        // 6
    getAllWorldBosses(),                   // 7
    getRaidWings(),                       // 8
  ])

  const [r0, r1, r2, r3, r4, r5, r6, r7, r8] = results

  if (r0.status === 'fulfilled') daily.value = r0.value
  if (r1.status === 'fulfilled') weekly.value = r1.value
  if (r2.status === 'fulfilled') special.value = r2.value
  if (r3.status === 'fulfilled') doneBosses.value = r3.value
  if (r4.status === 'fulfilled') doneChests.value = r4.value
  if (r5.status === 'fulfilled') donePaths.value = r5.value
  if (r6.status === 'fulfilled') doneRaids.value = r6.value
  if (r7.status === 'fulfilled') allBosses.value = r7.value
  if (r8.status === 'fulfilled') raidWings.value = r8.value

  if (!daily.value && !weekly.value && !special.value) {
    const msg = r0.status === 'rejected' ? (r0.reason as Error).message : 'Unknown error'
    error.value = msg
  }
  loading.value = false
})
</script>
