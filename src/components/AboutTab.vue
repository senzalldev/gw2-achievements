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
      <div class="mt-4 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
        <p class="text-sm text-amber-300 font-medium mb-1">🧪 Experimental Tracker</p>
        <p class="text-xs text-amber-200/70 leading-relaxed mb-2">
          This tracker is actively developed and still learning. Features may change, numbers may
          occasionally surprise you, and new ideas are always in progress. We're building this
          together — if something looks off or you have a suggestion, feedback is always welcome.
        </p>
        <div class="flex items-center gap-3 flex-wrap">
          <a href="https://github.com/senzalldev/gw2-achievements/discussions" target="_blank" rel="noopener"
             class="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
            💬 Join the Discussion ↗
          </a>
          <a href="https://github.com/senzalldev/gw2-achievements/issues" target="_blank" rel="noopener"
             class="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
            🐛 Report an Issue ↗
          </a>
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
          <span><strong class="text-slate-300">My Stats</strong> — charts, AP breakdown, category radar, progress distribution, and an AP opportunity finder. We're always experimenting with smarter ways to read your numbers here.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Almost Done</strong> — achievements you're closest to completing, sorted by progress</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Most Valuable</strong> — incomplete achievements with the most AP still on the table</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Goals</strong> — smart filters for mastery points, titles, skins, repeatables, and raids</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Browse All</strong> — full searchable achievement list with content group, status, and type filters (including Raids, Fractals, PvP)</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Daily</strong> — Wizard's Vault objectives, world bosses, dungeon paths, map chests, and weekly raid clears</span>
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
          during seasonal events. Use the <strong class="text-slate-300">Festivals</strong> toggle in the filter bar
          to hide them across the whole app and focus on year-round opportunities.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">PvP and WvW</strong> AP is tracked separately by ArenaNet — the
          tracker correctly classifies these using achievement flags and group names so you can filter them
          in or out globally. The Show/Hide toggles in the filter bar are saved to your browser.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-amber-400 shrink-0 mt-0.5">•</span>
          <span><strong class="text-slate-300">Data is live</strong> but not real-time — reload the page to
          refresh your progress after a play session.</span>
        </li>
      </ul>
    </div>

    <!-- Understanding your numbers -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold text-white mb-3 flex items-center gap-2">
        <span>📊</span> Understanding Your Numbers
      </h3>
      <p class="text-sm text-slate-400 mb-4 leading-relaxed">
        GW2's achievement system has some delightful quirks. Here's what's actually going on behind the numbers.
      </p>

      <div class="space-y-4">

        <div class="bg-slate-700/30 rounded-lg p-4 border border-slate-600/40">
          <div class="text-sm font-semibold text-white mb-1">Why your completion % might look low</div>
          <p class="text-sm text-slate-400 leading-relaxed">
            The GW2 API only returns achievements you've <em>touched</em> — started or completed.
            Thousands of achievements you've never attempted are simply absent from the response.
            The tracker looks up the full game list from category data and measures you against
            <strong class="text-slate-300">all of them</strong>, not just the ones you tried.
            It's more honest, even if the number stings a little.
          </p>
        </div>

        <div class="bg-slate-700/30 rounded-lg p-4 border border-slate-600/40">
          <div class="text-sm font-semibold text-white mb-1">Why AP Efficiency briefly shows "Loading…"</div>
          <p class="text-sm text-slate-400 leading-relaxed">
            Your personal achievement details load fast. But computing your true AP potential requires
            fetching details for <strong class="text-slate-300">every achievement in the game</strong> — thousands of IDs.
            The tracker does this in the background so you can browse immediately, and AP Efficiency
            updates quietly once the full picture arrives. No refresh needed.
          </p>
        </div>

        <div class="bg-slate-700/30 rounded-lg p-4 border border-slate-600/40">
          <div class="text-sm font-semibold text-white mb-1">The 121 chests (yes, 121)</div>
          <p class="text-sm text-slate-400 leading-relaxed">
            AP milestone chests are awarded at <strong class="text-slate-300">100 AP</strong>, then every
            <strong class="text-slate-300">500 AP up to 60,000</strong> — that's 121 chests total.
            The final one unlocks the title <em class="text-amber-400">Uncontrollable Achiever</em>.
            The Overview tab's milestone bar now reflects the full 60k range.
            (We previously had it capped at 50k. We found out. We fixed it. Moving on.)
          </p>
        </div>

        <div class="bg-slate-700/30 rounded-lg p-4 border border-slate-600/40">
          <div class="text-sm font-semibold text-white mb-1">Daily & Monthly AP cap</div>
          <p class="text-sm text-slate-400 leading-relaxed">
            You can earn up to <strong class="text-slate-300">15,000 AP from dailies and monthlies combined</strong>.
            Once you hit that cap the AP stops but the gold, laurels, and other rewards keep coming —
            ArenaNet's way of saying "we see you, veteran". The tracker adds your earned daily/monthly AP
            on top of your achievement AP for the real total.
          </p>
        </div>

      </div>
    </div>

    <!-- Resources -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold text-white mb-3 flex items-center gap-2">
        <span>🔗</span> Useful Resources
      </h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <a href="https://wiki.guildwars2.com/wiki/Achievement_point_rewards" target="_blank" rel="noopener"
           class="flex items-start gap-3 bg-slate-700/40 rounded-lg p-3 border border-slate-600/50
                  hover:border-amber-500/40 transition-colors group">
          <span class="text-xl shrink-0 mt-0.5">🏆</span>
          <div>
            <div class="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">AP Milestone Rewards</div>
            <div class="text-xs text-slate-500">All 121 chest thresholds, titles, and bonuses</div>
          </div>
        </a>
        <a href="https://wiki.guildwars2.com/wiki/Achievement" target="_blank" rel="noopener"
           class="flex items-start gap-3 bg-slate-700/40 rounded-lg p-3 border border-slate-600/50
                  hover:border-amber-500/40 transition-colors group">
          <span class="text-xl shrink-0 mt-0.5">📖</span>
          <div>
            <div class="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">Achievement Wiki</div>
            <div class="text-xs text-slate-500">Categories, AP totals, and mastery points by group</div>
          </div>
        </a>
        <a href="https://wiki.guildwars2.com/wiki/API:2/account/achievements" target="_blank" rel="noopener"
           class="flex items-start gap-3 bg-slate-700/40 rounded-lg p-3 border border-slate-600/50
                  hover:border-amber-500/40 transition-colors group">
          <span class="text-xl shrink-0 mt-0.5">⚙️</span>
          <div>
            <div class="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">GW2 API Docs</div>
            <div class="text-xs text-slate-500">What the achievement endpoint actually returns</div>
          </div>
        </a>
        <a href="https://account.arena.net/applications" target="_blank" rel="noopener"
           class="flex items-start gap-3 bg-slate-700/40 rounded-lg p-3 border border-slate-600/50
                  hover:border-amber-500/40 transition-colors group">
          <span class="text-xl shrink-0 mt-0.5">🔑</span>
          <div>
            <div class="text-sm font-medium text-white group-hover:text-amber-300 transition-colors">Create an API Key</div>
            <div class="text-xs text-slate-500">Only "Progression" permission needed for this tracker</div>
          </div>
        </a>
      </div>
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
        <li class="flex items-start gap-2"><span class="text-purple-400 shrink-0 mt-0.5">★</span>
          <span>After your data loads, the tracker quietly fetches details for <strong class="text-slate-300">every achievement in the game</strong> in the background — not just yours — so AP totals and the "Not Started" bucket reflect the real game-wide picture rather than only what you've touched.</span>
        </li>
        <li class="flex items-start gap-2"><span class="text-purple-400 shrink-0 mt-0.5">★</span>
          <span>All achievement data comes directly from the <strong class="text-slate-300">official GW2 API</strong>, lovingly delivered by Quaggan developers working round the clock in Castora. Hooooo! 🐟 They're helping build this tracker as fast as their little fins will allow. Their only complaint is that ArenaNet still hasn't added a <code class="text-amber-400">/v2/account/fish</code> endpoint — but they're not giving up hope.</span>
        </li>
      </ul>
    </div>

    <!-- Buy Me a Coffee -->
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-5">
      <h3 class="font-semibold text-white mb-3 flex items-center gap-2">
        <span>☕</span> Support
      </h3>
      <p class="text-sm text-slate-400 leading-relaxed mb-4">
        No gems, no paywall — just tools built by a fellow player. If this tracker has helped you chip
        away at that achievement backlog, or
        <a href="https://senzall.com/ltmessages" target="senzall" rel="noopener"
           class="text-amber-400 hover:text-amber-300 transition-colors">LT Messages</a>
        has made your squad comms a little smoother,
        buying me a coffee is the real-world equivalent of tipping a helpful guildie.
      </p>
      <a href='https://ko-fi.com/H2H31V753H' target='_blank' rel="noopener">
        <img height='40' style='border:0px;height:40px;' src='/support_me_on_kofi_dark.png' alt='Support me on Ko-fi' />
      </a>
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
