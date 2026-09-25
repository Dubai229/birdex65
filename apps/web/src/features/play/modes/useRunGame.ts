// Логика "Курица и бомбы": сверху падают бомбы, игрок ведёт курицу пальцем.
// Задело бомбой — конец. 20 яиц за минуту, 10 минут — победа и 500 яиц.

import { ref, onUnmounted } from 'vue'
import { ECONOMY } from '@/config/economy'
import { runDifficulty, runEggs } from '@/economy/modes'
import { playSound } from '@/services/audio'
import { haptics } from '@/services/haptics'

const R = ECONOMY.modes.run
const WIN_SECONDS = R.maxMinutes * 60
/** Хитбоксы чуть меньше картинок — задевание "по краю" прощается. */
const HEN_R = 24
const BOMB_R = 16
const HEN_SIZE = 76

export interface Bomb { id: number; x: number; y: number; speed: number; spin: number }
/** Перо: летит из точки (x, y) на (dx, dy), крутится и плавно падает. */
export interface Feather { id: number; x: number; y: number; dx: number; dy: number; rot: number; size: number; tone: number; dur: number }

const FEATHER_TONES = 3 // белое / кремовое / рыжее (цвета — в RunGame.vue)

export function useRunGame(onEnd: (seconds: number, win: boolean) => void) {
  const hen = ref({ x: 180, y: 460 })
  const bombs = ref<Bomb[]>([])
  const boom = ref<{ x: number; y: number } | null>(null)
  const elapsed = ref(0)
  const dragging = ref(false)
  const win = ref(false)
  const feathers = ref<Feather[]>([])

  /** Выпустить перья из курицы. big — взрыв: много перьев и далеко. */
  function puff(x: number, y: number, big: boolean) {
    const n = big ? 34 : 5
    const batch: Feather[] = []
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const d = big ? 60 + Math.random() * 140 : 20 + Math.random() * 35
      batch.push({
        id: nextId++,
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        dx: Math.cos(a) * d,
        dy: Math.sin(a) * d * 0.7 - (big ? 30 : 10),
        rot: (Math.random() - 0.5) * (big ? 720 : 360),
        size: (big ? 12 : 9) + Math.random() * (big ? 12 : 6),
        tone: Math.floor(Math.random() * FEATHER_TONES),
        dur: (big ? 1100 : 700) + Math.random() * 500,
      })
    }
    feathers.value.push(...batch)
    const ids = new Set(batch.map((f) => f.id))
    setTimeout(() => (feathers.value = feathers.value.filter((f) => !ids.has(f.id))), (big ? 1700 : 1300))
  }
  let size = { w: 360, h: 560 }
  let raf = 0
  let last = 0
  let spawnIn = 0.8
  let nextId = 1
  let running = false
  let grab = { dx: 0, dy: 0 }

  const eggs = () => runEggs(elapsed.value)

  function clampHen(x: number, y: number) {
    const m = HEN_SIZE / 2
    hen.value = {
      x: Math.min(size.w - m, Math.max(m, x)),
      y: Math.min(size.h - m, Math.max(size.h * 0.25, y)),
    }
  }

  function setSize(w: number, h: number) {
    size = { w, h }
  }

  function frame(ts: number) {
    if (!running) return
    const dt = Math.min(0.05, (ts - last) / 1000 || 0)
    last = ts
    elapsed.value += dt
    if (elapsed.value >= WIN_SECONDS) {
      elapsed.value = WIN_SECONDS
      win.value = true
      playSound('lvlup', 0.8)
      haptics.success()
      return stop(true)
    }
    const d = runDifficulty(elapsed.value)
    spawnIn -= dt
    if (spawnIn <= 0) {
      bombs.value.push({
        id: nextId++,
        x: 20 + Math.random() * (size.w - 40),
        y: -40,
        speed: d.fall * (0.85 + Math.random() * 0.3),
        spin: (Math.random() - 0.5) * 240,
      })
      spawnIn = d.spawnGap * (0.75 + Math.random() * 0.5)
    }
    const h = hen.value
    for (const b of bombs.value) {
      b.y += b.speed * dt
      if (Math.hypot(b.x - h.x, b.y - h.y) < HEN_R + BOMB_R) {
        boom.value = { x: b.x, y: b.y }
        bombs.value = bombs.value.filter((x) => x !== b)
        puff(h.x, h.y, true) // курицу разнесло — перья во все стороны
        playSound('error', 0.9)
        haptics.error()
        return stop(true, 700) // дать увидеть взрыв
      }
    }
    bombs.value = bombs.value.filter((b) => b.y < size.h + 50)
    raf = requestAnimationFrame(frame)
  }

  // Палец зажат где угодно на поле — курица едет за ним, сохраняя смещение ("держишь курицу").
  function down(x: number, y: number) {
    if (!running) return
    dragging.value = true
    grab = { dx: hen.value.x - x, dy: hen.value.y - y }
    // Каждое нажатие — курица квохчет и роняет пару перьев.
    playSound('chickenRun', 0.7, 0.08)
    puff(hen.value.x, hen.value.y, false)
  }
  function move(x: number, y: number) {
    if (!running || !dragging.value) return
    clampHen(x + grab.dx, y + grab.dy)
  }
  function up() {
    dragging.value = false
  }

  function start() {
    bombs.value = []
    boom.value = null
    feathers.value = []
    elapsed.value = 0
    win.value = false
    spawnIn = 0.8
    clampHen(size.w / 2, size.h - HEN_SIZE)
    running = true
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  function stop(report: boolean, delayMs = 0) {
    if (!running) return
    running = false
    dragging.value = false
    cancelAnimationFrame(raf)
    const seconds = Math.floor(elapsed.value)
    if (!report) return
    if (delayMs > 0) setTimeout(() => onEnd(seconds, win.value), delayMs)
    else onEnd(seconds, win.value)
  }

  onUnmounted(() => stop(true))

  return { hen, bombs, boom, feathers, elapsed, dragging, win, eggs, setSize, start, stop, down, move, up, HEN_SIZE }
}
