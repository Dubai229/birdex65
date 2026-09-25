# Ассеты BIRDEX

Кладёшь файл сюда → прописываешь путь в `src/config/assets.ts` (или `src/config/chickens.ts` для куриц).
Пока файла нет — в игре показывается emoji-заглушка, ничего не ломается.

| Папка | Что класть | Формат |
|---|---|---|
| `chickens/` | каждая курица отдельно, прозрачный фон, 512–1024px | PNG / WebP |
| `eggs/` | `egg.png`, `egg_golden.png`, `basket.png` | PNG |
| `farm/backgrounds/` | фоны фермы `bg_1` … `bg_5` (листаются стрелками). Вертикальные, 1080×1920, без кнопок и текста | WebP / PNG / JPG |
| `play/` | `play_bg` — фон вкладки Play, 1080×1920 | WebP / PNG / JPG |
| `farm/` | `barn.png` и другие объекты фермы | PNG |
| `ui/` | `coin.png` (монетка-птичка), `egg_icon.png`, `energy.png`, иконки вкладок | PNG |
| `effects/` | частицы, блики, искры, sprite sheets анимаций | PNG |

Имена файлов куриц (уже прописаны в `config/chickens.ts`):
`farm_hen`, `red_hen`, `speckled_hen`, `black_hen`, `farmer_hen`, `golden_hen` (присылай любым именем — я переименую и сожму в .webp)

Анимации: простые (дыхание, моргание, падение, +1) делаются кодом.
Сложные (снесла яйцо, радуется) — sprite sheet: кадры в одну строку, одинакового размера.
