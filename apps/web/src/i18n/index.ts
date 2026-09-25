// Мини-i18n: все строки UI живут в словарях, не в компонентах.
import { ref } from 'vue'
import { en } from './en'
import { ru } from './ru'

type Dict = { [k: string]: string | Dict }
export type Locale = 'en' | 'ru'

const dictionaries: Record<Locale, Dict> = { en, ru }
const currentLocale = ref<Locale>('en')

export function setLocale(locale: Locale): void {
  currentLocale.value = dictionaries[locale] ? locale : 'en'
}

export function getLocale(): Locale {
  return currentLocale.value
}

/** t('farm.collect') или t('shop.bought', { name: 'Рыжая' }) */
export function t(path: string, vars?: Record<string, string | number>): string {
  const dict = dictionaries[currentLocale.value] ?? dictionaries.en
  const value = path.split('.').reduce<string | Dict | undefined>(
    (node, key) => (typeof node === 'object' ? node[key] : undefined),
    dict,
  )
  if (typeof value !== 'string') return path
  if (!vars) return value
  return value.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
}
