<script setup lang="ts">
// Верх экрана: название фермы, уровень, монеты, яйца + кнопки Награда/Рейтинг/Друзья/Настройки.
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { rewardStatus, msUntilReward } from '@/economy/reward'
import { formatDuration } from '@/economy/format'
import { xpForLevel } from '@/services/mockState'
import ResourcePill from './ResourcePill.vue'
import ProgressBar from './ProgressBar.vue'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()

const rewardReady = computed(() => game.state && rewardStatus(game.state.reward, game.now) === 'ready')
const rewardLabel = computed(() => {
  if (!game.state || rewardReady.value) return t('header.reward')
  return formatDuration(msUntilReward(game.state.reward, game.now))
})
</script>

<template>
  <header v-if="game.state" class="header">
    <div class="top row">
      <button class="profile row" @click="ui.openSheet('settings')">
        <div class="ava">🧑‍🌾</div>
        <div class="info">
          <div class="farm-name">{{ game.profile?.farmName }}</div>
          <div class="lvl">{{ t('header.level', { n: game.profile?.level ?? 1 }) }}</div>
          <ProgressBar :value="game.profile?.xp ?? 0" :max="xpForLevel(game.profile?.level ?? 1)" />
        </div>
      </button>
      <div class="pills">
        <ResourcePill icon="🪙" :value="game.balance?.coins ?? 0" plus @plus="ui.setTab('market')" />
        <ResourcePill icon="🥚" :value="game.balance?.eggs ?? 0" :max="game.balance?.storageCapacity" />
      </div>
      <button class="gear" @click="ui.openSheet('settings')">⚙️</button>
    </div>

    <div class="quick">
      <button class="qbtn card" :class="{ glow: rewardReady }" @click="ui.openSheet('reward')">
        <span class="qi">📅</span>
        <span class="ql">{{ rewardLabel }}</span>
        <span v-if="rewardReady" class="dot" />
      </button>
      <button class="qbtn card" @click="ui.openSheet('rating')">
        <span class="qi">🏆</span><span class="ql">{{ t('header.rating') }}</span>
      </button>
      <button class="qbtn card" @click="ui.openSheet('friends')">
        <span class="qi">👥</span><span class="ql">{{ t('header.friends') }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky; top: 0; z-index: 20;
  padding: calc(var(--safe-top) + 8px) 12px 8px;
  background: linear-gradient(180deg, var(--background-dark) 70%, transparent);
}
.top { gap: 8px; }
.profile { text-align: left; gap: 8px; min-width: 0; flex: 1; }
.ava {
  width: 44px; height: 44px; border-radius: 50%; font-size: 26px;
  display: grid; place-items: center; background: var(--surface-wood); border: 2px solid var(--gold);
}
.info { min-width: 0; flex: 1; max-width: 150px; display: flex; flex-direction: column; gap: 2px; }
.farm-name { font-weight: 900; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lvl { font-size: 11px; color: var(--text-secondary); }
.pills { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
.gear { font-size: 22px; padding: 4px; }
.quick { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px; }
.qbtn { position: relative; display: flex; align-items: center; justify-content: center; gap: 6px; height: 40px; font-size: 13px; }
.qi { font-size: 18px; }
.qbtn.glow { border-color: var(--gold); }
.dot { position: absolute; top: -4px; right: -4px; width: 12px; height: 12px; border-radius: 50%; background: var(--red-accent); }
</style>
