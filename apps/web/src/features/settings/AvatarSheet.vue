<script setup lang="ts">
// Выбор аватарки: любая из 36 куриц игры. Видна в шапке, рейтинге и у друзей.
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { CHICKENS } from '@/config/chickens'
import BottomSheet from '@/components/BottomSheet.vue'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import { playSound } from '@/services/audio'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()

async function pick(key: string) {
  playSound('pickChicken', 0.8)
  if (await game.setAvatar(key)) ui.closeSheet()
}
</script>

<template>
  <BottomSheet :open="ui.sheet === 'avatar'" :title="t('avatar.title')" @close="ui.closeSheet()">
    <div class="muted hint">{{ t('avatar.hint') }}</div>
    <div class="grid">
      <button
        v-for="c in CHICKENS"
        :key="c.key"
        class="card item"
        :class="[c.rarity, { active: c.key === game.profile?.avatar }]"
        @click="pick(c.key)"
      >
        <ChickenAvatar :chicken-key="c.key" :size="64" :idle="false" />
        <div class="name">{{ c.name }}</div>
      </button>
    </div>
  </BottomSheet>
</template>

<style scoped>
.hint { font-size: 12px; text-align: center; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.item { padding: 6px 2px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.item.active { border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold); }
.name { font-weight: 800; font-size: 11px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
</style>
