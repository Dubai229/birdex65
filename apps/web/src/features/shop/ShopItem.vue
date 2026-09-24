<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import type { ChickenDefinition } from '@/types/game'
import { formatNumber } from '@/economy/format'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { t } from '@/i18n'

const props = defineProps<{ def: ChickenDefinition }>()
const game = useGameStore()

const owned = computed(() => game.ownsChicken(props.def.key))
const affordable = computed(() => (game.balance?.coins ?? 0) >= props.def.price)
</script>

<template>
  <div class="card item" :class="def.rarity">
    <ChickenAvatar :chicken-key="def.key" :size="76" :idle="false" />
    <div class="info">
      <div class="name">{{ def.name }}</div>
      <div class="muted small">{{ t(`rarity.${def.rarity}`) }}</div>
      <div class="small">🥚 {{ t('shop.production', { n: def.baseProductionPerHour }) }}</div>
    </div>
    <div class="buy">
      <PrimaryButton v-if="owned" small variant="wood" disabled>{{ t('shop.owned') }}</PrimaryButton>
      <PrimaryButton
        v-else
        small
        :variant="affordable ? 'green' : 'wood'"
        :disabled="!affordable"
        :loading="game.pending === `buy:${def.key}`"
        @click="game.buyChicken(def.key)"
      >
        🪙 {{ formatNumber(def.price) }}
      </PrimaryButton>
    </div>
  </div>
</template>

<style scoped>
.item { display: flex; align-items: center; gap: 10px; padding: 10px; }
.info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.name { font-weight: 900; font-size: 16px; }
.small { font-size: 12px; }
.uncommon { border-color: var(--rarity-uncommon); }
.rare { border-color: var(--rarity-rare); }
.epic { border-color: var(--rarity-epic); }
.legendary { border-color: var(--rarity-legendary); }
</style>
