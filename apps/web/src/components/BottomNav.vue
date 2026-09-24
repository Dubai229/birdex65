<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import type { TabId } from '@/types/game'
import { playSound } from '@/services/audio'
import { t } from '@/i18n'

const ui = useUiStore()

const TABS: { id: TabId; icon: string }[] = [
  { id: 'farm', icon: '🏡' },
  { id: 'play', icon: '🥚' },
  { id: 'chickens', icon: '🐔' },
  { id: 'market', icon: '💰' },
  { id: 'shop', icon: '🏪' },
  { id: 'events', icon: '🗺️' },
]

function go(id: TabId) {
  if (ui.tab === id) return
  playSound('click', 0.4)
  ui.setTab(id)
}
</script>

<template>
  <nav class="nav">
    <button
      v-for="tab in TABS"
      :key="tab.id"
      class="item"
      :class="{ active: ui.tab === tab.id, play: tab.id === 'play' }"
      @click="go(tab.id)"
    >
      <span class="icon">{{ tab.icon }}</span>
      <span class="label">{{ t(`tabs.${tab.id}`) }}</span>
    </button>
  </nav>
</template>

<style scoped>
.nav {
  position: fixed; left: 0; right: 0; bottom: 0; z-index: 30;
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px;
  padding: 6px 6px calc(6px + var(--safe-bottom));
  background: linear-gradient(180deg, #3b2616, #24170d);
  border-top: 2px solid var(--border-wood);
}
.item {
  height: 56px; border-radius: var(--radius-sm);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  color: var(--text-secondary); transition: background 0.15s, transform 0.1s;
}
.item:active { transform: scale(0.94); }
.icon { font-size: 22px; line-height: 1; }
.label { font-size: 11px; font-weight: 800; }
.item.active { background: linear-gradient(180deg, #ffcf5a, var(--gold)); color: #4a2a05; box-shadow: 0 3px 0 var(--gold-dark); }
.item.play:not(.active) .icon { animation: bob 2.4s ease-in-out infinite; }
</style>
