<script setup lang="ts">
import EnergyIcon from '@/components/EnergyIcon.vue'
// Режим Play "Ловля яиц": 30 секунд, 3 жизни, скорость растёт. Открывается из меню режимов.
// Стартует сразу; нет энергии — возвращаемся в меню.
// Ледяное яйцо — заморозка: все яйца падают в 3 раза медленнее.
import { computed, onMounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/game'
import { usePlaySession } from './usePlaySession'
import { ECONOMY } from '@/config/economy'
import EggIcon from '@/components/EggIcon.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import FloatingReward from '@/components/FloatingReward.vue'
import { formatNumber, formatCompact } from '@/economy/format'
import { useUiStore } from '@/stores/ui'
import { playSound } from '@/services/audio'
import { haptics } from '@/services/haptics'
import { useShake } from '@/composables/useShake'
import { t } from '@/i18n'

const game = useGameStore()
const emit = defineEmits<{ back: [] }>()
const s = usePlaySession()
const field = ref<HTMLElement | null>(null)
const floats = ref<{ id: number; text: string; x: number; y: number; gold: boolean; egg: boolean }[]>([])
let fid = 0

const running = computed(() => s.phase.value === 'running')
const canStart = computed(() => game.energy >= ECONOMY.energy.playCost)
const ui = useUiStore()
const { shaking: startShaking, shake: shakeStart } = useShake()

/** Играть: нет энергии — звук ошибки, тряска кнопки и подсказка. */
async function onStart() {
  if (!canStart.value) {
    playSound('error', 0.7)
    haptics.error()
    ui.toast(t('errors.NO_ENERGY'), 'error')
    shakeStart()
    if (s.phase.value === 'idle') emit('back')
    return
  }
  await s.start()
  if (s.phase.value === 'idle') emit('back') // старт не удался — обратно в меню
}

onMounted(onStart)

/**
 * Тап по полю: ловим ближайшее к пальцу яйцо в радиусе ~60px.
 * Так яйцо ловится всегда, даже если палец чуть мимо или яйцо быстро летит.
 */
const HIT_RADIUS = 60
function onFieldTap(ev: PointerEvent) {
  if (!running.value || !field.value) return
  ev.preventDefault()
  let best: HTMLElement | null = null
  let bestD = Infinity
  for (const body of field.value.querySelectorAll<HTMLElement>('.egg:not(.caught) .body')) {
    const r = body.getBoundingClientRect()
    const d = Math.hypot(ev.clientX - (r.left + r.width / 2), ev.clientY - (r.top + r.height / 2))
    if (d <= Math.max(HIT_RADIUS, r.width * 0.9) && d < bestD) {
      bestD = d
      best = body.parentElement
    }
  }
  if (best) {
    const kind = best.classList.contains('trash') ? 'trash' : best.classList.contains('golden') ? 'golden' : best.classList.contains('ice') ? 'ice' : 'normal'
    onTap(Number(best.dataset.id), kind, ev)
  }
}

function onTap(id: number, kind: string, ev: PointerEvent) {
  const reward = s.catchEgg(id)
  if (!reward || !field.value) return
  const rect = field.value.getBoundingClientRect()
  const ice = reward === -1
  const trash = reward === -2
  floats.value.push({
    id: fid++,
    text: trash ? '-1 ❤️' : ice ? '❄ ×' + ECONOMY.play.iceSlowFactor : `+${formatCompact(reward)}`,
    gold: kind === 'golden',
    egg: !ice,
    x: ev.clientX - rect.left, y: ev.clientY - rect.top,
  })
}

// Яйцо падает ровно до нижнего края поля — промах засчитывается (и звучит) в момент,
// когда яйцо ушло за край. Скорость та же, что задаёт сложность (раньше путь был 115vh).
const fallCache = new Map<number, { fall: number; dur: number }>()
function eggFall(id: number, duration: number) {
  let v = fallCache.get(id)
  if (!v) {
    const h = field.value?.clientHeight ?? window.innerHeight
    const fall = h + 70
    v = { fall, dur: Math.round((duration * fall) / (window.innerHeight * 1.15)) }
    fallCache.set(id, v)
    if (fallCache.size > 200) fallCache.delete(fallCache.keys().next().value as number)
  }
  return v
}

// Заморозка: меняем скорость уже летящих CSS-анимаций (падение + вращение) через playbackRate.
function applyRate(el: Element | null) {
  el?.getAnimations?.({ subtree: true }).forEach((a) => (a.playbackRate = s.timeScale.value))
}
function eggRef(el: unknown) {
  if (el instanceof Element) applyRate(el)
}
watch(s.timeScale, () => field.value?.querySelectorAll('.egg').forEach(applyRate))

// Тряска экрана при пропущенном яйце.
const shaking = ref(false)
watch(s.lives, (now, before) => {
  if (now >= before || !running.value) return
  shaking.value = false
  requestAnimationFrame(() => (shaking.value = true))
})
</script>

<template>
  <div class="screen play" :class="{ running }">
    <div class="hud">
      <span class="eggs"><EggIcon :size="22" /> {{ running ? formatNumber(s.score.value) : formatNumber(game.balance?.eggs ?? 0) }}</span>
      <span class="play-timer" :class="{ frozen: s.frozenLeft.value > 0 }">
        <template v-if="running">{{ s.frozenLeft.value > 0 ? '❄' : '⏱' }} {{ s.remainingSeconds.value }}</template>
      </span>
      <span v-if="running" class="lives" :class="{ hurt: s.hurt.value }" @animationend="s.hurt.value = false">
        <span v-for="i in ECONOMY.play.lives" :key="i" class="life" :class="{ lost: i > s.lives.value }">❤️</span>
      </span>
      <span v-else class="muted"><EnergyIcon mode="catch" :size="18" /> {{ formatNumber(game.energy) }}</span>
    </div>

    <div ref="field" class="field" :class="{ shake: shaking }" @pointerdown="onFieldTap" @animationend.self="shaking = false">
      <div
        v-for="egg in s.eggs.value"
        :key="egg.id"
        :ref="eggRef"
        class="egg"
        :data-id="egg.id"
        :class="[egg.kind, { caught: egg.caught }]"
        :style="{
          left: egg.x + '%',
          '--drift': egg.drift + 'px',
          '--spin': egg.spin + 'deg',
          '--fall': eggFall(egg.id, egg.duration).fall + 'px',
          animationDuration: eggFall(egg.id, egg.duration).dur + 'ms',
        }"
        @animationend.self="s.eggLanded(egg.id)"
      >
        <span class="trail" />
        <span class="body">
          <span v-if="egg.kind === 'trash' && egg.trashIcon === 'rotten_egg'" class="trash-body rotten">
            <EggIcon :size="50" />
          </span>
          <span v-else-if="egg.kind === 'trash'" class="trash-body">{{ egg.trashIcon }}</span>
          <EggIcon v-else :size="52" :golden="egg.kind === 'golden'" :ice="egg.kind === 'ice'" />
        </span>
      </div>

      <FloatingReward v-for="f in floats" :key="f.id" v-bind="f" @done="floats = floats.filter((x) => x.id !== f.id)" />

      <div v-if="running && s.frozenLeft.value > 0" class="freeze-badge">❄ {{ s.frozenLeft.value }}</div>
      <div v-if="running && s.combo.value > 1" class="combo">{{ t('play.combo', { n: s.combo.value }) }}</div>

      <div v-if="!running" class="overlay">
        <template v-if="s.phase.value === 'result'">
          <div class="big">{{ t('play.earned', { n: formatNumber(s.lastResult.value) }) }}</div>
          <div class="muted">{{ t('play.caught') }}: {{ s.caught.value }}</div>
        </template>
        <template v-else-if="s.phase.value === 'finishing' || s.phase.value === 'starting'">
          <div class="big">…</div>
        </template>
        <template v-else>
          <div class="big">{{ t('play.title') }}</div>
          <div class="muted hint">{{ t('play.hint', { lives: ECONOMY.play.lives }) }}</div>
          <div class="value">
            {{ t('play.eggValue', { n: formatNumber(s.eggValue.value), level: game.profile?.level ?? 1 }) }}
          </div>
        </template>

        <div
          v-if="s.phase.value === 'idle' || s.phase.value === 'result'"
          :class="{ 'shake-x': startShaking, 'no-energy': !canStart }"
          @animationend="startShaking = false"
        >
          <PrimaryButton variant="gold" @click="onStart">
            ▶ {{ s.phase.value === 'result' ? t('play.again') : t('play.start') }} · <EnergyIcon mode="catch" :size="18" />{{ ECONOMY.energy.playCost }}
          </PrimaryButton>
        </div>
        <PrimaryButton v-if="s.phase.value === 'result'" variant="wood" @click="emit('back')">{{ t('modes.toMenu') }}</PrimaryButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.play { position: relative; z-index: 1; flex: 1; min-height: 480px; }
