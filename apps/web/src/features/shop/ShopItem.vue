<script setup lang="ts">
import CoinIcon from '@/components/CoinIcon.vue'
// Карточка курицы в магазине.
// Цена "дышит" при наведении. Не хватает монет — звук error, кнопка трясётся.
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import type { ChickenDefinition } from '@/types/game'
import { formatNumber } from '@/economy/format'
import { playSound } from '@/services/audio'
import { haptics } from '@/services/haptics'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import EggIcon from '@/components/EggIcon.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { t } from '@/i18n'

const props = defineProps<{ def: ChickenDefinition }>()
const game = useGameStore()
const ui = useUiStore()

const owned = computed(() => game.ownsChicken(props.def.key))
const affordable = computed(() => (game.balance?.coins ?? 0) >= props.def.price)
const shaking = ref(false)

function onBuy() {
  if (!affordable.value) {
    playSound('error', 0.7)
    haptics.error()
    ui.toast(t('errors.NOT_ENOUGH_COINS'), 'error')
    // перезапуск тряски даже при частых нажатиях
    shaking.value = false
    requestAnimationFrame(() => (shaking.value = true))
    return
  }
  game.buyChicken(props.def.key)
}
</script>

<template>
  <div class="card item" :class="def.rarity">
    <ChickenAvatar :chicken-key="def.key" :size="76" :idle="false" />
    <div class="info">
      <div class="name">{{ def.name }}</div>
      <div class="muted small">{{ t(`rarity.${def.rarity}`) }}</div>
      <div class="small row-i"><EggIcon :size="14" /> {{ t('shop.production', { n: def.baseProductionPerHour }) }}</div>
    </div>
    <div class="buy" :class="{ poor: !affordable && !owned, shake: shaking }" @animationend="shaking = false">
      <PrimaryButton v-if="owned" small variant="wood" disabled>{{ t('shop.owned') }}</PrimaryButton>
      <PrimaryButton
        v-else
        small
        :variant="affordable ? 'green' : 'wood'"
        :loading="game.pending === `buy:${def.key}`"
        @click="onBuy"
      >
        <span class="price"><span class="coin"><CoinIcon :size="18" /></span> {{ formatNumber(def.price) }}</span>
      </PrimaryButton>
    </div>
  </div>
</template>

<style scoped>
.item { display: flex; align-items: center; gap: 10px; padding: 10px; }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.name { font-weight: 900; font-size: 16px; }
.small { font-size: 12px; }
.row-i { display: flex; align-items: center; gap: 4px; }
.uncommon { border-color: var(--rarity-uncommon); }
.rare { border-color: var(--rarity-rare); }
.epic { border-color: var(--rarity-epic); }
.legendary { border-color: var(--rarity-legendary); }

/* Цена "дышит" при наведении (на телефоне — при касании). */
.price { display: inline-flex; align-items: center; gap: 4px; }
.coin { display: inline-block; }
.buy:hover .price, .buy:active .price { animation: breathe-price 1.6s ease-in-out infinite; }
.buy:hover .coin, .buy:active .coin { animation: coin-glint 1.6s ease-in-out infinite; }
@keyframes breathe-price {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.07); }
}
@keyframes coin-glint {
  0%, 100% { transform: rotate(0) scale(1); filter: brightness(1); }
  50% { transform: rotate(-8deg) scale(1.12); filter: brightness(1.25) drop-shadow(0 0 4px rgba(255, 210, 90, 0.8)); }
}

/* Не хватает монет: кнопка чуть приглушена, но нажимается (чтобы сыграть error). */
.poor :deep(.btn) { filter: saturate(0.6) brightness(0.85); }
.poor .price { opacity: 0.85; }
.shake { animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
@keyframes shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(3px); }
  30%, 50%, 70% { transform: translateX(-5px); }
  40%, 60% { transform: translateX(5px); }
}
@media (prefers-reduced-motion: reduce) {
  .buy:hover .price, .buy:active .price, .buy:hover .coin, .buy:active .coin, .shake { animation: none; }
}
</style>
