<script setup lang="ts">
// Сцена фермы: крупная курица-герой, стрелки смены фона по бокам.
// Сам фон рисует GameBackground в FarmScreen (на весь экран).
import { ref, watch } from 'vue'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import EggIcon from '@/components/EggIcon.vue'
import HeartBurst from '@/components/effects/HeartBurst.vue'
import SwapSparkle from '@/components/effects/SwapSparkle.vue'
import { playSound } from '@/services/audio'
import { haptics } from '@/services/haptics'
import { t } from '@/i18n'

const props = defineProps<{ chickenKey: string | null; perHour: number; bgIndex: number; bgTotal: number }>()
defineEmits<{ pick: []; prevBg: []; nextBg: [] }>()

const scene = ref<HTMLElement | null>(null)
const hearts = ref<InstanceType<typeof HeartBurst> | null>(null)
const sparkle = ref<InstanceType<typeof SwapSparkle> | null>(null)
const heroEl = ref<HTMLElement | null>(null)

/** Смена курицы на ферме: вспышка + звёздочки в центре курицы. */
watch(
  () => props.chickenKey,
  (next, prev) => {
    if (!next || !prev || next === prev) return
    const s = scene.value?.getBoundingClientRect()
    const h = heroEl.value?.getBoundingClientRect()
    if (s && h) sparkle.value?.play(h.left - s.left + h.width / 2, h.top - s.top + h.height * 0.55)
    haptics.medium()
  },
)

const happy = ref(false)
let happyTimer: number | undefined

/** Тап по курице: перья и сердечки из точки касания + прыжок + кудахтанье. */
function poke(ev: PointerEvent) {
  const rect = scene.value?.getBoundingClientRect()
  if (rect) hearts.value?.burst(ev.clientX - rect.left, ev.clientY - rect.top)
  playSound('cluck', 0.7, 0.06)
  haptics.light()
  // Перезапуск анимации прыжка даже при частых тапах.
  happy.value = false
  window.clearTimeout(happyTimer)
  requestAnimationFrame(() => {
    happy.value = true
    happyTimer = window.setTimeout(() => (happy.value = false), 500)
  })
}
</script>

<template>
  <section ref="scene" class="scene">
    <div class="rate"><EggIcon :size="16" /> {{ t('farm.perHour', { n: perHour }) }}</div>
    <button class="pick" @click="$emit('pick')">🔄 {{ t('farm.chooseChicken') }}</button>

    <button v-if="bgTotal > 1" class="arrow left" :aria-label="t('farm.prevBg')" @click="$emit('prevBg')">‹</button>
    <button v-if="bgTotal > 1" class="arrow right" :aria-label="t('farm.nextBg')" @click="$emit('nextBg')">›</button>

    <SwapSparkle ref="sparkle" />

    <div ref="heroEl" class="hero-slot">
      <Transition name="swap" mode="out-in">
        <button v-if="chickenKey" :key="chickenKey" class="hero" :class="{ happy }" @pointerdown="poke">
          <ChickenAvatar :chicken-key="chickenKey" :size="230" />
        </button>
      </Transition>
    </div>

    <HeartBurst ref="hearts" />

    <div v-if="bgTotal > 1" class="dots">
      <span v-for="i in bgTotal" :key="i" class="dot" :class="{ on: i - 1 === bgIndex }" />
    </div>

  </section>
</template>

<style scoped>
.scene { position: relative; flex: 1; min-height: 270px; }
.hero-slot {
  position: absolute; left: 52%; bottom: -4px; width: 230px; height: 230px;
  transform: translateX(-50%); z-index: 2;
}
.hero { position: absolute; left: 50%; bottom: 0; transform: translateX(-50%); }

/* Смена курицы: старая крутится и тает, новая выпрыгивает с пружинкой. */
.swap-leave-active { animation: swap-out 0.22s ease-in forwards; }
.swap-enter-active { animation: swap-in 0.6s cubic-bezier(0.25, 1.5, 0.45, 1) both; }
@keyframes swap-out {
  to { transform: translateX(-50%) scale(0.3) rotate(-25deg); opacity: 0; filter: brightness(2.5); }
}
@keyframes swap-in {
  0% { transform: translateX(-50%) translateY(30px) scale(0.2); opacity: 0; filter: brightness(3); }
  55% { opacity: 1; filter: brightness(1.4); }
  100% { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; filter: brightness(1); }
}
@media (prefers-reduced-motion: reduce) {
  .swap-leave-active, .swap-enter-active { animation-duration: 0.01s; }
}
.hero { transform-origin: 50% 100%; touch-action: manipulation; }
.hero.happy { animation: hop 0.5s cubic-bezier(0.3, 0.7, 0.4, 1); }
/* присела → подпрыгнула → мягко приземлилась */
@keyframes hop {
  0% { transform: translateX(-50%) scale(1, 1); }
  15% { transform: translateX(-50%) scale(1.08, 0.9); }
  45% { transform: translateX(-50%) translateY(-22px) scale(0.95, 1.06); }
  75% { transform: translateX(-50%) translateY(0) scale(1.04, 0.96); }
  100% { transform: translateX(-50%) scale(1, 1); }
}
.rate, .pick {
  position: absolute; top: 4px; padding: 6px 10px; border-radius: 99px;
  background: rgba(0, 0, 0, 0.5); font-size: 13px;
}
.rate { left: 0; display: flex; align-items: center; gap: 4px; }
.pick { right: 0; }
.arrow {
  position: absolute; top: 52%; transform: translateY(-50%);
  width: 40px; height: 56px; border-radius: var(--radius-sm);
  background: rgba(0, 0, 0, 0.45); border: 2px solid rgba(255, 255, 255, 0.15);
  font-size: 34px; font-weight: 900; line-height: 1;
  transition: transform 0.1s, background 0.15s;
  z-index: 3;
}
.arrow:active { transform: translateY(-50%) scale(0.9); background: rgba(0, 0, 0, 0.65); }
.arrow.left { left: -6px; }
.arrow.right { right: -6px; }
.dots { position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%); display: flex; gap: 6px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: rgba(255, 255, 255, 0.35); transition: all 0.2s; }
.dot.on { background: var(--gold); width: 18px; border-radius: 99px; }
</style>
