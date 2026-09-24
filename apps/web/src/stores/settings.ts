// Настройки игрока (звук, музыка, вибро). Хранятся локально на устройстве.

import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { setSoundEnabled, setMusicEnabled } from '@/services/audio'
import { setHapticsEnabled } from '@/services/haptics'

const KEY = 'birdex_settings'

interface Settings { sound: boolean; music: boolean; haptics: boolean }

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { sound: true, music: true, haptics: true, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { sound: true, music: true, haptics: true }
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = load()
  const sound = ref(initial.sound)
  const music = ref(initial.music)
  const haptics = ref(initial.haptics)

  function apply() {
    setSoundEnabled(sound.value)
    setMusicEnabled(music.value)
    setHapticsEnabled(haptics.value)
    try {
      localStorage.setItem(KEY, JSON.stringify({
        sound: sound.value, music: music.value, haptics: haptics.value,
      }))
    } catch { /* ignore */ }
  }

  watch([sound, music, haptics], apply)
  apply()

  return { sound, music, haptics }
})