/* Во время игры нижнее меню спрятано — поле тянется до низа экрана. */
.play.running { padding-bottom: calc(var(--safe-bottom) + 10px); }
.eggs { display: inline-flex; align-items: center; gap: 4px; }
.play-timer { min-width: 58px; text-align: center; color: var(--gold); font-variant-numeric: tabular-nums; }
.play-timer.frozen { color: #bfe9ff; text-shadow: 0 0 8px rgba(120, 210, 255, 0.9); }
.lives { display: inline-flex; gap: 2px; font-size: 20px; }
.life { transition: transform 0.2s, filter 0.2s, opacity 0.2s; }
.life.lost { filter: grayscale(1); opacity: 0.35; transform: scale(0.8); }
.lives.hurt { animation: hurt 0.35s ease; }
@keyframes hurt {
  25% { transform: translateX(-4px) scale(1.15); }
  50% { transform: translateX(4px); }
  75% { transform: translateX(-2px); }
}
.field { position: relative; flex: 1; min-height: 360px; overflow: hidden; touch-action: none; border-radius: var(--radius-lg); }
.egg {
  position: absolute; top: -70px; line-height: 0; transform: translateX(-50%); padding: 8px; pointer-events: none;
  animation-name: fall; animation-timing-function: linear; animation-fill-mode: forwards;
}
/* Корпус яйца вращается отдельно, чтобы шлейф над ним не крутился. */
.egg .body {
  display: block; filter: drop-shadow(0 4px 3px rgba(0, 0, 0, 0.35));
  animation-name: spin; animation-timing-function: linear; animation-fill-mode: forwards;
  animation-duration: inherit;
}
.egg.golden .body { filter: drop-shadow(0 0 10px var(--gold)); }
.egg.ice .body { filter: drop-shadow(0 0 12px rgba(120, 210, 255, 0.95)); }
.egg.trash .body { filter: drop-shadow(0 4px 3px rgba(0, 0, 0, 0.55)); }
.trash-body {
  width: 46px; height: 46px; display: grid; place-items: center; border-radius: 14px;
  font-size: 34px; line-height: 1; background: rgba(39, 27, 18, 0.5);
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.08), 0 3px 0 rgba(0, 0, 0, 0.25);
}
.trash-body.rotten {
  position: relative; border-radius: 50%; background: transparent; box-shadow: none;
  filter: grayscale(0.85) sepia(0.55) hue-rotate(12deg) brightness(0.48) contrast(1.35) drop-shadow(0 4px 3px rgba(0, 0, 0, 0.55));
}
.trash-body.rotten::after {
  content: ''; position: absolute; inset: 9px 8px 10px; border-radius: 50%; pointer-events: none;
  background:
    radial-gradient(circle at 35% 38%, rgba(34, 24, 18, 0.9) 0 4px, transparent 5px),
    radial-gradient(circle at 62% 58%, rgba(18, 18, 15, 0.75) 0 5px, transparent 6px),
    radial-gradient(circle at 48% 72%, rgba(72, 83, 35, 0.65) 0 4px, transparent 5px);
  mix-blend-mode: multiply;
}
.egg.ice::after {
  content: ''; position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
  box-shadow: 0 0 0 2px rgba(180, 235, 255, 0.7); animation: ice-ring 1s ease-out infinite;
}
@keyframes ice-ring { from { transform: scale(0.6); opacity: 1; } to { transform: scale(1.4); opacity: 0; } }
.egg.caught { animation-play-state: paused; opacity: 0; transform: translateX(-50%) scale(1.6); transition: all 0.2s; }
.egg.caught .body, .egg.caught .trail { animation-play-state: paused; }
@keyframes fall {
  from { transform: translate(-50%, 0); }
  to { transform: translate(calc(-50% + var(--drift)), var(--fall, 115vh)); }
}
@keyframes spin { to { transform: rotate(var(--spin)); } }

