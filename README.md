# BIRDEX 🐔

Telegram Mini App — куриная ферма. Полное ТЗ: [`BIRDEX_MASTER_SPEC.md`](./BIRDEX_MASTER_SPEC.md).

## Запуск

```bash
npm install
npm run dev        # http://localhost:5173
npm run test       # тесты формул экономики
npm run build      # typecheck + сборка
```

Сейчас игра работает на **mock API** (`apps/web/src/services/mockApi.ts`) — бэкенда ещё нет,
сохранение в localStorage. Mock ведёт себя как сервер: клиент шлёт намерение, "сервер" считает.

## Вкладки

| # | Вкладка | Файл |
|---|---|---|
| 1 | Ферма — сцена, выбор курицы, сбор яиц | `features/farm/` |
| 2 | Play — падающие яйца, энергия, комбо | `features/play/` |
| 3 | Курочки — коллекция, улучшение | `features/chickens/` |
| 4 | Продать — яйца → монеты | `features/market/` |
| 5 | Магазин — покупка куриц | `features/shop/` |
| 6 | События — позже | `features/events/` |

Верх (`components/GameHeader.vue`): название фермы, монеты, яйца, Награда недели, Рейтинг, Друзья, Настройки.

## Структура `apps/web/src`

```
config/     все числа экономики, курицы, пути к ассетам и звукам
economy/    чистые функции формул + тесты (без Vue)
services/   API (mock), Telegram, звук, вибро, сохранение
stores/     Pinia: game (состояние), ui (вкладки/окна), settings
i18n/       все тексты интерфейса
components/ общие UI-компоненты
features/   экраны по вкладкам
styles/     дизайн-токены (цвета — только отсюда)
```

Ассеты: `apps/web/public/assets/`, звуки: `apps/web/public/audio/` (см. README внутри).

## Правила

- Каждый файл — одна зона ответственности, до ~300 строк.
- Числа экономики — только в `config/economy.ts`.
- Тексты — только в `i18n/ru.ts`.
- Балансы меняются только из ответа API.
- Никаких фиатных валют в UI — только монеты.
