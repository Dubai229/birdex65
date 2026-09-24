<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { api } from '@/services/api'
import type { LeaderboardEntry } from '@/types/game'
import { formatNumber } from '@/economy/format'
import BottomSheet from '@/components/BottomSheet.vue'
import { t } from '@/i18n'

const ui = useUiStore()
const list = ref<LeaderboardEntry[]>([])
const loading = ref(false)

watch(
  () => ui.sheet,
  async (s) => {
    if (s !== 'rating') return
    loading.value = true
    list.value = await api.leaderboard().catch(() => [])
    loading.value = false
  },
)

const medal = (r: number) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`)
</script>

<template>
  <BottomSheet :open="ui.sheet === 'rating'" :title="t('rating.title')" @close="ui.closeSheet()">
    <div class="muted small">{{ t('rating.value') }}</div>
    <div v-if="loading" class="muted">…</div>
    <div v-for="e in list" :key="e.rank + e.name" class="card entry row" :class="{ me: e.isMe }">
      <span class="rank">{{ medal(e.rank) }}</span>
      <span class="name">{{ e.isMe ? `${e.name} (${t('rating.you')})` : e.name }}</span>
      <div class="spacer" />
      <span>🪙 {{ formatNumber(e.farmValue) }}</span>
    </div>
  </BottomSheet>
</template>

<style scoped>
.small { font-size: 12px; }
.entry { padding: 10px 12px; }
.entry.me { border-color: var(--gold); }
.rank { width: 36px; font-weight: 900; }
.name { font-weight: 800; }
</style>
