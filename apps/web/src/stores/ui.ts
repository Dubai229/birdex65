import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SheetId, TabId } from '@/types/game'

export interface Toast { id: number; text: string; kind: 'info' | 'success' | 'error' }

export const useUiStore = defineStore('ui', () => {
  const tab = ref<TabId>('farm')
  const sheet = ref<SheetId>(null)
  const toasts = ref<Toast[]>([])
  /** Курица, открытая в деталях на вкладке "Курицы". */
  const selectedChickenKey = ref<string | null>(null)
  /** Идёт попытка в Play — нижнее меню спрятано. */
  const playing = ref(false)
  let nextId = 1

  function setTab(id: TabId) {
    tab.value = id
    sheet.value = null
  }

  function openSheet(id: SheetId) {
    sheet.value = id
  }

  function closeSheet() {
    sheet.value = null
  }

  function toast(text: string, kind: Toast['kind'] = 'info') {
    const id = nextId++
    toasts.value.push({ id, text, kind })
    setTimeout(() => {
      toasts.value = toasts.value.filter((t) => t.id !== id)
    }, 2400)
  }

  return { tab, playing, sheet, toasts, selectedChickenKey, setTab, openSheet, closeSheet, toast }
})
