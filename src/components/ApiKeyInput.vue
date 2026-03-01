<template>
  <div class="min-h-screen bg-slate-900 flex items-center justify-center p-4">
    <div class="w-full max-w-xl">
      <!-- Logo / Title -->
      <div class="text-center mb-8">
        <div class="text-6xl mb-3">⚔️</div>
        <h1 class="text-4xl font-bold text-amber-400 mb-2">GW2 Achievement Tracker</h1>
        <p class="text-slate-400">See your progress, what remains, and charts for every category.</p>
      </div>

      <!-- Card -->
      <div class="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">

        <!-- Saved accounts view -->
        <template v-if="!showAddForm && props.savedAccounts.length > 0">
          <h2 class="text-lg font-semibold text-white mb-1">Your accounts</h2>
          <p class="text-sm text-slate-400 mb-5">Select an account to load, or add a new one.</p>

          <div class="space-y-2 mb-5">
            <div
              v-for="acct in props.savedAccounts"
              :key="acct.key"
              class="flex items-center gap-2 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2.5"
            >
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-white truncate">
                  {{ acct.accountName || '…' }}
                </div>
                <div class="text-xs text-slate-500 font-mono truncate">{{ acct.key.slice(0, 8) }}…</div>
              </div>
              <button
                type="button"
                @click="emit('submit', acct.key)"
                :disabled="loading"
                class="shrink-0 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed
                       text-slate-900 font-bold text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                {{ loading ? '…' : 'Connect' }}
              </button>
              <button
                type="button"
                @click="emit('remove', acct.key)"
                class="shrink-0 text-slate-500 hover:text-red-400 transition-colors text-lg leading-none px-1"
                title="Remove account"
              >×</button>
            </div>
          </div>

          <button
            type="button"
            @click="showAddForm = true"
            class="w-full border border-dashed border-slate-600 hover:border-amber-400/50 text-slate-400
                   hover:text-amber-400 rounded-lg py-2.5 text-sm transition-colors"
          >
            + Add Account
          </button>
        </template>

        <!-- Key input form -->
        <template v-else>
          <h2 class="text-lg font-semibold text-white mb-1">Enter your tracker key</h2>
          <p class="text-sm text-slate-400 mb-5">
            Generate a personal tracker key at
            <a href="https://account.arena.net/applications" target="_blank" rel="noopener"
               class="text-amber-400 hover:text-amber-300 underline">account.arena.net</a>.
            Name it anything and enable the <strong class="text-white">Progression</strong> permission.
          </p>

          <form @submit.prevent="submit">
            <input
              v-model="key"
              type="text"
              placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXXXXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
              class="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-3 text-sm font-mono
                     placeholder-slate-600 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400
                     transition mb-4"
              :disabled="loading"
              spellcheck="false"
              autocomplete="off"
            />

            <button
              type="submit"
              :disabled="!key.trim() || loading"
              class="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed
                     text-slate-900 font-bold py-3 rounded-lg transition-colors"
            >
              {{ loading ? loadingStage : 'Load My Achievements' }}
            </button>
          </form>

          <button
            v-if="props.savedAccounts.length > 0"
            type="button"
            @click="showAddForm = false"
            class="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            ← Back to saved accounts
          </button>
        </template>

        <div v-if="error" class="mt-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
          {{ error }}
        </div>

        <!-- Privacy note -->
        <p class="mt-5 text-xs text-slate-500 text-center">
          Your tracker key is saved locally in your browser for convenience and only used to call the official GW2 API directly.
          It is never sent to any other server.
        </p>
      </div>

      <!-- Feature highlights -->
      <div class="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div
          v-for="f in features"
          :key="f.label"
          class="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3"
        >
          <div class="text-xl mb-1">{{ f.icon }}</div>
          <div class="text-sm font-medium text-slate-300">{{ f.label }}</div>
          <div class="text-xs text-slate-500 mt-0.5">{{ f.desc }}</div>
        </div>
      </div>
      <p class="mt-4 text-xs text-slate-600 text-center">
        Zero backend · No account · Data stays in your browser
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SavedAccount } from '../types/gw2'

const features = [
  { icon: '📊', label: 'Overview',      desc: 'AP progress charts & category breakdown' },
  { icon: '🏃', label: 'Almost Done',   desc: 'Achievements closest to completion' },
  { icon: '💎', label: 'Most Valuable', desc: 'Most AP still on the table' },
  { icon: '🌟', label: 'Goals',         desc: 'Masteries, titles & skins' },
  { icon: '📅', label: 'Daily',         desc: "Today's Wizard's Vault tasks" },
  { icon: '🔍', label: 'Browse All',    desc: 'Full list with Raids, Fractals & more' },
]

const props = defineProps<{
  loading: boolean
  loadingStage: string
  error: string
  savedAccounts?: SavedAccount[]
}>()

const emit = defineEmits<{
  submit: [key: string]
  remove: [key: string]
}>()

const showAddForm = ref((props.savedAccounts?.length ?? 0) === 0)
const key = ref('')

function submit() {
  if (key.value.trim()) emit('submit', key.value.trim())
}
</script>
