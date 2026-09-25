<script setup lang="ts">
// Кометы в небе: раз в минуту с шансом 20% пролетает комета случайного цвета.
// Рисуются над фоном, но под карточками и кнопками — ничему не мешают, тапы не ловят.
import { onMounted, onUnmounted, ref } from 'vue'

/** Как часто проверяем (мс) и с каким шансом летит комета. */
const CHECK_EVERY_MS = 60_000
const CHANCE = 0.2
/** Цвета комет: [голова, хвост]. */
const COLORS: [string, string][] = [
  ['#ffffff', '#8fd3ff'], // голубая
  ['#fff6c8', '#f5b82e'], // золотая
  ['#ffe2f4', '#ff6fb5'], // розовая
  ['#e9ffe0', '#6fe07a'], // зелёная
  ['#efe4ff', '#a97bff'], // фиолетовая
  ['#ffe6d6', '#ff7a45'], // огненная
]

interface Comet {
  id: number
  top: number // старт по высоте, % экрана
  left: number // старт по ширине, %
  angle: number // наклон полёта, градусы
  dist: number // длина пути, px
  dur: number // мс
  len: number // длина хвоста, px
  head: string
  tail: string
}

const comets = ref<Comet[]>([])
let timer: number | undefined
let nextId = 1

function launch() {
  const [head, tail] = COLORS[Math.floor(Math.random() * COLORS.length)]
  const fromLeft = Math.random() < 0.5
  comets.value.push({
    id: nextId++,
    top: 2 + Math.random() * 28,
    left: fromLeft ? -10 + Math.random() * 30 : 80 + Math.random() * 30,
    // Летит вниз-вбок: слева направо или справа налево.
    angle: fromLeft ? 18 + Math.random() * 20 : 180 - (18 + Math.random() * 20),
    dist: 520 + Math.random() * 260,
    dur: 1400 + Math.random() * 900,
    len: 90 + Math.random() * 70,
    head,
    tail,
  })
}

function done(id: number) {
  comets.value = comets.value.filter((c) => c.id !== id)
}

onMounted(() => {
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  timer = window.setInterval(() => {
    if (document.visibilityState === 'visible' && Math.random() < CHANCE) launch()
  }, CHECK_EVERY_MS)
  // Для проверки: в консоли браузера window.__comet() запускает комету сразу.
  ;(window as unknown as { __comet?: () => void }).__comet = launch
})

onUnmounted(() => window.clearInterval(timer))
</script>

<template>
  <div class="comets" aria-hidden="true">
    <div
      v-for="c in comets"
      :key="c.id"
      class="comet"
      :style="{
        top: c.top + '%',
        left: c.left + '%',
        transform: `rotate(${c.angle}deg)`,
        '--dist': c.dist + 'px',
        '--len': c.len + 'px',
        '--head': c.head,
        '--tail': c.tail,
        '--dur': c.dur + 'ms',
      }"
    >
      <div class="fly" @animationend="done(c.id)">
        <span class="tail" />
        <span class="head" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* z-index 0 и после фона в разметке: над фоном, под экранами (у них z-index 1). */
.comets { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.comet { position: absolute; width: 0; height: 0; transform-origin: 0 0; }
.fly {
  position: absolute; left: 0; top: 0; display: flex; align-items: center;
  animation: comet-fly var(--dur) cubic-bezier(0.3, 0.1, 0.6, 1) forwards;
}
.tail {
  width: var(--len); height: 3px; border-radius: 99px; margin-right: -3px;
  background: linear-gradient(90deg, transparent, var(--tail));
  filter: blur(0.6px) drop-shadow(0 0 4px var(--tail));
}
.head {
  width: 7px; height: 7px; border-radius: 50%; background: var(--head);
  box-shadow: 0 0 6px 2px var(--tail), 0 0 16px 5px var(--tail);
}
@keyframes comet-fly {
  0% { transform: translate(0, -50%); opacity: 0; }
  12% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translate(var(--dist), -50%); opacity: 0; }
}
</style>
