// Локальное сохранение для mock-режима. На проде источник правды — сервер.

const KEY = 'birdex_save_v1'

export function loadSave<T>(): T | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeSave<T>(data: T): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* приватный режим / нет места — игнорируем */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}
