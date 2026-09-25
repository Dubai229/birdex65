<script setup lang="ts">
import CoinIcon from '@/components/CoinIcon.vue'
// Награда месяца: 30 дней серии, забирать раз в день.
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

function milestone(i: number): boolean {
  return (i + 1) % 7 === 0 || i === ECONOMY.rewardStreak.length - 1
}

async function claim() {
  const res = await game.claimReward()
  if (res) ui.toast(t('reward.claimed', { n: formatNumber(res.coins) }), 'success')
}
</script>

<template>
  <BottomSheet :open="ui.sheet === 'reward'" :title="t('reward.title')" @close="ui.closeSheet()">
    <div class="days">
      <div v-for="(coins, i) in ECONOMY.rewardStreak" :key="i" class="day card" :class="[dayState(i), { prize: milestone(i) }]">
        <div class="muted small">{{ t('reward.day', { n: i + 1 }) }}</div>
        <div class="icon"><template v-if="milestone(i)">🎁</template><CoinIcon v-else :size="22" /></div>
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
.days { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; max-height: min(58vh, 460px); overflow-y: auto; padding-right: 2px; scrollbar-width: none; }
.days::-webkit-scrollbar { display: none; }
.day { position: relative; min-height: 72px; padding: 7px 3px; text-align: center; display: flex; flex-direction: column; justify-content: center; gap: 1px; }
.day.prize { border-color: rgba(245, 184, 46, 0.55); background: linear-gradient(180deg, rgba(87, 56, 25, 0.96), rgba(28, 17, 9, 0.96)); }
.day.today { border-color: var(--gold); box-shadow: 0 0 0 2px rgba(245, 184, 46, 0.2), 0 0 18px rgba(245, 184, 46, 0.2); }
.day.done { opacity: 0.55; }
.small { font-size: 10px; }
.icon { height: 25px; display: grid; place-items: center; font-size: 21px; }
.val { font-weight: 900; font-size: 11px; line-height: 1.05; }
.check { position: absolute; top: 4px; right: 6px; color: var(--green-success); }
.wait { text-align: center; padding: 10px; }
</style>
