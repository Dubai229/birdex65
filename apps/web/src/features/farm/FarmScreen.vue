<script setup lang="ts">
import CoinIcon from '@/components/CoinIcon.vue'
// Вкладка 1 — Ферма: фон, курица, сбор производства, быстрые действия.
import { computed, ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { FARM_BACKGROUNDS } from '@/config/assets'
import { playSound } from '@/services/audio'
import GameBackground from '@/components/GameBackground.vue'
import FarmScene from './FarmScene.vue'
import OfflineCard from './OfflineCard.vue'
import FloatingReward from '@/components/FloatingReward.vue'
import EggIcon from '@/components/EggIcon.vue'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()
const settings = useSettingsStore()

const total = FARM_BACKGROUNDS.length
const bgIndex = computed(() => Math.min(settings.farmBg, total - 1))
const bgSrc = computed(() => FARM_BACKGROUNDS[bgIndex.value] ?? '')

function shiftBg(dir: 1 | -1) {
  playSound('click', 0.4)
  settings.shiftFarmBg(dir, total)
}

const floats = ref<{ id: number; text: string }[]>([])
let fid = 0
function onCollected(n: number) {
  floats.value.push({ id: fid++, text: `+${n}` })
}
</script>

<template>
  <GameBackground :src="bgSrc" />
  <div class="screen farm">
    <div class="scene-wrap">
      <FarmScene
        :chicken-key="game.displayedChicken?.key ?? null"
        :per-hour="game.perHour"
        :bg-index="bgIndex"
        :bg-total="total"
        @pick="playSound('pickChicken', 0.8); ui.openSheet('chickenPicker')"
        @prev-bg="shiftBg(-1)"
        @next-bg="shiftBg(1)"
      />
      <FloatingReward
        v-for="f in floats"
        :key="f.id"
        :text="f.text"
        :x="160"
        :y="120"
        gold
        egg
        @done="floats = floats.filter((x) => x.id !== f.id)"
      />
    </div>

    <div class="bottom">
      <OfflineCard @collected="onCollected" />
      <div class="actions">
        <button class="card action" @click="playSound('sellUi', 0.7); ui.setTab('market')"><CoinIcon :size="22" /> {{ t('farm.goSell') }}</button>
        <button class="card action" @click="playSound('click', 0.6); ui.setTab('play')"><EggIcon :size="20" /> {{ t('farm.goPlay') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Экран на всю высоту: сцена растягивается, панель сбора прижата к нижнему меню. */
.farm { position: relative; z-index: 1; flex: 1; }
.scene-wrap { position: relative; flex: 1; display: flex; flex-direction: column; }
.bottom { display: flex; flex-direction: column; gap: 10px; }
.actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.action { height: 52px; font-weight: 900; font-size: 15px; display: flex; align-items: center; justify-content: center; gap: 6px; }
</style>
