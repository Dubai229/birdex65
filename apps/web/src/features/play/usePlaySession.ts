// Логика мини-игры "Play": сессия, спавн яиц, ловля, комбо, таймер.
// Сервер выдаёт сессию и в конце проверяет итог (см. mockApi.finishPlay).

import { ref, computed, onUnmounted } from 'vue'
import { ECONOMY } from '@/config/economy'
import { comboMultiplier } from '@/economy/combo'
import { api, ApiError } from '@/services/api'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { playSound, playMusic } from '@/services/audio'
import { haptics } from '@/services/haptics'
import type { PlaySessionTicket } from '@/services/apiTypes'
import { t } from '@/i18n'

export interface FallingEgg {
  id: number
  x: number // 0..100 % ширины
  drift: number // горизонтальный снос, px
  spin: number // градусы
  golden: boolean
  caught: boolean
}

export type Phase = 'idle' | 'running' | 'finishing' | 'result'

const P = ECONOMY.play
const MAX_EGGS_ON_SCREEN = 14

export function usePlaySession() {
  const game = useGameStore()
  const ui = useUiStore()

  const phase = ref<Phase>('idle')
  const eggs = ref<FallingEgg[]>([])
  const timeLeft = ref(P.sessionSeconds)
  const normalCaught = ref(0)
  const goldenCaught = ref(0)
  const streak = ref(0)
  const maxCombo = ref(1)
  const localEnergy = ref(0)
  const lastResult = ref(0)

  let ticket: PlaySessionTicket | null = null
  let spawnTimer: number | undefined
  let clockTimer: number | undefined
  let lastCatchAt = 0
  let nextId = 1

  // TODO(balance): пока комбо только визуальное — сервер не умножает награду.
  const combo = computed(() => comboMultiplier(streak.value))
  const score = computed(() => normalCaught.value * P.normalReward + goldenCaught.value * P.goldenReward)

  function spawn() {
    if (eggs.value.length >= MAX_EGGS_ON_SCREEN) return
    eggs.value.push({
      id: nextId++,
      x: 8 + Math.random() * 84,
      drift: (Math.random() - 0.5) * 60,
      spin: (Math.random() - 0.5) * 240,
      golden: Math.random() < P.goldenChance,
      caught: false,
    })
  }

  function removeEgg(id: number) {
    const egg = eggs.value.find((e) => e.id === id)
    if (egg && !egg.caught) streak.value = 0 // упустил — комбо сброшено
    eggs.value = eggs.value.filter((e) => e.id !== id)
  }

  /** Возвращает награду за яйцо (для +N), или 0 если не засчитано. */
  function catchEgg(id: number): number {
    if (phase.value !== 'running') return 0
    const egg = eggs.value.find((e) => e.id === id)
    if (!egg || egg.caught) return 0
    if (localEnergy.value < ECONOMY.energy.costPerEgg) {
      ui.toast(t('play.noEnergy'), 'error')
      return 0
    }
    const now = performance.now()
    streak.value = now - lastCatchAt <= P.comboWindowMs ? streak.value + 1 : 1
    lastCatchAt = now
    maxCombo.value = Math.max(maxCombo.value, combo.value)
    egg.caught = true
    localEnergy.value -= ECONOMY.energy.costPerEgg
    if (egg.golden) {
      goldenCaught.value++
      playSound('eggGolden')
      haptics.medium()
    } else {
      normalCaught.value++
      playSound('eggCatch', 0.5)
    }
    setTimeout(() => removeEgg(id), 250)
    return egg.golden ? P.goldenReward : P.normalReward
  }

  async function start() {
    if (phase.value === 'running') return
    try {
      ticket = await api.startPlay()
    } catch (e) {
      ui.toast(t(`errors.${e instanceof ApiError ? e.code : 'UNKNOWN'}`), 'error')
      return
    }
    normalCaught.value = 0
    goldenCaught.value = 0
    streak.value = 0
    maxCombo.value = 1
    eggs.value = []
    localEnergy.value = ticket.energy
    timeLeft.value = P.sessionSeconds
    phase.value = 'running'
    playMusic('play')
    spawnTimer = window.setInterval(spawn, P.spawnEveryMs)
    clockTimer = window.setInterval(() => {
      timeLeft.value--
      if (timeLeft.value <= 0 || localEnergy.value <= 0) finish()
    }, 1000)
  }

  function stopTimers() {
    window.clearInterval(spawnTimer)
    window.clearInterval(clockTimer)
  }

  async function finish() {
    if (phase.value !== 'running' || !ticket) return
    stopTimers()
    phase.value = 'finishing'
    eggs.value = []
    try {
      const res = await api.finishPlay({
        sessionId: ticket.sessionId,
        normalCaught: normalCaught.value,
        goldenCaught: goldenCaught.value,
        maxCombo: maxCombo.value,
      })
      game.applyState(res.state)
      lastResult.value = res.eggsAwarded
      if (res.eggsAwarded > 0) haptics.success()
    } catch {
      lastResult.value = 0
      await game.refresh()
    }
    ticket = null
    phase.value = 'result'
    playMusic('farm')
  }

  function reset() {
    phase.value = 'idle'
  }

  // Ушёл с вкладки посреди игры — честно завершаем сессию.
  onUnmounted(() => {
    if (phase.value === 'running') finish()
    stopTimers()
  })

  return {
    phase, eggs, timeLeft, normalCaught, goldenCaught, combo, score, localEnergy, lastResult,
    start, finish, reset, catchEgg, removeEgg,
  }
}
