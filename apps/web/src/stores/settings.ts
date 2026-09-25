// Настройки игрока (звук, музыка, вибро, громкость). Хранятся локально на устройстве.

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { setSoundEnabled, setMusicEnabled, setSoundVolume, setMusicVolume } from '@/services/audio'
import { setHapticsEnabled } from '@/services/haptics'
import { setLocale, type Locale } from '@/i18n'

const KEY = 'birdex_settings'

interface Settings {
  sound: boolean
  music: boolean
  haptics: boolean
  /** Громкость 0..100 */
  soundVolume: number
  musicVolume: number
  farmBg: number
  language: Locale
}

const DEFAULTS: Settings = {
  sound: true, music: true, haptics: true, soundVolume: 80, musicVolume: 60, farmBg: 0, language: 'en',
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULTS }
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = load()
  const sound = ref(initial.sound)
  const music = ref(initial.music)
  const haptics = ref(initial.haptics)
  const soundVolume = ref(initial.soundVolume)
  const musicVolume = ref(initial.musicVolume)
  /** Индекс выбранного фона фермы (косметика, хранится на устройстве). */
  const farmBg = ref(initial.farmBg)
  const language = ref<Locale>(initial.language === 'ru' ? 'ru' : 'en')

  function apply() {
    setLocale(language.value)
    setSoundEnabled(sound.value)
    setMusicEnabled(music.value)
    setHapticsEnabled(haptics.value)
    setSoundVolume(soundVolume.value / 100)
    setMusicVolume(musicVolume.value / 100)
    try {
      localStorage.setItem(KEY, JSON.stringify({
        sound: sound.value, music: music.value, haptics: haptics.value,
        soundVolume: soundVolume.value, musicVolume: musicVolume.value, farmBg: farmBg.value, language: language.value,
      }))
    } catch { /* ignore */ }
  }

  watch([sound, music, haptics, soundVolume, musicVolume, farmBg, language], apply)
  apply()

  function shiftFarmBg(dir: 1 | -1, total: number) {
    if (total <= 0) return
    farmBg.value = (((farmBg.value + dir) % total) + total) % total
  }

  return { sound, music, haptics, soundVolume, musicVolume, farmBg, language, shiftFarmBg }
})
