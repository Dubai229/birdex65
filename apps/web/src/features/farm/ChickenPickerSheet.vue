<script setup lang="ts">
// Выбор курицы, которая стоит на главном экране.
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import BottomSheet from '@/components/BottomSheet.vue'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import { getChickenDef } from '@/config/chickens'
import { playSound } from '@/services/audio'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()

async function pick(id: string) {
  playSound('chickenClick', 0.8)
  await game.displayChicken(id)
  ui.closeSheet()
}
</script>

<template>
  <BottomSheet :open="ui.sheet === 'chickenPicker'" :title="t('farm.chooseChicken')" @close="ui.closeSheet()">
    <div class="grid">
      <button
        v-for="c in game.chickens"
        :key="c.id"
        class="card item"
        :class="{ active: c.id === game.displayedChicken?.id }"
        @click="pick(c.id)"
      >
        <ChickenAvatar :chicken-key="c.key" :size="72" :idle="false" />
        <div class="name">{{ getChickenDef(c.key).name }}</div>
        <div class="muted lvl">{{ t('chickens.level', { n: c.level }) }}</div>
        <div v-if="c.id === game.displayedChicken?.id" class="badge">{{ t('farm.onFarm') }}</div>
      </button>
    </div>
  </BottomSheet>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.item { position: relative; padding: 8px 4px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.item.active { border-color: var(--gold); }
.name { font-weight: 900; font-size: 14px; }
.lvl { font-size: 12px; }
.badge {
  position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
  padding: 2px 8px; border-radius: 99px; font-size: 10px; background: var(--gold); color: #4a2a05;
}
</style>
