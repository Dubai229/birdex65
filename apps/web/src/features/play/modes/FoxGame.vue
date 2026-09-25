<script setup lang="ts">
// Режим "Защита от лис": экран игры. Логика — useFoxGame, старт/финиш — useModeSession.
import { computed, onMounted, ref } from 'vue'
import { useFoxGame } from './useFoxGame'
import { useModeSession } from './useModeSession'
import { ECONOMY } from '@/config/economy'
import { formatNumber } from '@/economy/format'
import EggIcon from '@/components/EggIcon.vue'
import { ASSETS } from '@/config/assets'
import ModeResult from './ModeResult.vue'
import { t } from '@/i18n'

const emit = defineEmits<{ back: [] }>()
const session = useModeSession('fox')
const g = useFoxGame((kills, tanks) => session.finish({ kills, tanks }))
const field = ref<HTMLElement | null>(null)
const running = computed(() => session.phase.value === 'running')

async function begin() {
  // Нет энергии — ошибку уже показали, возвращаемся в меню режимов.
  if (!(await session.start())) return emit('back')
  const measure = () => {
    const r = field.value?.getBoundingClientRect()
    return r ? { w: r.width, h: r.height } : null
  }
  const m = measure()
  g.setSize(m?.w ?? 0, m?.h ?? 0, measure)
  g.start()
}

function onTap(ev: PointerEvent) {
  if (!running.value || !field.value) return
  ev.preventDefault()
  const r = field.value.getBoundingClientRect()
  g.tap(ev.clientX - r.left - r.width / 2, ev.clientY - r.top - r.height / 2)
}

/** Картинка лисы не загрузилась — рисуем эмодзи, чтобы лис всё равно было видно. */
const imgFailed = ref(false)

/** Лиса смотрит туда, куда бежит (к яйцу): зеркалим и слегка наклоняем по направлению. */
function foxTransform(x: number, y: number): string {
  const d = Math.hypot(x, y) || 1
  const tilt = Math.max(-35, Math.min(35, (-y / d) * 40))
  return x > 0 ? `scaleX(-1) rotate(${tilt}deg)` : `rotate(${tilt}deg)`
}

onMounted(begin)
</script>

<template>
  <div class="screen mode">
    <div class="hud">
      <span class="eggs"><EggIcon :size="22" /> {{ formatNumber(g.eggs()) }}</span>
      <span class="kills">🦊 {{ g.kills.value + g.tanks.value }}</span>
      <span class="lives">
        <span v-for="i in ECONOMY.modes.fox.lives" :key="i" class="life" :class="{ lost: i > g.lives.value }">❤️</span>
      </span>
    </div>

    <div ref="field" class="field" @pointerdown="onTap">
      <!-- Яйцо в центре: покачивается, при укусе вздрагивает. -->
      <div :key="g.bitten.value" class="egg-wrap" :class="{ hurt: g.bitten.value > 0 }">
        <div class="glow" />
        <div class="egg"><img class="basket" :src="ASSETS.eggBasket" alt="" draggable="false" /></div>
      </div>

      <div v-for="s in g.splats.value" :key="'s' + s.id" class="splat" :style="{ '--x': s.x + 'px', '--y': s.y + 'px' }">
        <span class="stain" :class="{ big: s.big }" />
        <span
          v-for="(d, i) in s.drops"
          :key="i"
          class="drop"
          :style="{ '--dx': d.dx + 'px', '--dy': d.dy + 'px', width: d.s + 'px', height: d.s + 'px' }"
        />
      </div>

      <div
        v-for="f in g.foxes.value"
        :key="f.id"
        class="fox"
        :class="{ tank: f.tank, dead: f.dead }"
        :style="{ '--x': f.x + 'px', '--y': f.y + 'px' }"
      >
        <span class="turn" :style="{ transform: foxTransform(f.x, f.y) }">
          <span v-if="imgFailed" :key="'e' + f.flash" class="body emoji" :class="{ hit: f.flash > 0 }">🦊</span>
          <img
            v-else
            :key="f.flash"
            class="body"
            :class="{ hit: f.flash > 0 }"
            :src="f.tank ? ASSETS.foxes.boss : ASSETS.foxes.normal"
            alt=""
            draggable="false"
            @error="imgFailed = true"
          />
        </span>
        <span v-if="f.tank && !f.dead" class="hp">
          <i v-for="i in ECONOMY.modes.fox.tankHits" :key="i" :class="{ on: i <= f.hp }" />
        </span>
      </div>

      <div v-for="p in g.pops.value" :key="'p' + p.id" class="pop" :style="{ '--x': p.x + 'px', '--y': p.y + 'px' }">
        {{ p.text }} <EggIcon :size="18" />
      </div>

      <div v-if="running && g.elapsed.value < 3" class="hint">{{ t('modes.foxHint') }}</div>

      <ModeResult
        v-if="!running"
        :phase="session.phase.value"
        :eggs="session.lastResult.value"
        :line="t('modes.foxResult', { n: g.kills.value + g.tanks.value, tanks: g.tanks.value })"
        :cost="ECONOMY.modes.fox.playCost"
        mode="fox"
        @again="begin"
        @back="emit('back')"
      />
    </div>
  </div>
</template>

