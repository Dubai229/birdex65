// Общая обёртка попытки для режимов Лисы и Бомбы:
// старт (списание энергии режима на "сервере") → игра → финиш (сервер считает награду).

import { ref, onUnmounted, watch } from 'vue'
import { api, ApiError } from '@/services/api'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { playSound, playMusic } from '@/services/audio'
import { haptics } from '@/services/haptics'
import type { ExtraMode } from '@/economy/modes'
import type { ModeSummary } from '@/services/apiTypes'
import { t } from '@/i18n'

export type ModePhase = 'idle' | 'starting' | 'running' | 'finishing' | 'result'

export function useModeSession(mode: ExtraMode) {
  const game = useGameStore()
  const ui = useUiStore()
  const phase = ref<ModePhase>('idle')
  const lastResult = ref(0)
  let sessionId: string | null = null

  // Пока идёт попытка — нижнее меню спрятано.
  watch(phase, (p) => (ui.playing = p === 'running'))

  /** Старт: false — не хватило энергии или ошибка. */
  async function start(): Promise<boolean> {
    if (phase.value === 'starting' || phase.value === 'running') return false
    phase.value = 'starting'
    try {
      const res = await api.startMode(mode)
      game.applyState(res.state)
      sessionId = res.sessionId
    } catch (e) {
      phase.value = 'idle'
      playSound('error', 0.7)
      haptics.error()
      ui.toast(t(`errors.${e instanceof ApiError ? e.code : 'UNKNOWN'}`), 'error')
      return false
    }
    phase.value = 'running'
    playMusic('play')
    return true
  }

  async function finish(summary: Omit<ModeSummary, 'sessionId' | 'mode'>) {
    if (phase.value !== 'running' || !sessionId) return
    phase.value = 'finishing'
    try {
      const res = await api.finishMode({ ...summary, sessionId, mode })
      game.applyState(res.state)
      lastResult.value = res.eggsAwarded
      if (res.eggsAwarded > 0) haptics.success()
    } catch {
      lastResult.value = 0
      await game.refresh()
    }
    sessionId = null
    phase.value = 'result'
    playMusic('farm')
  }

  onUnmounted(() => (ui.playing = false))

  return { phase, lastResult, start, finish }
}
