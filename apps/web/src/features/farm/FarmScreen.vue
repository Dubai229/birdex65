<script setup lang="ts">
// Вкладка 1 — Ферма: главная сцена, выбор курицы, сбор производства, быстрые действия.
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import FarmScene from './FarmScene.vue'
import OfflineCard from './OfflineCard.vue'
import FloatingReward from '@/components/FloatingReward.vue'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()

const floats = ref<{ id: number; text: string }[]>([])
let fid = 0
function onCollected(n: number) {
  floats.value.push({ id: fid++, text: `+${n} 🥚` })
}
</script>

<template>
  <div class="screen">
    <div class="scene-wrap">
      <FarmScene
        :chicken-key="game.displayedChicken?.key ?? null"
        :per-hour="game.perHour"
        @pick="ui.openSheet('chickenPicker')"
      />
      <FloatingReward
        v-for="f in floats"
        :key="f.id"
        :text="f.text"
        :x="160"
        :y="120"
        gold
        @done="floats = floats.filter((x) => x.id !== f.id)"
      />
    </div>

    <OfflineCard @collected="onCollected" />

    <div class="actions">
      <button class="card action" @click="ui.setTab('market')">💰 {{ t('farm.goSell') }}</button>
      <button class="card action" @click="ui.setTab('play')">🥚 {{ t('farm.goPlay') }}</button>
    </div>
  </div>
</template>

<style scoped>
.scene-wrap { position: relative; }
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.action { height: 52px; font-weight: 900; font-size: 15px; }
</style>