/* Шлейф ветра над падающим яйцом: мягкий, ненавязчивый; у золотого и ледяного — свой. */
.trail {
  position: absolute; left: 50%; bottom: 62%; width: 34px; height: 96px; transform: translateX(-50%);
  pointer-events: none;
  background:
    radial-gradient(ellipse 45% 100% at 50% 100%, rgba(255, 255, 255, 0.42), rgba(255, 255, 255, 0) 100%),
    linear-gradient(to top, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0) 80%) 5px 40% / 2px 55% no-repeat,
    linear-gradient(to top, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0) 80%) calc(100% - 5px) 25% / 2px 70% no-repeat;
  filter: blur(1.2px);
  animation: trail-flicker 0.5s ease-in-out infinite alternate;
}
.egg.golden .trail {
  width: 38px; height: 110px;
  background:
    radial-gradient(ellipse 45% 100% at 50% 100%, rgba(255, 205, 70, 0.75), rgba(255, 190, 40, 0) 100%),
    radial-gradient(circle, rgba(255, 244, 180, 1) 0 1.6px, transparent 2.2px) 6px 0 / 11px 19px repeat-y,
    radial-gradient(circle, rgba(255, 244, 180, 0.9) 0 1.2px, transparent 1.8px) calc(100% - 6px) 8px / 9px 23px repeat-y;
  filter: blur(0.6px) drop-shadow(0 0 5px rgba(255, 200, 60, 0.7));
}
.egg.ice .trail {
  width: 38px; height: 110px;
  background:
    radial-gradient(ellipse 45% 100% at 50% 100%, rgba(165, 228, 255, 0.75), rgba(165, 228, 255, 0) 100%),
    radial-gradient(circle, rgba(240, 252, 255, 1) 0 1.6px, transparent 2.2px) 5px 0 / 11px 17px repeat-y,
    radial-gradient(circle, rgba(240, 252, 255, 0.9) 0 1.2px, transparent 1.8px) calc(100% - 5px) 6px / 9px 21px repeat-y;
  filter: blur(0.6px) drop-shadow(0 0 5px rgba(140, 215, 255, 0.8));
}
.egg.trash .trail {
  width: 30px; height: 82px;
  background:
    radial-gradient(ellipse 45% 100% at 50% 100%, rgba(80, 65, 52, 0.45), rgba(80, 65, 52, 0) 100%),
    linear-gradient(to top, rgba(80, 65, 52, 0.35), rgba(80, 65, 52, 0) 82%) 9px 35% / 2px 60% no-repeat;
  filter: blur(1px);
}
@keyframes trail-flicker { from { opacity: 0.7; transform: translateX(-50%) scaleX(0.9); } to { opacity: 1; transform: translateX(-50%) scaleX(1.05); } }
@media (prefers-reduced-motion: reduce) { .trail { display: none; } }

