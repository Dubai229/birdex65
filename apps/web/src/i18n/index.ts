// Мини-i18n: все строки UI живут в словарях, не в компонентах.
import { ru } from './ru'

type Dict = { [k: string]: string | Dict }
const dict: Dict = ru

/** t('farm.collect') или t('shop.bought', { name: 'Рыжая' }) */
export function t(path: string, vars?: Record<string, string | number>): string {
  const value = path.split('.').reduce<string | Dict | undefined>(
    (node, key) => (typeof node === 'object' ? node[key] : undefined),
    dict,
  )
  if (typeof value !== 'string') return path
  if (!vars) return value
  return value.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`))
}
