<script setup lang="ts">
// Вкладка 3 — Курочки: коллекция, фильтр по редкости, детали и улучшение.
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { CHICKENS } from '@/config/chickens'
import type { Rarity } from '@/types/game'
import ChickenCard from './ChickenCard.vue'
import ChickenDetails from './ChickenDetails.vue'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()

type Filter = 'all' | 'owned' | Rarity
const filter = ref<Filter>('all')
const FILTERS: Filter[] = ['all', 'owned', 'rare', 'epic', 'legendary']

const list = computed(() =>
  CHICKENS.filter((c) => {
    if (filter.value === 'all') return true
    if (filter.value === 'owned') return game.ownsChicken(c.key)
    return c.rarity === filter.value
  }),
)

const selected = computed(() => ui.selectedChickenKey ?? game.displayedChicken?.key ?? CHICKENS[0].key)
const levelOf = (key: string) => game.chickens.find((c) => c.key === key)?.level ?? null
const label = (f: Filter) => (f === 'all' || f === 'owned' ? t(`chickens.${f}`) : t(`rarity.${f}`))
</script>

<template>
  <div class="screen">
    <h1 class="screen-title">🐔 {{ t('chickens.title') }}</h1>
    <ChickenDetails :chicken-key="selected" />

    <div class="filters">
      <button v-for="f in FILTERS" :key="f" class="chip" :class="{ on: filter === f }" @click="filter = f">
        {{ label(f) }}
      </button>
    </div>

    <div class="grid">
      <ChickenCard
        v-for="c in list"
        :key="c.key"
        :chicken-key="c.key"
        :level="levelOf(c.key)"
        :selected="c.key === selected"
        @select="ui.selectedChickenKey = c.key"
      />
    </div>
  </div>
</template>

<style scoped>
.filters { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; }
.chip {
  flex: 0 0 auto; padding: 8px 14px; border-radius: var(--radius-sm); font-size: 13px;
  background: var(--surface-dark); border: 2px solid var(--surface-wood); color: var(--text-secondary);
}
.chip.on { background: var(--gold); color: #4a2a05; border-color: var(--gold-dark); }
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
</style>
