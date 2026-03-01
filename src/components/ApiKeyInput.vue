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
        <h2 class="text-lg font-semibold text-white mb-1">Enter your tracker key</h2>
        <p class="text-sm text-slate-400 mb-5">
          Generate a personal tracker key at
          <a href="https://account.arena.net/applications" target="_blank" rel="noopener"
             class="text-amber-400 hover:text-amber-300 underline">account.arena.net</a>.
          Name it anything and enable the <strong class="text-white">Progression</strong> permission.
        </p>

        <!-- Remembered key notice -->
        <div v-if="savedKey && !clearedKey" class="mb-4 flex items-center justify-between bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2">
          <span class="text-xs text-slate-400">Key remembered from your last visit</span>
          <button
            type="button"
            @click="clearKey"
            class="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Use a different key
          </button>
        </div>

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
  savedKey?: string
}>()

const emit = defineEmits<{
  submit: [key: string]
}>()

const key = ref(props.savedKey ?? '')
const clearedKey = ref(false)

function clearKey() {
  key.value = ''
  clearedKey.value = true
}

function submit() {
  if (key.value.trim()) emit('submit', key.value.trim())
}
</script>
