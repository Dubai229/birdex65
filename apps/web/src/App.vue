<script setup lang="ts">
import { onMounted, onUnmounted, type Component } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { useSettingsStore } from '@/stores/settings'
import { initTelegram } from '@/services/telegram'
import { playMusic } from '@/services/audio'
import type { TabId } from '@/types/game'
import GameHeader from '@/components/GameHeader.vue'
import BottomNav from '@/components/BottomNav.vue'
import ToastLayer from '@/components/ToastLayer.vue'
import FarmScreen from '@/features/farm/FarmScreen.vue'
import PlayScreen from '@/features/play/PlayScreen.vue'
import ChickensScreen from '@/features/chickens/ChickensScreen.vue'
import MarketScreen from '@/features/market/MarketScreen.vue'
import ShopScreen from '@/features/shop/ShopScreen.vue'
import EventsScreen from '@/features/events/EventsScreen.vue'
import ChickenPickerSheet from '@/features/farm/ChickenPickerSheet.vue'
import RewardSheet from '@/features/rewards/RewardSheet.vue'
import RatingSheet from '@/features/social/RatingSheet.vue'
import FriendsSheet from '@/features/social/FriendsSheet.vue'
import SettingsSheet from '@/features/settings/SettingsSheet.vue'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()
useSettingsStore()

const SCREENS: Record<TabId, Component> = {
  farm: FarmScreen,
  play: PlayScreen,
  chickens: ChickensScreen,
  market: MarketScreen,
  shop: ShopScreen,
  events: EventsScreen,
}

// Вернулся в приложение — берём свежее состояние с сервера.
function onVisible() {
  if (document.visibilityState === 'visible') game.refresh()
}

onMounted(async () => {
  initTelegram()
  await game.load()
  // Браузеры запрещают автоплей до первого касания.
  window.addEventListener('pointerdown', () => playMusic('farm'), { once: true })
  document.addEventListener('visibilitychange', onVisible)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', onVisible)
  game.stopClock()
})
</script>

<template>
  <div v-if="game.loading" class="loading">
    <div class="logo">🐔</div>
    <div class="muted">{{ t('common.loading') }}</div>
  </div>

  <template v-else>
    <GameHeader />
    <main>
      <component :is="SCREENS[ui.tab]" />
    </main>
    <BottomNav />

    <ChickenPickerSheet />
    <RewardSheet />
    <RatingSheet />
    <FriendsSheet />
    <SettingsSheet />
    <ToastLayer />
  </template>
</template>

<style scoped>
.loading { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; }
.logo { font-size: 80px; animation: bob 1.4s ease-in-out infinite; }
main { max-width: 520px; margin: 0 auto; }
</style>