<style scoped>
.mode { position: relative; z-index: 1; flex: 1; min-height: 480px; padding-bottom: calc(var(--safe-bottom) + 10px); }
.eggs, .kills { display: inline-flex; align-items: center; gap: 4px; }
.lives { display: inline-flex; gap: 2px; font-size: 20px; }
.life { transition: all 0.2s; }
.life.lost { filter: grayscale(1); opacity: 0.35; transform: scale(0.8); }
.field {
  position: relative; flex: 1; min-height: 380px; overflow: hidden; touch-action: none; user-select: none;
  border-radius: var(--radius-lg);
  background: radial-gradient(circle at 50% 50%, rgba(255, 220, 140, 0.18), rgba(0, 0, 0, 0.25) 70%);
}
.egg-wrap { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); }
.basket { display: block; width: 118px; height: auto; }
.egg { animation: wobble 1.6s ease-in-out infinite; transform-origin: 50% 90%; filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.45)); }
.glow {
  position: absolute; inset: -26px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 214, 120, 0.45), transparent 70%); animation: pulse 2s ease-in-out infinite;
}
.egg-wrap.hurt .egg { animation: bite 0.4s ease, wobble 1.6s ease-in-out 0.4s infinite; }
@keyframes wobble { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
@keyframes pulse { 50% { transform: scale(1.12); opacity: 0.7; } }
@keyframes bite {
  20% { transform: translateX(-8px) rotate(-14deg) scale(0.92); filter: drop-shadow(0 0 14px rgba(255, 40, 40, 0.9)); }
  50% { transform: translateX(7px) rotate(10deg); }
  80% { transform: translateX(-3px); }
}

/* Лиса — обычный блок нужного размера (без "нулевых" контейнеров), центр в точке (--x, --y) от центра поля. */
.fox {
  position: absolute; z-index: 2; width: 88px; height: 48px;
  left: calc(50% + var(--x) - 44px); top: calc(50% + var(--y) - 24px);
}
.fox.tank { width: 112px; height: 60px; left: calc(50% + var(--x) - 56px); top: calc(50% + var(--y) - 30px); }
.fox .turn { display: block; width: 100%; height: 100%; }
.fox .body {
  display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none;
  filter: drop-shadow(0 4px 3px rgba(0, 0, 0, 0.45)); animation: run 0.28s ease-in-out infinite alternate;
}
.fox .body.emoji { font-size: 44px; line-height: 48px; text-align: center; }
.fox.tank .body { filter: drop-shadow(0 0 6px rgba(140, 150, 170, 0.9)) drop-shadow(0 4px 3px rgba(0, 0, 0, 0.45)); }
.fox .body.hit { animation: hit 0.18s ease; }
.hp { position: absolute; left: 50%; top: -12px; transform: translateX(-50%); display: flex; gap: 3px; }
.hp i { width: 10px; height: 5px; border-radius: 3px; background: rgba(0, 0, 0, 0.5); }
.hp i.on { background: #ff5a3c; }
.fox.dead .body { animation: die 0.26s ease-out forwards; }
@keyframes run { to { margin-top: -4px; } }
@keyframes hit { 50% { filter: brightness(2.4) saturate(0); transform: scale(0.88); } }
@keyframes die { to { transform: scale(1.4) rotate(20deg); opacity: 0; } }

/* Кровь: пятно на земле + разлетающиеся капли. */
.splat {
  position: absolute; z-index: 1; width: 2px; height: 2px; pointer-events: none;
  left: calc(50% + var(--x) - 1px); top: calc(50% + var(--y) - 1px);
}
.stain {
  position: absolute; left: -26px; top: -18px; width: 52px; height: 36px; border-radius: 50%;
  background: radial-gradient(ellipse at 45% 45%, #b3121b 0 40%, #7a0a10 60%, transparent 72%);
  animation: stain 1.4s ease-out forwards;
}
.stain.big { left: -38px; top: -26px; width: 76px; height: 52px; }
.drop {
  position: absolute; left: 0; top: 0; border-radius: 50%; background: #c8141e;
  box-shadow: 0 0 4px rgba(200, 20, 30, 0.8); animation: drop 0.6s cubic-bezier(0.2, 0.7, 0.4, 1) forwards;
}
@keyframes stain { 0% { transform: scale(0.2); opacity: 0.95; } 25% { transform: scale(1); } 100% { opacity: 0; transform: scale(1.05); } }
@keyframes drop {
  0% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy) + 14px)) scale(0.4); opacity: 0; }
}

.pop {
  position: absolute; left: 50%; top: 50%; transform: translate(calc(-50% + var(--x)), var(--y));
  display: inline-flex; align-items: center; gap: 3px; font-size: 20px; font-weight: 900; color: var(--gold);
  text-shadow: 0 2px 0 #6a3a16; pointer-events: none; animation: pop 0.9s ease-out forwards;
}
@keyframes pop { to { transform: translate(calc(-50% + var(--x)), calc(var(--y) - 40px)); opacity: 0; } }
.hint {
  position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); padding: 6px 14px; border-radius: 99px;
  background: rgba(0, 0, 0, 0.55); font-weight: 800; font-size: 13px; white-space: nowrap; pointer-events: none;
}
@media (prefers-reduced-motion: reduce) { .egg, .glow, .fox .body { animation: none; } }
</style>
