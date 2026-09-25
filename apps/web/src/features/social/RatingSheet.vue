<script setup lang="ts">
// Рейтинг: только настоящие игроки (с сервера). Две вкладки:
//  «Монеты» — у кого больше монет сейчас, «Рекорд Play» — больше всего яиц за одну игру.
import { ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { api } from '@/services/api'
import type { LeaderboardResult } from '@/services/apiTypes'
import type { RatingKind } from '@/types/game'
import { formatCompact, formatNumber } from '@/economy/format'
import BottomSheet from '@/components/BottomSheet.vue'
import CoinIcon from '@/components/CoinIcon.vue'
import EggIcon from '@/components/EggIcon.vue'
import PlayerAvatar from '@/components/PlayerAvatar.vue'
import { playSound } from '@/services/audio'
import { t } from '@/i18n'

const ui = useUiStore()
const kind = ref<RatingKind>('coins')
const data = ref<LeaderboardResult | null>(null)
const loading = ref(false)
const failed = ref(false)
let req = 0

async function load() {
  const my = ++req
  loading.value = true
  failed.value = false
  try {
    const res = await api.leaderboard(kind.value)
    if (my === req) data.value = res
  } catch {
    if (my === req) failed.value = true
  }
  if (my === req) loading.value = false
}

function setKind(k: RatingKind) {
  if (kind.value === k) return
  playSound('click', 0.6)
  kind.value = k
  data.value = null
  load()
}

watch(
  () => ui.sheet,
  (s) => {
    if (s !== 'rating') return
    kind.value = 'coins' // открывается всегда на «Монетах»
    load()
  },
)

const medal = (r: number) => (r === 1 ? '🥇' : r === 2 ? '🥈' : r === 3 ? '🥉' : `#${r}`)
</script>

<template>
  <BottomSheet :open="ui.sheet === 'rating'" :title="t('rating.title')" @close="ui.closeSheet()">
    <div class="tabs">
      <button :class="{ on: kind === 'coins' }" @click="setKind('coins')"><CoinIcon :size="18" /> {{ t('rating.tabCoins') }}</button>
      <button :class="{ on: kind === 'play' }" @click="setKind('play')"><EggIcon :size="18" /> {{ t('rating.tabPlay') }}</button>
    </div>
    <div class="muted small">{{ kind === 'coins' ? t('rating.valueCoins') : t('rating.valuePlay') }}</div>

    <div v-if="loading && !data" class="muted center">…</div>
    <div v-else-if="failed" class="muted center">{{ t('rating.error') }}</div>
    <div v-else-if="data && !data.online" class="muted center">{{ t('rating.offline') }}</div>
    <template v-else-if="data">
      <div v-if="data.top.length === 0" class="muted center">{{ t('rating.empty') }}</div>
      <div v-for="e in data.top" :key="e.rank" class="card entry row" :class="{ me: e.isMe }">
        <span class="rank">{{ medal(e.rank) }}</span>
        <PlayerAvatar :chicken-key="e.avatar" :size="38" />
        <div class="who">
          <div class="name">{{ e.isMe ? `${e.name} (${t('rating.you')})` : e.name }}</div>
          <div class="muted tiny">{{ t('header.level', { n: e.level ?? 1 }) }}<template v-if="e.farmName"> · {{ e.farmName }}</template></div>
        </div>
        <div class="spacer" />
        <span class="val">
          <CoinIcon v-if="kind === 'coins'" :size="18" /><EggIcon v-else :size="18" /> {{ formatCompact(e.value) }}
        </span>
      </div>
      <div v-if="data.me && !data.top.some((e) => e.isMe)" class="card entry row me">
        <span class="rank">#{{ formatNumber(data.me.rank) }}</span>
        <div class="who"><div class="name">{{ t('rating.you') }}</div></div>
        <div class="spacer" />
        <span class="val">
          <CoinIcon v-if="kind === 'coins'" :size="18" /><EggIcon v-else :size="18" /> {{ formatCompact(data.me.value) }}
        </span>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped>
.tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 4px; border-radius: var(--radius-md); background: rgba(0, 0, 0, 0.35); }
.tabs button {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 9px 6px; border-radius: var(--radius-sm); font-weight: 900; font-size: 14px; color: var(--text-secondary);
}
.tabs button.on { background: linear-gradient(180deg, #ffcf5a, var(--gold)); color: #4a2a05; box-shadow: 0 3px 0 var(--gold-dark); }
.small { font-size: 12px; text-align: center; }
.tiny { font-size: 11px; }
.center { text-align: center; padding: 16px; }
.entry { padding: 8px 10px; gap: 8px; }
.entry.me { border-color: var(--gold); }
.rank { width: 32px; font-weight: 900; text-align: center; }
.who { min-width: 0; }
.name { font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.val { font-weight: 900; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
</style>
