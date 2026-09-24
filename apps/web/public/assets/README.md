# Ассеты BIRDEX

Кладёшь файл сюда → прописываешь путь в `src/config/assets.ts` (или `src/config/chickens.ts` для куриц).
Пока файла нет — в игре показывается emoji-заглушка, ничего не ломается.

| Папка | Что класть | Формат |
|---|---|---|
| `chickens/` | каждая курица отдельно, прозрачный фон, 512–1024px | PNG / WebP |
| `eggs/` | `egg.png`, `egg_golden.png`, `basket.png` | PNG |
| `farm/` | `background.webp` (фон фермы БЕЗ кнопок и текста), `barn.png` | WebP / PNG |
| `ui/` | `coin.png` (монетка-птичка), `egg_icon.png`, `energy.png`, иконки вкладок | PNG |
| `effects/` | частицы, блики, искры, sprite sheets анимаций | PNG |

Имена файлов куриц (уже прописаны в `config/chickens.ts`):
`farm_hen.png`, `red_hen.png`, `speckled_hen.png`, `black_hen.png`, `farmer_hen.png`, `golden_hen.png`

Анимации: простые (дыхание, моргание, падение, +1) делаются кодом.
Сложные (снесла яйцо, радуется) — sprite sheet: кадры в одну строку, одинакового размера.
