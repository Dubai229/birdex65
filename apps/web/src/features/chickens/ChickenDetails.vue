<script setup lang="ts">
// Верхняя панель вкладки "Курочки": выбранная курица, доход, улучшение.
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { getChickenDef } from '@/config/chickens'
import { chickenProduction } from '@/economy/production'
import { upgradeCost, isMaxLevel } from '@/economy/upgrade'
import { formatNumber } from '@/economy/format'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { t } from '@/i18n'

const props = defineProps<{ chickenKey: string }>()
const game = useGameStore()
const ui = useUiStore()

const def = computed(() => getChickenDef(props.chickenKey))
const owned = computed(() => game.chickens.find((c) => c.key === props.chickenKey) ?? null)
const level = computed(() => owned.value?.level ?? 1)
const prod = computed(() => chickenProduction(props.chickenKey, level.value))
const nextProd = computed(() => chickenProduction(props.chickenKey, level.value + 1))
const cost = computed(() => upgradeCost(props.chickenKey, level.value))
const maxed = computed(() => isMaxLevel(props.chickenKey, level.value))
const affordable = computed(() => (game.balance?.coins ?? 0) >= cost.value)
const isDisplayed = computed(() => owned.value && owned.value.id === game.displayedChicken?.id)
</script>

<template>
  <div class="card details">
    <div class="pic"><ChickenAvatar :chicken-key="chickenKey" :size="130" :locked="!owned" /></div>
    <div class="info">
      <div class="title">{{ def.name }}</div>
      <div class="muted small">{{ t(`rarity.${def.rarity}`) }} · {{ t('chickens.level', { n: level }) }}</div>

      <div class="muted small">{{ t('chickens.income') }}</div>
      <div class="row val">
        🥚 {{ prod }} / ч
        <span v-if="owned && !maxed" class="plus">+{{ nextProd - prod }}</span>
      </div>

      <template v-if="owned">
        <template v-if="!maxed">
          <div class="muted small">{{ t('chickens.upgradeCost') }}</div>
          <div class="val">🪙 {{ formatNumber(cost) }}</div>
          <PrimaryButton
            small
            :disabled="!affordable"
            :loading="game.pending === `upgrade:${owned.id}`"
            @click="game.upgradeChicken(owned.id)"
          >
            ⬆ {{ t('chickens.upgrade') }}
          </PrimaryButton>
        </template>
        <div v-else class="val">{{ t('chickens.maxLevel') }}</div>
        <button v-if="!isDisplayed" class="link" @click="game.displayChicken(owned.id)">
          🏡 {{ t('chickens.display') }}
        </button>
        <div v-else class="muted small">✔ {{ t('chickens.displayed') }}</div>
      </template>
      <PrimaryButton v-else small variant="gold" @click="ui.setTab('shop')">
        🏪 {{ t('chickens.toShop') }}
      </PrimaryButton>
    </div>
  </div>
</template>

<style scoped>
.details { display: flex; gap: 10px; padding: 12px; }
.pic { flex: 0 0 130px; display: flex; align-items: flex-end; justify-content: center; }
.info { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.title { font-size: 20px; font-weight: 900; }
.small { font-size: 12px; }
.val { font-size: 18px; font-weight: 900; }
.plus { color: var(--green-success); font-size: 14px; }
.link { text-align: left; color: var(--gold); font-size: 13px; margin-top: 4px; }
</style>
