<script setup lang="ts">
// Вкладка 2 — Play: падающие яйца, энергия, комбо.
import { ref } from 'vue'
import { useGameStore } from '@/stores/game'
import { usePlaySession } from './usePlaySession'
import { ECONOMY } from '@/config/economy'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import FloatingReward from '@/components/FloatingReward.vue'
import { formatNumber } from '@/economy/format'
import { t } from '@/i18n'

const game = useGameStore()
const s = usePlaySession()
const field = ref<HTMLElement | null>(null)
const floats = ref<{ id: number; text: string; x: number; y: number; gold: boolean }[]>([])
let fid = 0

function onTap(id: number, golden: boolean, ev: PointerEvent) {
  const reward = s.catchEgg(id)
  if (!reward || !field.value) return
  const rect = field.value.getBoundingClientRect()
  floats.value.push({
    id: fid++, text: `+${reward}`, gold: golden,
    x: ev.clientX - rect.left, y: ev.clientY - rect.top,
  })
}
</script>

<template>
  <div class="screen play">
    <div class="card stats row">
      <span>🥚 {{ s.phase.value === 'running' ? s.score.value : formatNumber(game.balance?.eggs ?? 0) }}</span>
      <div class="spacer" />
      <span v-if="s.phase.value === 'running'">⏱ {{ s.timeLeft.value }}</span>
      <div class="energy">
        ⚡ {{ s.phase.value === 'running' ? s.localEnergy.value : game.energy }} / {{ ECONOMY.energy.max }}
        <ProgressBar
          :value="s.phase.value === 'running' ? s.localEnergy.value : game.energy"
          :max="ECONOMY.energy.max"
          color="var(--gold)"
        />
      </div>
    </div>

    <div ref="field" class="field">
      <div
        v-for="egg in s.eggs.value"
        :key="egg.id"
        class="egg"
        :class="{ golden: egg.golden, caught: egg.caught }"
        :style="{
          left: egg.x + '%',
          '--drift': egg.drift + 'px',
          '--spin': egg.spin + 'deg',
          animationDuration: ECONOMY.play.fallDurationMs + 'ms',
        }"
        @pointerdown.prevent="onTap(egg.id, egg.golden, $event)"
        @animationend="s.removeEgg(egg.id)"
      >
        🥚
      </div>

      <FloatingReward
        v-for="f in floats"
        :key="f.id"
        v-bind="f"
        @done="floats = floats.filter((x) => x.id !== f.id)"
      />

      <div v-if="s.phase.value === 'running' && s.combo.value > 1" class="combo">
        {{ t('play.combo', { n: s.combo.value }) }}
      </div>

      <div class="chicken">
        <ChickenAvatar :chicken-key="game.displayedChicken?.key ?? 'farm_hen'" :size="150" />
      </div>

      <div v-if="s.phase.value !== 'running'" class="overlay">
        <template v-if="s.phase.value === 'result'">
          <div class="big">{{ t('play.earned', { n: s.lastResult.value }) }}</div>
          <div class="muted">{{ t('play.caught') }}: {{ s.normalCaught.value + s.goldenCaught.value }}</div>
          <PrimaryButton variant="gold" @click="s.start()">{{ t('play.again') }}</PrimaryButton>
        </template>
        <template v-else-if="s.phase.value === 'finishing'">
          <div class="big">…</div>
        </template>
        <template v-else>
          <div class="big">{{ t('play.title') }}</div>
          <div class="muted hint">{{ t('play.hint') }}</div>
          <PrimaryButton variant="gold" :disabled="game.energy < 1" @click="s.start()">
            ▶ {{ t('play.start') }}
          </PrimaryButton>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.play { height: calc(100vh - 110px); }
.stats { padding: 10px 12px; font-weight: 900; gap: 12px; }
.energy { width: 130px; font-size: 13px; display: flex; flex-direction: column; gap: 3px; }
.field {
  position: relative; flex: 1; min-height: 360px; overflow: hidden; touch-action: none;
  border-radius: var(--radius-lg); border: 3px solid var(--surface-wood);
  background: radial-gradient(circle at 50% 30%, #f5c26b, #b86b2b 70%, #6a3a16);
}
.egg {
  position: absolute; top: -60px; font-size: 44px; line-height: 1;
  transform: translateX(-50%); cursor: pointer; padding: 8px;
  animation-name: fall; animation-timing-function: linear; animation-fill-mode: forwards;
  filter: drop-shadow(0 4px 3px rgba(0, 0, 0, 0.35));
}
.egg.golden { filter: drop-shadow(0 0 10px var(--gold)) sepia(1) saturate(5) hue-rotate(-10deg); }
.egg.caught { animation-play-state: paused; opacity: 0; transform: translateX(-50%) scale(1.6); transition: all 0.2s; }
@keyframes fall {
  from { transform: translate(-50%, 0) rotate(0); }
  to { transform: translate(calc(-50% + var(--drift)), 115vh) rotate(var(--spin)); }
}
.combo {
  position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
  font-size: 28px; font-weight: 900; color: var(--gold); text-shadow: 0 3px 0 #6a3a16;
  animation: pop-in 0.2s ease;
}
.chicken { position: absolute; bottom: 6px; left: 50%; transform: translateX(-50%); pointer-events: none; }
.overlay {
  position: absolute; inset: 0; background: rgba(20, 10, 4, 0.6);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center;
}
.big { font-size: 32px; font-weight: 900; }
.hint { max-width: 260px; }
</style>
