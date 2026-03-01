<template>
  <div class="space-y-6 max-w-3xl">

    <!-- Hero -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div class="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 class="text-2xl font-bold text-amber-400">⚔️ GW2 Achievement Tracker</h2>
          <p class="text-slate-400 mt-1">Your personal Guild Wars 2 achievement companion</p>
        </div>
        <div class="text-right shrink-0">
          <div class="inline-flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-1.5">
            <span class="text-xs text-slate-400">Version</span>
            <span class="text-sm font-bold text-amber-400">{{ APP_VERSION }}</span>
          </div>
          <div class="text-xs text-slate-500 mt-1">Updated {{ LAST_UPDATED }}</div>
        </div>
      </div>
    </div>

    <!-- What it does -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold text-white mb-3 flex items-center gap-2">
        <span>🗺️</span> What This App Does
      </h3>
      <p class="text-sm text-slate-300 leading-relaxed mb-3">
        GW2 Achievement Tracker connects to the official Guild Wars 2 API using your personal API key
        and gives you a smarter way to explore your achievement progress than the in-game panel allows.
      </p>
      <ul class="space-y-2 text-sm text-slate-400">
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Almost Done</strong> — achievements you're closest to completing, sorted by progress</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Most Valuable</strong> — incomplete achievements with the most AP still on the table</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Goals</strong> — smart filters for mastery points, titles, skins, and repeatables</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Browse All</strong> — full searchable achievement list with content group, status, and type filters (including Raids, Fractals, PvP)</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Daily & Masteries</strong> — today's Wizard's Vault objectives and your mastery track progress</span>
        </li>
      </ul>
    </div>

    <!-- Privacy & API key -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold text-white mb-3 flex items-center gap-2">
        <span>🔑</span> Your API Key & Privacy
      </h3>
      <div class="space-y-3 text-sm text-slate-400">
        <p>
          Your GW2 API key is saved in your browser's
          <strong class="text-slate-300">localStorage</strong> — the same place browsers remember
          settings and preferences for websites. It never leaves your device except to make requests
          directly to <strong class="text-slate-300">api.guildwars2.com</strong>.
        </p>
        <p>
          There is <strong class="text-slate-300">no server, no database, and no account</strong>
          behind this app. Nothing you do here is logged or stored anywhere other than your own browser.
          Click <strong class="text-slate-300">Switch Account</strong> in the header to clear the saved key.
        </p>
        <div class="bg-slate-700/40 rounded-lg p-3 border border-slate-600/50">
          <p class="text-xs text-slate-400">
            <strong class="text-amber-400">Permissions needed:</strong>
            Your API key only needs the <strong class="text-slate-300">Progression</strong> permission
            to use this tracker. You can create a key with only that scope at
            <a href="https://account.arena.net/applications" target="_blank" rel="noopener"
               class="text-amber-400 hover:text-amber-300 transition-colors">account.arena.net/applications ↗</a>
          </p>
        </div>
      </div>
    </div>

    <!-- API Limitations -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold text-white mb-3 flex items-center gap-2">
        <span>⚠️</span> API Limitations
      </h3>
      <p class="text-sm text-slate-400 mb-3">
        The GW2 API is powerful but has some gaps worth knowing about:
      </p>
      <ul class="space-y-2 text-sm text-slate-400">
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Counter achievements</strong> show a number but no list of sub-tasks
          (e.g. "498 more to go"). The wiki has the full breakdown of what counts.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Living World Season 1</strong> achievements are no longer completable
          and may appear with incorrect progress.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Festival achievements</strong> are time-gated and only available
          during seasonal events. Use the "Hide festivals" toggle in Most Valuable and the AP chart to
          see year-round opportunities.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Achievement groups</strong> ("Raids", "Fractals", etc.) have no
          official "Festivals" group in the API — festival detection uses category name matching.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Data is live</strong> but not real-time — reload the page to
          refresh your progress after a play session.</span>
        </li>
      </ul>
    </div>

    <!-- Tech stack -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold text-white mb-3 flex items-center gap-2">
        <span>🛠️</span> Tech Stack
      </h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div v-for="tech in techStack" :key="tech.name"
             class="bg-slate-700/40 rounded-lg p-3 border border-slate-600/50">
          <div class="text-lg mb-1">{{ tech.icon }}</div>
          <div class="text-sm font-medium text-white">{{ tech.name }}</div>
          <div class="text-xs text-slate-500">{{ tech.role }}</div>
        </div>
      </div>
      <p class="text-xs text-slate-500 mt-4">
        Deployed as a static site on <strong class="text-slate-400">GitHub Pages</strong> via GitHub Actions.
        No server required — every API call goes browser-to-ArenaNet directly.
      </p>
    </div>

    <!-- Fun facts -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold text-white mb-3 flex items-center gap-2">
        <span>✨</span> Fun Facts
      </h3>
      <ul class="space-y-2 text-sm text-slate-400">
        <li class="flex items-start gap-2"><span class="text-purple-400 shrink-0 mt-0.5">★</span>
          <span>On first load the app can fetch details for <strong class="text-slate-300">thousands of achievements</strong> in parallel, batched into groups of 200 — the maximum the GW2 API supports per request.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-purple-400 shrink-0 mt-0.5">★</span>
          <span>Skin, mini, and item names for "Still to do" lists are resolved <strong class="text-slate-300">lazily</strong> — only fetched when you expand an achievement, then cached for the rest of the session.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-purple-400 shrink-0 mt-0.5">★</span>
          <span>AP calculations for <strong class="text-slate-300">repeatable achievements</strong> (like Agent of Entropy) correctly account for all previous completions via the <code class="text-amber-400">repeated</code> field — so capped achievements don't falsely appear as valuable.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-purple-400 shrink-0 mt-0.5">★</span>
          <span>Clicking a bar in the <strong class="text-slate-300">AP by Category</strong> chart jumps straight to Browse All filtered to that category — and clicking a donut segment filters by completion status.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-purple-400 shrink-0 mt-0.5">★</span>
          <span>The entire app is <strong class="text-slate-300">zero-backend</strong> — there's no login, no account, and no way for anyone to see your data. It's just you and ArenaNet's API.</span>
        </li>
      </ul>
    </div>

    <!-- Credits -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold text-white mb-4 flex items-center gap-2">
        <span>🏆</span> Credits
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="flex items-start gap-3 bg-slate-700/40 rounded-lg p-4 border border-slate-600/50">
          <div class="text-3xl shrink-0">⚔️</div>
          <div>
            <div class="font-semibold text-white">Senzall</div>
            <div class="text-xs text-amber-400 mb-1">Creator & Designer</div>
            <div class="text-xs text-slate-400">
              Conceived, designed, and directed this tool — from the feature ideas to the user experience.
            </div>
          </div>
        </div>
        <div class="flex items-start gap-3 bg-slate-700/40 rounded-lg p-4 border border-slate-600/50">
          <div class="text-3xl shrink-0">🤖</div>
          <div>
            <div class="font-semibold text-white">Claude Sonnet 4.6</div>
            <div class="text-xs text-amber-400 mb-1">AI Pair Programmer</div>
            <div class="text-xs text-slate-400">
              Wrote the code, architecture, and implementation — built interactively with Senzall via Claude Code.
            </div>
          </div>
        </div>
      </div>
      <p class="text-xs text-slate-500 mt-4 text-center">
        Data provided by the
        <a href="https://wiki.guildwars2.com/wiki/API:Main" target="_blank" rel="noopener"
           class="text-amber-400 hover:text-amber-300 transition-colors">GW2 Official API ↗</a>
        · Guild Wars 2 is a trademark of ArenaNet, LLC.
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { APP_VERSION, LAST_UPDATED } from '../version'

const techStack = [
  { icon: '💚', name: 'Vue 3',       role: 'UI framework (Composition API)' },
  { icon: '🔷', name: 'TypeScript',  role: 'Type-safe JavaScript' },
  { icon: '⚡', name: 'Vite',        role: 'Build tool & dev server' },
  { icon: '🎨', name: 'Tailwind CSS',role: 'Utility-first styling' },
  { icon: '📊', name: 'Chart.js',    role: 'Donut & bar charts' },
  { icon: '🐙', name: 'GitHub Pages',role: 'Hosting & CI/CD' },
]
</script>
