<script setup lang="ts">
// Режим "Курица и бомбы": экран игры. Логика — useRunGame, старт/финиш — useModeSession.
import { computed, onMounted, ref } from 'vue'
import { useRunGame } from './useRunGame'
import { useModeSession } from './useModeSession'
import { useGameStore } from '@/stores/game'
import { ECONOMY } from '@/config/economy'
import { formatNumber } from '@/economy/format'
import EggIcon from '@/components/EggIcon.vue'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import ModeResult from './ModeResult.vue'
import { ASSETS } from '@/config/assets'
import { t } from '@/i18n'

const emit = defineEmits<{ back: [] }>()
const game = useGameStore()
const session = useModeSession('run')
const g = useRunGame((seconds) => session.finish({ seconds }))
const field = ref<HTMLElement | null>(null)
const running = computed(() => session.phase.value === 'running')
const henKey = computed(() => game.displayedChicken?.key ?? 'farm_hen')

const clock = computed(() => {
  const s = Math.floor(g.elapsed.value)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
})
const goal = `${ECONOMY.modes.run.maxMinutes}:00`

async function begin() {
  if (!(await session.start())) return emit('back')
  const r = field.value?.getBoundingClientRect()
  if (r) g.setSize(r.width, r.height)
  g.start()
}

function local(ev: PointerEvent) {
  const r = field.value!.getBoundingClientRect()
  return [ev.clientX - r.left, ev.clientY - r.top] as const
}
function onDown(ev: PointerEvent) {
  if (!running.value || !field.value) return
  ev.preventDefault()
  field.value.setPointerCapture?.(ev.pointerId)
  g.down(...local(ev))
}
function onMove(ev: PointerEvent) {
  if (running.value && field.value) g.move(...local(ev))
}

onMounted(begin)
</script>

<template>
  <div class="screen mode">
    <div class="hud">
      <span class="eggs"><EggIcon :size="22" /> {{ formatNumber(g.eggs()) }}</span>
      <span class="clock">⏱ {{ clock }} <span class="muted">/ {{ goal }}</span></span>
      <span />
    </div>

    <div ref="field" class="field" @pointerdown="onDown" @pointermove="onMove" @pointerup="g.up" @pointercancel="g.up">
      <div
        v-for="b in g.bombs.value"
        :key="b.id"
        class="bomb"
        :style="{ transform: `translate(${b.x}px, ${b.y}px) rotate(${(b.y / 300) * b.spin}deg)` }"
      >
        <img :src="ASSETS.bomb" alt="" draggable="false" />
      </div>

      <span
        v-for="f in g.feathers.value"
        :key="'f' + f.id"
        class="feather"
        :class="'t' + f.tone"
        :style="{
          left: f.x + 'px',
          top: f.y + 'px',
          width: f.size + 'px',
          height: f.size * 0.45 + 'px',
          '--dx': f.dx + 'px',
          '--dy': f.dy + 'px',
          '--rot': f.rot + 'deg',
          animationDuration: f.dur + 'ms',
        }"
      />

      <div
        class="hen"
        :class="{ held: g.dragging.value }"
        :style="{ transform: `translate(${g.hen.value.x}px, ${g.hen.value.y}px)` }"
      >
        <ChickenAvatar :chicken-key="henKey" :size="g.HEN_SIZE" :idle="!g.dragging.value" />
      </div>


      <div v-if="running && g.elapsed.value < 3" class="hint">{{ t('modes.runHint') }}</div>

      <ModeResult
        v-if="!running"
        :phase="session.phase.value"
        :eggs="session.lastResult.value"
        :win="g.win.value"
        :line="t('modes.runResult', { time: clock })"
        :cost="ECONOMY.modes.run.playCost"
        mode="run"
        @again="begin"
        @back="emit('back')"
      />
    </div>
  </div>
</template>

<style scoped>
.mode { position: relative; z-index: 1; flex: 1; min-height: 480px; padding-bottom: calc(var(--safe-bottom) + 10px); }
.eggs { display: inline-flex; align-items: center; gap: 4px; }
.clock { font-variant-numeric: tabular-nums; color: var(--gold); }
.field {
  position: relative; flex: 1; min-height: 380px; overflow: hidden; touch-action: none; user-select: none;
  border-radius: var(--radius-lg); background: linear-gradient(180deg, rgba(120, 190, 255, 0.18), rgba(0, 0, 0, 0.2));
}
.bomb {
  position: absolute; left: -24px; top: -26px; width: 48px; height: 48px;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.5)); will-change: transform; pointer-events: none;
}
.bomb img { width: 100%; height: 100%; object-fit: contain; }
/* Перья: лепесток, улетает, крутится и оседает вниз. */
.feather {
  position: absolute; z-index: 3; margin: -4px 0 0 -6px; border-radius: 100% 0 100% 0; pointer-events: none;
  box-shadow: inset 0 0 0 1px rgba(120, 80, 40, 0.25); animation-name: feather; animation-timing-function: cubic-bezier(0.2, 0.7, 0.4, 1);
  animation-fill-mode: forwards;
}
.feather.t0 { background: linear-gradient(135deg, #ffffff, #e9e4da); }
.feather.t1 { background: linear-gradient(135deg, #fff5dc, #e8cf9c); }
.feather.t2 { background: linear-gradient(135deg, #f1b777, #b8733a); }
@keyframes feather {
  0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
  45% { transform: translate(var(--dx), var(--dy)) rotate(calc(var(--rot) * 0.6)); opacity: 1; }
  100% { transform: translate(calc(var(--dx) * 1.1), calc(var(--dy) + 70px)) rotate(var(--rot)); opacity: 0; }
}
.hen {
  position: absolute; left: -38px; top: -38px; width: 76px; height: 76px; will-change: transform; pointer-events: none;
  filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.45));
}
.hen.held { filter: drop-shadow(0 0 10px rgba(255, 230, 140, 0.9)) drop-shadow(0 6px 6px rgba(0, 0, 0, 0.45)); }
.hint {
  position: absolute; left: 50%; top: 18px; transform: translateX(-50%); padding: 6px 14px; border-radius: 99px;
  background: rgba(0, 0, 0, 0.55); font-weight: 800; font-size: 13px; white-space: nowrap; pointer-events: none;
}
</style>