.freeze-badge {
  position: absolute; top: 12px; right: 12px; z-index: 4; padding: 4px 12px; border-radius: 99px;
  background: rgba(20, 60, 90, 0.75); border: 2px solid rgba(160, 225, 255, 0.9);
  font-weight: 900; font-size: 18px; color: #dff4ff; font-variant-numeric: tabular-nums;
}

/* Тряска поля при пропущенном яйце. */
.field.shake { animation: field-shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97); }
@keyframes field-shake {
  15% { transform: translate(-6px, 2px); }
  30% { transform: translate(5px, -3px); }
  45% { transform: translate(-4px, 1px); }
  60% { transform: translate(3px, 2px); }
  80% { transform: translate(-1px, -1px); }
}
@media (prefers-reduced-motion: reduce) { .field.shake { animation: none; } }
.combo {
  position: absolute; top: 14px; left: 50%; transform: translateX(-50%);
  font-size: 28px; font-weight: 900; color: var(--gold); text-shadow: 0 3px 0 #6a3a16;
  animation: pop-in 0.2s ease;
}
.overlay {
  position: absolute; inset: 0; background: rgba(20, 10, 4, 0.6); overflow-y: auto;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center;
}
.big { font-size: 32px; font-weight: 900; }
.no-energy :deep(.btn) { filter: saturate(0.5) brightness(0.8); }
.hint { max-width: 280px; }
.value {
  padding: 6px 14px; border-radius: 99px; font-weight: 900; font-size: 14px;
  background: rgba(0, 0, 0, 0.45); border: 2px solid var(--gold-dark); color: var(--gold);
}
</style>
