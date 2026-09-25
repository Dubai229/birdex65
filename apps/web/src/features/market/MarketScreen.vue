<script setup lang="ts">
// Вкладка 4 — Продать: яйца → монеты.
import { computed, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { ECONOMY } from '@/config/economy'
import { sellValue, eggsForPercent, clampSellAmount } from '@/economy/market'
import { formatNumber } from '@/economy/format'
import PrimaryButton from '@/components/PrimaryButton.vue'
import EggIcon from '@/components/EggIcon.vue'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()

const total = computed(() => game.balance?.eggs ?? 0)
const amount = ref(total.value)
watch(total, (v) => (amount.value = clampSellAmount(amount.value, v)))

const coins = computed(() => sellValue(amount.value))
const step = computed(() => Math.max(1, Math.round(total.value / 20)))

function setPercent(p: number) {
  amount.value = eggsForPercent(total.value, p)
}
function nudge(dir: 1 | -1) {
  amount.value = clampSellAmount(amount.value + dir * step.value, total.value)
}
function onInput(e: Event) {
  amount.value = clampSellAmount(Number((e.target as HTMLInputElement).value), total.value)
}

async function sell() {
  const res = await game.sellEggs(amount.value)
  if (res) {
    ui.toast(t('market.sold', { eggs: formatNumber(res.eggsSold), coins: formatNumber(res.coinsReceived) }), 'success')
    amount.value = game.balance?.eggs ?? 0
  }
}
</script>

<template>
  <div class="screen">
    <h1 class="screen-title">💰 {{ t('market.title') }}</h1>

    <div class="card panel">
      <div class="row">
        <div class="basket">🧺</div>
        <div>
          <div class="muted">{{ t('market.youHave', { n: formatNumber(total) }) }}</div>
          <div class="muted small">{{ t('market.price', { n: ECONOMY.eggSellPrice }) }}</div>
        </div>
      </div>

      <div class="row stepper">
        <button class="sq" @click="nudge(-1)">−</button>
        <input type="number" inputmode="numeric" :value="amount" :max="total" min="0" @input="onInput" />
        <button class="sq" @click="nudge(1)">+</button>
      </div>

      <input class="slider" type="range" min="0" :max="total" :value="amount" @input="onInput" />

      <div class="presets">
        <button class="chip" @click="setPercent(25)">25%</button>
        <button class="chip" @click="setPercent(50)">50%</button>
        <button class="chip" @click="setPercent(100)">MAX</button>
      </div>

      <div class="preview">
        <EggIcon :size="24" /> {{ formatNumber(amount) }} <span class="arrow">→</span> 🪙 {{ formatNumber(coins) }}
      </div>

      <PrimaryButton :disabled="amount <= 0" :loading="game.pending === 'sell'" @click="sell">
        {{ total > 0 ? t('market.sell') : t('market.empty') }}
      </PrimaryButton>
    </div>
  </div>
</template>

<style scoped>
.panel { padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.basket { font-size: 52px; }
.small { font-size: 12px; }
.stepper { justify-content: center; }
.sq { width: 44px; height: 44px; border-radius: var(--radius-sm); background: var(--surface-wood); font-size: 22px; font-weight: 900; }
input[type='number'] {
  width: 140px; height: 44px; text-align: center; font-size: 20px; font-weight: 900;
  border-radius: var(--radius-sm); border: 2px solid var(--surface-wood);
  background: rgba(0, 0, 0, 0.4); color: var(--text-primary);
}
.slider { width: 100%; accent-color: var(--gold); }
.presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.chip { height: 38px; border-radius: var(--radius-sm); background: var(--surface-wood); font-weight: 900; }
.preview { display: flex; align-items: center; justify-content: center; gap: 6px; text-align: center; font-size: 22px; font-weight: 900; }
.arrow { color: var(--text-secondary); margin: 0 6px; }
</style>
