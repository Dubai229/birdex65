<script setup lang="ts">
// Взрыв перьев с маленькими сердечками из точки. Родитель вызывает burst(x, y) через ref.
// Частицы разлетаются веером вверх и в стороны, крутятся, плавно тают.
// Всё на transform/opacity — дёшево для телефона. Число частиц ограничено.
import { ref } from 'vue'

interface Heart {
  id: number
  x: number
  y: number
  dx: number
  dy: number
  rot: number
  size: number
  delay: number
  dur: number
  color: 0 | 1 | 2
  kind: 'feather' | 'heart'
}

interface Ring { id: number; x: number; y: number }

const props = withDefaults(defineProps<{ count?: number; maxOnScreen?: number }>(), {
  count: 9,
  maxOnScreen: 60,
})

const hearts = ref<Heart[]>([])
const rings = ref<Ring[]>([])
let nextId = 1

const rand = (a: number, b: number) => a + Math.random() * (b - a)

function burst(x: number, y: number) {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const n = reduce ? 2 : props.count
  const fresh: Heart[] = []
  for (let i = 0; i < n; i++) {
    // Веер от -170° до -10° (вверх), с небольшим разбросом.
    const angle = ((-170 + (160 * (i + 0.5)) / n + rand(-8, 8)) * Math.PI) / 180
    const dist = rand(70, 140)
    fresh.push({
      id: nextId++,
      x, y,
      dx: Math.cos(angle) * dist,
      dy: Math.sin(angle) * dist - rand(10, 40), // чуть сильнее вверх — сердечки "всплывают"
      rot: rand(-40, 40),
      size: rand(22, 42),
      delay: rand(0, 90),
      dur: rand(900, 1300),
      color: (i % 3) as 0 | 1 | 2,
      kind: i % 4 === 1 ? 'heart' : 'feather',
    })
  }
  hearts.value = [...hearts.value, ...fresh].slice(-props.maxOnScreen)
  rings.value = [...rings.value, { id: nextId++, x, y }].slice(-4)
}

function removeHeart(id: number) {
  hearts.value = hearts.value.filter((h) => h.id !== id)
}
function removeRing(id: number) {
  rings.value = rings.value.filter((r) => r.id !== id)
}

defineExpose({ burst })
</script>

<template>
  <div class="layer" aria-hidden="true">
    <span
      v-for="r in rings"
      :key="r.id"
      class="ring"
      :style="{ left: r.x + 'px', top: r.y + 'px' }"
      @animationend="removeRing(r.id)"
    />
    <svg
      v-for="h in hearts"
      :key="h.id"
      class="particle"
      :class="[h.kind, 'c' + h.color]"
      viewBox="0 0 32 29"
      :width="h.kind === 'feather' ? Math.round(h.size * 0.78) : Math.round(h.size * 0.62)"
      :height="h.kind === 'feather' ? Math.round(h.size * 1.4) : Math.round(h.size * 0.62)"
      :style="{
        left: h.x + 'px',
        top: h.y + 'px',
        '--dx': h.dx + 'px',
        '--dy': h.dy + 'px',
        '--rot': h.rot + 'deg',
        animationDelay: h.delay + 'ms',
        animationDuration: h.dur + 'ms',
      }"
      @animationend="removeHeart(h.id)"
    >
      <template v-if="h.kind === 'heart'">
        <path
          d="M16 28.5C16 28.5 1 19.6 1 9.4 1 4.6 4.8 1 9.3 1c2.9 0 5.3 1.5 6.7 3.8C17.4 2.5 19.8 1 22.7 1 27.2 1 31 4.6 31 9.4 31 19.6 16 28.5 16 28.5Z"
        />
        <ellipse class="shine" cx="9" cy="8" rx="3.2" ry="2.2" transform="rotate(-30 9 8)" />
      </template>
      <template v-else>
        <path class="feather-fill" d="M16 1.5C7 7.8 4.8 18.7 14.5 27.5c9.3-4.9 13.2-16.5 1.5-26Z" />
        <path class="quill" d="M16.2 4.5c-1.4 7.4-1.6 14.2-1.2 22" />
        <path class="barbs" d="M15.7 9.4 9.5 13.2M15.2 14.1l-7 4.4M15 18.5l-4.6 4.3M16.5 10.2l5.2 3.2M16 15.2l6 3.1M15.7 19.6l3.8 3.1" />
      </template>
    </svg>
  </div>
</template>

<style scoped>
.layer {
  position: absolute; inset: 0; pointer-events: none; overflow: visible; z-index: 4;
  /* Прозрачность сердечек на пике (1 = непрозрачные). */
  --max-opacity: 0.5;
}

.particle {
  position: absolute; margin: 0; transform: translate(-50%, -50%) scale(0);
  opacity: 0; will-change: transform, opacity;
  animation-name: heart-fly; animation-timing-function: cubic-bezier(0.2, 0.8, 0.3, 1);
  animation-fill-mode: forwards;
  filter: drop-shadow(0 2px 3px rgba(120, 0, 30, 0.25));
}
.heart path { stroke: rgba(255, 255, 255, 0.85); stroke-width: 1.6; }
.heart .shine { fill: rgba(255, 255, 255, 0.75); }
.heart.c0 path { fill: #ff6f90; }
.heart.c1 path { fill: #ff9ab6; }
.heart.c2 path { fill: #f05278; }
.heart { --max-opacity: 0.42; }
.feather { --max-opacity: 0.85; }
.feather .feather-fill { fill: #fff2dc; stroke: #b87742; stroke-width: 1.4; }
.feather.c1 .feather-fill { fill: #ffe0bd; }
.feather.c2 .feather-fill { fill: #f7f0e8; }
.feather .quill, .feather .barbs {
  fill: none; stroke: rgba(117, 72, 34, 0.78); stroke-width: 1.4; stroke-linecap: round;
}

@keyframes heart-fly {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.2) rotate(0); }
  15% { opacity: var(--max-opacity); transform: translate(calc(-50% + var(--dx) * 0.25), calc(-50% + var(--dy) * 0.25)) scale(1.15) rotate(calc(var(--rot) * 0.3)); }
  35% { transform: translate(calc(-50% + var(--dx) * 0.55), calc(-50% + var(--dy) * 0.55)) scale(1) rotate(calc(var(--rot) * 0.6)); }
  /* лёгкое покачивание при всплытии */
  65% { opacity: var(--max-opacity); transform: translate(calc(-50% + var(--dx) * 0.85 + 4px), calc(-50% + var(--dy) * 0.85)) scale(0.95) rotate(var(--rot)); }
  100% { opacity: 0; transform: translate(calc(-50% + var(--dx) - 3px), calc(-50% + var(--dy) - 18px)) scale(0.7) rotate(var(--rot)); }
}

.ring {
  position: absolute; width: 40px; height: 40px; border-radius: 50%;
  border: 3px solid rgba(255, 214, 150, 0.85);
  transform: translate(-50%, -50%) scale(0.3); opacity: 0.45;
  animation: ring 0.55s ease-out forwards;
}
@keyframes ring {
  to { transform: translate(-50%, -50%) scale(3.2); opacity: 0; border-width: 1px; }
}

@media (prefers-reduced-motion: reduce) {
  .ring { display: none; }
}
</style>
