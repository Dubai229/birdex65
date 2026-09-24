// Точка входа API. UI импортирует только отсюда.
import type { GameApi } from './apiTypes'
import { mockApi } from './mockApi'

// TODO(backend): когда появится apps/api — добавить httpApi.ts и выбирать по env.
export const api: GameApi = mockApi

export { ApiError } from './apiTypes'
