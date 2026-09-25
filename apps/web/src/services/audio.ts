// Звук и музыка.
// Эффекты — через Web Audio (без задержки, могут накладываться при быстрых тапах).
// Музыка — через <audio> (длинные файлы, стримятся).
// Если файла ещё нет — тихо ничего не играет.

import { SOUNDS, MUSIC, type SoundId, type MusicId } from '@/config/assets'

let soundOn = true
let musicOn = true
/** Громкость из настроек, 0..1. */
let soundVolume = 1
let musicVolume = 1
let musicBaseVolume = 0.35
let music: HTMLAudioElement | null = null
let currentMusic: MusicId | null = null

let ctx: AudioContext | null = null
const buffers = new Map<SoundId, AudioBuffer | null>()
const loading = new Map<SoundId, Promise<AudioBuffer | null>>()

function getCtx(): AudioContext | null {
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}

function load(id: SoundId): Promise<AudioBuffer | null> {
  const cached = loading.get(id)
  if (cached) return cached
  const c = getCtx()
  const p = !c
    ? Promise.resolve(null)
    : fetch(SOUNDS[id])
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('404'))))
        .then((data) => c.decodeAudioData(data))
        .catch(() => null)
  p.then((b) => buffers.set(id, b))
  loading.set(id, p)
  return p
}

/** Заранее загрузить звуки (чтобы первый тап прозвучал сразу). */
export function preloadSounds(ids: SoundId[]): void {
  ids.forEach((id) => void load(id))
}

/** Браузеры включают звук только после касания — вызываем на первом тапе. */
export function unlockAudio(): void {
  const c = getCtx()
  if (c && c.state === 'suspended') void c.resume()
}

export function setSoundEnabled(v: boolean): void {
  soundOn = v
}

export function setSoundVolume(v: number): void {
  soundVolume = Math.min(1, Math.max(0, v))
}

export function setMusicVolume(v: number): void {
  musicVolume = Math.min(1, Math.max(0, v))
  if (music) music.volume = musicBaseVolume * musicVolume
}

export function setMusicEnabled(v: boolean): void {
  musicOn = v
  if (!v) music?.pause()
  else if (currentMusic) playMusic(currentMusic)
}

/**
 * Проиграть эффект.
 * @param volume громкость 0..1
 * @param pitchJitter случайный разброс высоты (0.08 = ±8%), чтобы частые звуки не приедались
 */
export function playSound(id: SoundId, volume = 0.7, pitchJitter = 0): void {
  if (!soundOn || soundVolume <= 0) return
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  const play = (buf: AudioBuffer | null) => {
    if (!buf) return
    const src = c.createBufferSource()
    src.buffer = buf
    if (pitchJitter > 0) src.playbackRate.value = 1 + (Math.random() * 2 - 1) * pitchJitter
    const gain = c.createGain()
    gain.gain.value = volume * soundVolume
    src.connect(gain).connect(c.destination)
    src.start()
  }
  const buf = buffers.get(id)
  if (buf !== undefined) play(buf)
  else void load(id).then(play)
}

export function playMusic(id: MusicId, volume = 0.35): void {
  currentMusic = id
  if (!musicOn) return
  if (music && music.src.endsWith(MUSIC[id])) {
    music.play().catch(() => {})
    return
  }
  music?.pause()
  music = new Audio(MUSIC[id])
  music.loop = true
  musicBaseVolume = volume
  music.volume = volume * musicVolume
  music.play().catch(() => {})
}

export function stopMusic(): void {
  music?.pause()
}
