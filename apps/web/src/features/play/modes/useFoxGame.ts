// Логика "Защиты от лис": яйцо в центре, лисы бегут к нему со всех сторон.
// Тап по лисе — убил (обычная: 1 тап = 1 яйцо; плотная: 3 тапа = 5 яиц).
// Лиса добежала — кусает яйцо: минус жизнь. Скорость и поток лис растут со временем.

import { ref, onUnmounted } from 'vue'
import { ECONOMY } from '@/config/economy'
import { foxDifficulty, foxEggs } from '@/economy/modes'
import { playSound } from '@/services/audio'
import { haptics } from '@/services/haptics'

const F = ECONOMY.modes.fox
/** Радиус яйца: лиса ближе — кусает. */
const EGG_RADIUS = 56
/** Насколько далеко от лисы засчитывается тап (прощаем промах пальцем). */
const HIT_RADIUS = 58

export interface Fox {
  id: number
  x: number // от центра поля, px
  y: number
  speed: number
  tank: boolean
  hp: number
  flash: number // счётчик — перезапускает анимацию удара
  dead: boolean
}

export interface Drop { dx: number; dy: number; s: number }
export interface Splat { id: number; x: number; y: number; big: boolean; drops: Drop[] }

/** Капли крови: случайные направления и размеры (считаются один раз на всплеск). */
function makeDrops(big: boolean): Drop[] {
  const n = big ? 16 : 11
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.5
    const d = (big ? 46 : 34) + Math.random() * (big ? 40 : 28)
    return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, s: 5 + Math.random() * (big ? 9 : 6) }
  })
}
export interface Pop { id: number; x: number; y: number; text: string }

export function useFoxGame(onEnd: (kills: number, tanks: number) => void) {
  const foxes = ref<Fox[]>([])
  const splats = ref<Splat[]>([])
  const pops = ref<Pop[]>([])
  const lives = ref(F.lives)
  const kills = ref(0)
  const tanks = ref(0)
  const elapsed = ref(0)
  const bitten = ref(0) // счётчик укусов — тряска яйца
  let size = { w: 360, h: 560 }
  let raf = 0
  let last = 0
  let spawnIn = 0.6
  let nextId = 1
  let running = false

  const eggs = () => foxEggs(kills.value, tanks.value)

  /** Размер поля. Меряем заново перед каждой лисой — если на старте поле ещё не разложилось (0×0). */
  let measure: (() => { w: number; h: number } | null) | null = null
  function setSize(w: number, h: number, getter?: () => { w: number; h: number } | null) {
    size = { w, h }
    if (getter) measure = getter
  }
  function fieldSize() {
    const m = measure?.()
    if (m && m.w > 100 && m.h > 100) size = m
    if (size.w < 100 || size.h < 100) size = { w: window.innerWidth, h: Math.max(380, window.innerHeight - 160) }
    return size
  }

  function spawn() {
    const d = foxDifficulty(elapsed.value)
    const tank = Math.random() < d.tankChance
    // Появляется у края поля (сразу видно) в случайном направлении от яйца.
    const a = Math.random() * Math.PI * 2
    const fs = fieldSize()
    const hw = fs.w / 2 - 22
    const hh = fs.h / 2 - 22
    const k = Math.min(hw / Math.abs(Math.cos(a) || 1e-6), hh / Math.abs(Math.sin(a) || 1e-6))
    foxes.value.push({
      id: nextId++,
      x: Math.cos(a) * k,
      y: Math.sin(a) * k,
      speed: d.speed * (0.85 + Math.random() * 0.3) * (tank ? 0.75 : 1),
      tank,
      hp: tank ? F.tankHits : 1,
      flash: 0,
      dead: false,
    })
  }

  function bite(f: Fox) {
    foxes.value = foxes.value.filter((x) => x !== f)
    lives.value--
    bitten.value++
    playSound('miss', 0.8)
    haptics.error()
    if (lives.value <= 0) stop(true)
  }

  function frame(ts: number) {
    if (!running) return
    const dt = Math.min(0.05, (ts - last) / 1000 || 0)
    last = ts
    elapsed.value += dt
    spawnIn -= dt
    if (spawnIn <= 0) {
      const d = foxDifficulty(elapsed.value)
      spawn()
      // Под конец — иногда сразу по две лисы.
      if (elapsed.value > 60 && Math.random() < Math.min(0.5, (elapsed.value - 60) / 240)) spawn()
      spawnIn = d.spawnGap
    }
    for (const f of foxes.value) {
      if (f.dead) continue
      const dist = Math.hypot(f.x, f.y)
      const step = f.speed * dt
      if (dist - step <= EGG_RADIUS) {
        bite(f)
        if (!running) return
        continue
      }
      f.x -= (f.x / dist) * step
      f.y -= (f.y / dist) * step
    }
    raf = requestAnimationFrame(frame)
  }

  /** Тап по полю (координаты от центра поля). */
  function tap(x: number, y: number) {
    if (!running) return
    let best: Fox | null = null
    let bestD = Infinity
    for (const f of foxes.value) {
      if (f.dead) continue
      const d = Math.hypot(f.x - x, f.y - y)
      if (d < (f.tank ? HIT_RADIUS + 12 : HIT_RADIUS) && d < bestD) {
        best = f
        bestD = d
      }
    }
    if (!best) return
    const f = best
    f.hp--
    f.flash++
    if (f.hp > 0) {
      playSound('click', 0.7, 0.1)
      haptics.light()
      return
    }
    f.dead = true
    if (f.tank) tanks.value++
    else kills.value++
    const reward = f.tank ? F.tankReward : F.foxReward
    playSound(f.tank ? 'eggGolden' : 'eggCatch', 0.7, 0.08)
    haptics.medium()
    const id = nextId++
    splats.value.push({ id, x: f.x, y: f.y, big: f.tank, drops: makeDrops(f.tank) })
    pops.value.push({ id, x: f.x, y: f.y - 30, text: `+${reward}` })
    setTimeout(() => (foxes.value = foxes.value.filter((x) => x !== f)), 260)
    setTimeout(() => (splats.value = splats.value.filter((s) => s.id !== id)), 1400)
    setTimeout(() => (pops.value = pops.value.filter((p) => p.id !== id)), 900)
  }

  function start() {
    foxes.value = []
    splats.value = []
    pops.value = []
    lives.value = F.lives
    kills.value = 0
    tanks.value = 0
    elapsed.value = 0
    spawnIn = 0.6
    running = true
    last = performance.now()
    raf = requestAnimationFrame(frame)
  }

  /** Остановить игру; report — сообщить итог (конец жизней или уход с экрана). */
  function stop(report: boolean) {
    if (!running) return
    running = false
    cancelAnimationFrame(raf)
    if (report) onEnd(kills.value, tanks.value)
  }

  onUnmounted(() => stop(true))

  return { foxes, splats, pops, lives, kills, tanks, elapsed, bitten, eggs, setSize, start, stop, tap }
}
