// Звук и музыка. Если файла ещё нет — тихо ничего не играет.

import { SOUNDS, MUSIC, type SoundId, type MusicId } from '@/config/assets'

const cache = new Map<SoundId, HTMLAudioElement>()
let soundOn = true
let musicOn = true
let music: HTMLAudioElement | null = null
let currentMusic: MusicId | null = null

export function setSoundEnabled(v: boolean): void {
  soundOn = v
}

export function setMusicEnabled(v: boolean): void {
  musicOn = v
  if (!v) music?.pause()
  else if (currentMusic) playMusic(currentMusic)
}

export function playSound(id: SoundId, volume = 0.7): void {
  if (!soundOn) return
  let base = cache.get(id)
  if (!base) {
    base = new Audio(SOUNDS[id])
    base.preload = 'auto'
    cache.set(id, base)
  }
  const node = base.cloneNode() as HTMLAudioElement
  node.volume = volume
  node.play().catch(() => { /* файла нет или автоплей запрещён */ })
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
  music.volume = volume
  music.play().catch(() => {})
}

export function stopMusic(): void {
  music?.pause()
}
