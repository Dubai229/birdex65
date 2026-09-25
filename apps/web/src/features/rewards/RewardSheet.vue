<script setup lang="ts">
import CoinIcon from '@/components/CoinIcon.vue'
// Награда недели: 7 дней серии, забирать раз в день.
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { ECONOMY } from '@/config/economy'
import { rewardStatus, msUntilReward, effectiveStreakDay } from '@/economy/reward'
import { formatDuration, formatNumber } from '@/economy/format'
import BottomSheet from '@/components/BottomSheet.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()

const ready = computed(() => !!game.state && rewardStatus(game.state.reward, game.now) === 'ready')
const today = computed(() => (game.state ? effectiveStreakDay(game.state.reward, game.now) : 0))
const waitMs = computed(() => (game.state ? msUntilReward(game.state.reward, game.now) : 0))

function dayState(i: number): 'done' | 'today' | 'future' {
  if (i < today.value) return 'done'
  if (i === today.value) return 'today'
  return 'future'
}

async function claim() {
  const res = await game.claimReward()
  if (res) ui.toast(t('reward.claimed', { n: formatNumber(res.coins) }), 'success')
}
</script>

<template>
  <BottomSheet :open="ui.sheet === 'reward'" :title="t('reward.title')" @close="ui.closeSheet()">
    <div class="days">
      <div v-for="(coins, i) in ECONOMY.rewardStreak" :key="i" class="day card" :class="[dayState(i), { last: i === 6 }]">
        <div class="muted small">{{ t('reward.day', { n: i + 1 }) }}</div>
        <div class="icon"><template v-if="i === 6">🎁</template><CoinIcon v-else :size="28" /></div>
        <div class="val">{{ formatNumber(coins) }}</div>
        <div v-if="dayState(i) === 'done'" class="check">✔</div>
      </div>
    </div>
    <PrimaryButton v-if="ready" variant="gold" :loading="game.pending === 'reward'" @click="claim">
      {{ t('reward.claim') }}
    </PrimaryButton>
    <div v-else class="muted wait">{{ t('reward.next', { time: formatDuration(waitMs) }) }}</div>
  </BottomSheet>
</template>

<style scoped>
.days { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.day { position: relative; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; gap: 2px; }
.day.last { grid-column: span 2; }
.day.today { border-color: var(--gold); }
.day.done { opacity: 0.55; }
.small { font-size: 11px; }
.icon { font-size: 26px; }
.val { font-weight: 900; }
.check { position: absolute; top: 4px; right: 6px; color: var(--green-success); }
.wait { text-align: center; padding: 10px; }
</style>
