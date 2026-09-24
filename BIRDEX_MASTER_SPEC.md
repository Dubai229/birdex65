# BIRDEX --- MASTER PROJECT SPEC / AI DEVELOPMENT PROMPT

> Working title: **BIRDEX**\
> Product type: **Telegram Mini App / idle farm economy game**\
> Primary platform: **Telegram Mini Apps**\
> Core fantasy: own chickens → produce eggs → sell eggs for Coins →
> buy/upgrade chickens → expand farm → complete tasks → invite friends →
> progress through rarities and leagues.
>
> **Important:** all currencies and rewards described below are in-game
> virtual values. Do not display UAH/USD/EUR equivalents in the UI. Do
> not imply guaranteed investment returns, withdrawals, or real-money
> profit.

------------------------------------------------------------------------

## 0. INSTRUCTIONS FOR CLAUDE CODE / CODEX

You are working as one of several AI coding agents on the same
repository together with 2--3 human developers and another AI agent.

Before changing anything:

1.  Read this file completely.
2.  Inspect the existing repository structure and current
    implementation.
3.  Read `README.md`, `package.json`, environment examples, database
    schema/migrations, API contracts, and any agent-specific instruction
    files if they exist.
4.  Do **not** rewrite working modules just because you prefer another
    architecture.
5.  Reuse existing components, types, utilities, API clients, stores,
    tokens, and conventions.
6.  Make the smallest coherent change required for the current task.
7.  Never silently change an API contract, DB schema, economy formula,
    shared type, or naming convention.
8.  If a shared contract must change, update all affected consumers in
    the same task.
9.  Never commit secrets, Telegram bot tokens, DB credentials, private
    keys, or `.env`.
10. Never trust economy values sent by the client. Coins, eggs,
    upgrades, rewards, claims and referrals are validated and mutated
    server-side.
11. Keep business logic out of Vue components whenever possible.
12. Prefer deterministic, testable economy functions.
13. Before finishing a task, run available lint/typecheck/tests/build
    and fix regressions caused by your changes.
14. Do not delete another developer's unfinished code unless the current
    task explicitly requires it.
15. Do not introduce a new dependency when the existing stack can
    reasonably solve the problem.
16. If requirements are ambiguous, preserve backwards compatibility and
    document the assumption in the PR/commit notes rather than inventing
    a large new feature.

### Collaboration rule

Each task should be isolated to its own branch where practical:

-   `feature/home`
-   `feature/farm`
-   `feature/chickens`
-   `feature/economy`
-   `feature/referrals`
-   `feature/tasks`
-   `feature/telegram-auth`
-   `feature/animations`
-   `fix/...`

Avoid having two agents simultaneously refactor the same shared files.

Recommended ownership split:

-   **Developer/AI A:** frontend, UI, animations, Telegram Mini App
    integration.
-   **Developer/AI B:** backend, database, economy, auth, anti-cheat,
    referrals.
-   Shared API contracts/types are changed deliberately and communicated
    before merging.

------------------------------------------------------------------------

# 1. PRODUCT VISION

BIRDEX should feel like a polished Telegram farm/economy product, **not
like a primitive tap-to-earn clone**.

The visual world is a warm stylized chicken farm:

-   cartoon 3D / illustrated chickens;
-   slightly dirty feathers and natural farm imperfections;
-   wood, straw, nests, barns, crates and fences;
-   warm sunlight;
-   expressive but not overly childish characters;
-   premium game-quality UI;
-   tactile animations and satisfying feedback.

The user owns a growing chicken farm.

The main progression loop is:

**Chickens → Eggs → Sell → Coins → Upgrade / Buy Chickens → More Eggs →
Expand → Unlock rarities**

Tapping is only one secondary activity. It must **not** dominate the
product.

The game should still make sense if the user barely uses the tap
mechanic.

------------------------------------------------------------------------

# 2. CORE PRODUCT PRINCIPLES

### 2.1 Main screen is NOT a clicker

The first screen after opening the Mini App is the user's living
farm/dashboard.

The user should immediately understand:

-   what they own;
-   how many eggs were produced;
-   current Coin balance;
-   what is ready to collect;
-   what can be upgraded next;
-   current daily objective;
-   farm progression.

The farm itself is the visual hero.

### 2.2 Second tab contains active farming / tapping

The click/farm mechanic lives in its own tab.

It is an optional active way to earn additional eggs and should have:

-   energy;
-   falling eggs;
-   combo feedback;
-   occasional bonus eggs;
-   satisfying particles;
-   limited session duration.

### 2.3 One primary currency

Use **Coins**.

UI examples:

-   `12 458`
-   `+250`
-   `Upgrade — 1 250`
-   `Sell 120 eggs → 600 Coins`

Do not show:

-   `грн`
-   `$`
-   `€`
-   fiat equivalents.

### 2.4 Eggs are a resource, not money

Eggs are produced by chickens.

Eggs can be sold in-game for Coins.

Coins are spent on:

-   chickens;
-   upgrades;
-   farm improvements;
-   selected boosts;
-   cosmetic/progression unlocks.

Keep `Eggs` and `Coins` as separate balances.

------------------------------------------------------------------------

# 3. NAVIGATION

Use a persistent bottom navigation with **5 tabs**.

## Tab 1 --- HOME / FARM

Icon: house/barn.

This is the default screen.

It should feel alive even when the user does nothing.

### Header

Display:

-   avatar;
-   username;
-   player level;
-   Coin balance;
-   egg storage indicator;
-   settings button.

Example:

`Ruslan   Lv. 7` `🪙 12 458` `🥚 428 / 1 000`

Do not display fiat currency.

### Main farm scene

Large visual farm area occupying roughly 45--60% of the useful viewport.

Possible visible elements:

-   barn;
-   chicken coop;
-   1--3 currently selected chickens;
-   nests;
-   eggs;
-   fence;
-   grass/dirt;
-   upgradeable farm objects.

Chickens have idle animations:

-   subtle breathing;
-   blinking;
-   looking around;
-   small body/head movements;
-   pecking ground occasionally;
-   occasional cluck;
-   rare egg-laying animation.

Avoid constant chaotic movement.

### Offline production card

When production has accumulated:

**Your farm produced** `🥚 284 eggs`

`Collect`

Production continues for a configurable offline cap.

Initial MVP suggestion:

-   offline production cap: 8 hours;
-   exact values must live in server-side config.

### Quick actions

Small cards/buttons:

-   `Collect`
-   `Sell eggs`
-   `Upgrade`
-   `Daily reward`

### Farm progress

Example:

`Farm Level 4` `3 / 5 chickens` `Next unlock: New Coop`

### Daily objective

One compact objective:

`Sell 300 eggs` `184 / 300`

Reward:

`+500 Coins`

------------------------------------------------------------------------

# 4. TAB 2 --- ACTIVE FARM

This is the active interaction / tapping screen.

Do NOT call the main CTA "Make money".

Possible naming:

-   `Farm`
-   `Collect`
-   `Egg Hunt`

### Screen

Large chicken centered on screen.

Eggs periodically fall from the upper area.

The user taps eggs before they disappear or taps the active farm area to
trigger production depending on the final mechanic.

Recommended mechanic for MVP:

**Tap falling eggs.**

Reasons:

-   visually understandable;
-   less generic than tapping a giant coin;
-   directly connected to the chicken theme;
-   allows rare/golden/bad eggs later.

### Egg types

MVP:

-   normal egg: `+1`;
-   golden egg: `+5`, rare.

Later:

-   double egg;
-   mystery egg;
-   rotten egg;
-   combo egg;
-   event egg.

### Energy

Example:

`⚡ 850 / 1000`

Each successful action consumes configurable energy.

Energy restores over time.

All authoritative calculations are server-side.

### Combo

Example:

`x2` `x3` `x5`

Fast successful taps can temporarily increase active-farm rewards.

Do not let active farming destroy the idle economy balance.

### Animation requirements

Egg:

1.  spawns above viewport;
2.  falls with slight horizontal drift;
3.  rotates;
4.  reacts to tap;
5.  squashes/cracks/pops;
6.  `+1` floats upward;
7.  particles disappear;
8.  egg counter animates.

Chicken:

-   idle breathing loop;
-   blink at irregular intervals;
-   reaction to successful combo;
-   occasional head movement;
-   short happy animation after a bonus.

Prefer lightweight sprite/Spine-style assets and GSAP/CSS/Canvas effects
rather than video.

------------------------------------------------------------------------

# 5. TAB 3 --- CHICKENS

This is the collection and progression screen.

### Chicken card

Each chicken has:

-   ID;
-   name;
-   rarity;
-   level;
-   production rate;
-   upgrade cost;
-   ownership state;
-   optional visual skin/accessories.

Example:

**Farm Hen** Rare Level 4

`Production: 18 eggs/hour` `Next level: 22 eggs/hour`

`Upgrade — 1 250 Coins`

### Initial rarity system

-   Common
-   Uncommon
-   Rare
-   Epic
-   Legendary

Avoid launching with too many rarities.

### Initial chicken concepts

1.  **Farm Hen** --- starter.
2.  **Red Hen** --- improved production.
3.  **Speckled Hen** --- uncommon.
4.  **Black Hen** --- rare.
5.  **Farmer Hen** --- epic.
6.  **Golden Hen** --- legendary.

Characters should share a coherent art direction while remaining
visually recognizable.

### Buying

A player can:

-   buy a new chicken with Coins;
-   upgrade owned chickens;
-   equip/select chickens shown on Home;
-   later unlock special chickens from events.

### Upgrade formula

Do not hardcode upgrade values throughout UI.

Use centralized economy configuration.

Conceptual formula:

`upgradeCost = baseCost * growthRate^(level - 1)`

Production:

`production = baseProduction * productionGrowth^(level - 1)`

Final constants must be configurable.

------------------------------------------------------------------------

# 6. TAB 4 --- MARKET

This is where the economic loop becomes tangible.

## Sell eggs

Display:

`Egg storage` `1 248 eggs`

Controls:

-   `25%`
-   `50%`
-   `MAX`
-   optional numeric input/slider.

Preview:

`1 248 eggs → 6 240 Coins`

CTA:

`SELL`

On sale:

-   basket/crate animation;
-   eggs move toward market;
-   Coin particles appear;
-   Coin balance counts upward;
-   optional chicken reaction.

### Egg price

For MVP, use a stable configurable base price.

Later possibilities:

-   daily market modifier;
-   temporary events;
-   farm upgrades affecting sell price;
-   special egg categories.

Do not introduce a complex player-driven market in MVP.

## Shop

Market may also contain:

-   chicken offers;
-   farm upgrades;
-   cosmetic items;
-   limited event offers.

Keep the initial version simple.

------------------------------------------------------------------------

# 7. TAB 5 --- MORE / MISSIONS

This tab contains secondary retention systems.

Sections:

### Daily reward

7-day streak.

Example:

-   Day 1 --- 100 Coins
-   Day 2 --- 150
-   Day 3 --- 250
-   Day 4 --- 400
-   Day 5 --- 600
-   Day 6 --- 900
-   Day 7 --- special chest / larger Coin reward

Missing a day should not necessarily destroy the entire streak. This
behavior must be configurable.

### Tasks

Examples:

-   collect 100 eggs;
-   sell 250 eggs;
-   upgrade a chicken;
-   use Active Farm for 60 seconds;
-   collect offline production;
-   invite an active friend.

### Referrals

Referral rewards must be tied to legitimate activation rather than
simply opening a link.

Example activation requirement:

-   referral launches Mini App;
-   completes onboarding;
-   performs initial farm action / reaches configured milestone.

Referral page:

`Your flock` `7 friends`

`Active: 5`

Milestones:

-   1 active friend;
-   3 active friends;
-   5 active friends;
-   10 active friends.

Rewards should be in-game Coins/items/progression.

### Leaderboard

Possible metrics:

-   Farm Value;
-   Eggs Produced;
-   Farm Level;
-   collection completion.

Avoid ranking purely by number of referrals.

### Profile / Settings

-   Telegram identity;
-   sound;
-   music;
-   haptics;
-   language;
-   help;
-   terms/privacy links.

------------------------------------------------------------------------

# 8. ONBOARDING

Target: under 60 seconds.

Flow:

1.  Mini App launches.
2.  Telegram auth is validated.
3.  Short logo/loading scene.
4.  User receives starter chicken.
5.  Chicken lays first egg.
6.  User collects it.
7.  User is shown egg storage.
8.  User sells starter eggs.
9.  User receives Coins.
10. User performs first chicken upgrade.
11. User lands on Home with a clear next objective.

Do not show five tutorials at once.

Use contextual coach marks.

------------------------------------------------------------------------

# 9. ECONOMY MODEL

The economy must be controlled by backend configuration.

Core resources:

``` ts
type Currency = {
  coins: bigint | number
  eggs: bigint | number
  energy: number
}
```

Choose safe numeric storage for expected scale. If balances may exceed
JS safe integer limits, use DB `BIGINT`/decimal strategy and serialize
safely.

### Production

Concept:

``` text
totalEggsPerHour =
  sum(production of all active/owned production chickens)
  * farmMultiplier
  * temporaryMultiplier
```

Offline production:

``` text
elapsed = min(now - lastProductionAt, offlineCap)
produced = ratePerSecond * elapsed
```

The server determines the authoritative result.

### Sale

``` text
coinsReceived = eggsSold * currentEggSellPrice
```

Execute as a single atomic server transaction:

1.  verify egg balance;
2.  subtract eggs;
3.  add Coins;
4.  create economy transaction record;
5.  return new balances.

### Ledger

Important economy mutations should create ledger entries.

Examples:

-   `OFFLINE_COLLECT`
-   `ACTIVE_FARM_REWARD`
-   `EGGS_SOLD`
-   `CHICKEN_PURCHASE`
-   `CHICKEN_UPGRADE`
-   `DAILY_REWARD`
-   `TASK_REWARD`
-   `REFERRAL_REWARD`

This is useful for debugging, balancing and anti-cheat.

------------------------------------------------------------------------

# 10. BACKEND SECURITY / ANTI-CHEAT

Never accept client claims such as:

``` json
{
  "coins": 999999,
  "eggsProduced": 500000
}
```

Client sends **intent**, server calculates result.

Examples:

``` text
POST /economy/collect-offline
POST /market/sell-eggs
POST /chickens/:id/upgrade
POST /rewards/daily/claim
POST /farm/session/start
POST /farm/session/finish
```

For active farming, do not POST every animation frame.

Design sessions/events with:

-   server-issued session ID;
-   start timestamp;
-   max duration;
-   energy snapshot;
-   plausible action limits;
-   validated event summary;
-   rate limiting;
-   duplicate/idempotency protection.

### Telegram auth

Validate Telegram Mini App `initData` on the backend according to
Telegram's official validation method.

Never trust `user.id`, username, balances or auth state provided
independently by frontend.

------------------------------------------------------------------------

# 11. SUGGESTED TECH STACK

Use the existing repository stack if already established. Do not migrate
merely to match this section.

Recommended greenfield stack:

### Frontend

-   Vue 3
-   TypeScript
-   Vite
-   Pinia
-   Vue Router if routes are useful
-   Telegram Mini Apps SDK/integration layer
-   GSAP for micro-animations where useful
-   CSS variables/design tokens
-   optional Canvas/Pixi only if active-farm performance requires it

### Backend

-   Node.js
-   TypeScript
-   Fastify / NestJS / existing framework chosen by team
-   PostgreSQL
-   Redis for caching/rate limiting/session state where justified
-   background worker/queue only when needed

### Monorepo

Suggested:

``` text
birdex/
├── apps/
│   ├── web/
│   ├── api/
│   └── bot/
│
├── packages/
│   ├── shared/
│   ├── economy/
│   ├── config/
│   └── ui/
│
├── assets/
│   ├── chickens/
│   ├── eggs/
│   ├── farm/
│   ├── effects/
│   └── audio/
│
├── docs/
│   ├── economy.md
│   ├── api.md
│   └── art-direction.md
│
├── .env.example
├── docker-compose.yml
└── README.md
```

Do not create empty packages purely to match this diagram. Add them as
functionality requires.

------------------------------------------------------------------------

# 12. INITIAL DATA MODEL

Exact ORM syntax depends on the repository.

Conceptual entities:

## User

``` text
id
telegramUserId
username
firstName
level
xp
coins
eggs
energy
energyUpdatedAt
eggStorageCapacity
farmLevel
lastProductionAt
createdAt
updatedAt
```

## ChickenDefinition

Static/configurable game definition:

``` text
id
key
name
rarity
basePrice
baseProductionPerHour
baseUpgradeCost
maxLevel
assetKey
enabled
```

## UserChicken

``` text
id
userId
chickenDefinitionId
level
acquiredAt
isDisplayed
```

## EconomyTransaction

``` text
id
userId
type
coinDelta
eggDelta
metadata
idempotencyKey
createdAt
```

## DailyRewardState

``` text
userId
streak
lastClaimAt
nextClaimAt
```

## TaskProgress

``` text
userId
taskKey
progress
target
claimedAt
periodKey
```

## Referral

``` text
id
inviterUserId
referredUserId
status
activatedAt
rewardedAt
createdAt
```

## ActiveFarmSession

``` text
id
userId
startedAt
expiresAt
initialEnergy
status
resultSummary
createdAt
```

Use constraints and unique indexes to prevent duplicate Telegram users,
duplicate referral relationships and duplicate reward claims.

------------------------------------------------------------------------

# 13. API CONTRACT PRINCIPLES

All API responses should have predictable typed contracts.

Example:

``` ts
type BalanceDto = {
  coins: string
  eggs: string
  energy: number
  energyMax: number
}
```

For large integers, prefer strings over unsafe JSON numbers.

Example endpoint groups:

``` text
/auth
/me
/farm
/chickens
/market
/rewards
/tasks
/referrals
/leaderboard
```

Do not expose internal DB entities directly.

Use DTOs/contracts in shared package when practical.

------------------------------------------------------------------------

# 14. FRONTEND ARCHITECTURE

Suggested feature-oriented structure:

``` text
src/
├── app/
├── components/
├── features/
│   ├── home/
│   ├── active-farm/
│   ├── chickens/
│   ├── market/
│   ├── rewards/
│   ├── tasks/
│   └── referrals/
├── stores/
├── services/
├── composables/
├── assets/
├── styles/
└── types/
```

### State

Do not put every server response into a giant global store.

Global/session state:

-   user;
-   balances;
-   selected/displayed chickens;
-   basic farm status.

Feature-specific state stays within its feature where possible.

### UI components

Reusable examples:

-   `GameHeader`
-   `BottomNav`
-   `BalanceCounter`
-   `ChickenCard`
-   `ChickenStage`
-   `RewardModal`
-   `ProgressBar`
-   `PrimaryButton`
-   `ResourcePill`
-   `FloatingReward`
-   `ConfirmSheet`

------------------------------------------------------------------------

# 15. ART DIRECTION

Target style:

**stylized cartoon farm + polished mobile game UI**

Reference characteristics from our concept:

-   plump expressive hens;
-   slightly dirty feathers;
-   cream/brown/red palette;
-   warm sunlight;
-   detailed but readable silhouettes;
-   wood and farm materials;
-   not photorealistic;
-   not flat children's vector art;
-   not generic crypto/neon aesthetics.

### Chicken animation set

Every base chicken should eventually support:

``` text
idle
blink
look
peck
lay_egg
happy
upgrade
sleep
```

MVP minimum:

``` text
idle
blink
lay_egg
happy
```

### Idle

Idle loop should be subtle:

-   chest/body scales/moves slightly for breathing;
-   blink timing is irregular;
-   tiny head movement;
-   occasional look left/right.

Avoid synchronized robotic loops.

------------------------------------------------------------------------

# 16. AUDIO / HAPTICS

MVP audio:

-   egg collect;
-   Coin reward;
-   sell;
-   upgrade;
-   rare reward;
-   subtle chicken cluck.

Respect user settings.

Telegram/mobile haptic feedback can be used carefully for:

-   successful collect;
-   upgrade;
-   rare reward.

Do not vibrate on every trivial animation.

------------------------------------------------------------------------

# 17. RETENTION LOOP

The intended daily loop:

``` text
Open Telegram
    ↓
See accumulated farm production
    ↓
Collect eggs
    ↓
Sell some/all eggs
    ↓
Upgrade/buy chicken
    ↓
Check daily objective
    ↓
Optional 30–90 sec Active Farm session
    ↓
Progress toward next farm/chicken unlock
    ↓
Return later when production accumulates
```

The user should have a meaningful action available within \~5 seconds of
opening the app.

------------------------------------------------------------------------

# 18. NOTIFICATIONS

Use conservatively.

Potential notifications:

-   egg storage is full;
-   offline production cap reached;
-   daily reward available;
-   event started;
-   upgrade became affordable only if this can be calculated
    meaningfully.

Do not spam users every hour.

Allow notification preferences where applicable.

------------------------------------------------------------------------

# 19. MVP SCOPE

The MVP is NOT:

-   a blockchain project;
-   an exchange;
-   a real investment service;
-   a cash withdrawal product;
-   a huge multiplayer economy;
-   a marketplace between players;
-   50 chicken types;
-   a complex clan system.

MVP must prove that the loop is enjoyable.

Required MVP:

1.  Telegram authentication.
2.  User account.
3.  Home/Farm screen.
4.  Starter chicken.
5.  Idle egg production.
6.  Offline collection.
7.  Egg storage.
8.  Sell eggs for Coins.
9.  Chicken purchase.
10. Chicken upgrades.
11. Active Farm tab.
12. Energy.
13. Basic falling-egg interaction.
14. Daily reward.
15. Simple tasks.
16. Referral tracking.
17. Basic leaderboard.
18. Sound/haptic settings.
19. Server-authoritative economy.
20. Basic anti-cheat/rate limiting.

------------------------------------------------------------------------

# 20. DEVELOPMENT ROADMAP

## PHASE 0 --- Repository foundation

Goal: every developer and AI agent can work without stepping on each
other.

Tasks:

-   initialize private Git repository;
-   establish monorepo/workspace;
-   configure TypeScript;
-   configure lint/format;
-   add `.env.example`;
-   configure local PostgreSQL;
-   optionally configure Redis;
-   create README with local start commands;
-   define branch/PR workflow;
-   establish shared DTO/types strategy;
-   create base CI for lint/typecheck/build.

Definition of done:

-   clean clone can be started from documented commands;
-   frontend and backend run locally;
-   no secrets committed;
-   CI passes.

------------------------------------------------------------------------

## PHASE 1 --- Telegram shell

Goal: open a real Mini App with authenticated user.

Backend:

-   Telegram initData validation;
-   create/find user;
-   session/auth strategy;
-   `/me`.

Frontend:

-   Telegram environment initialization;
-   safe-area handling;
-   loading screen;
-   authenticated app shell;
-   bottom navigation;
-   header.

Do not build economy before authentication is trustworthy.

------------------------------------------------------------------------

## PHASE 2 --- Static visual prototype

Goal: validate UX before complex backend logic.

Implement all five tabs with mock data:

1.  Home
2.  Active Farm
3.  Chickens
4.  Market
5.  More

Build:

-   design tokens;
-   typography;
-   buttons;
-   cards;
-   navigation;
-   chicken stage;
-   balances;
-   modals/sheets.

Use temporary local/mock values.

No fake API complexity.

Definition of done:

A tester can click through the complete product and understand the loop
without explanation.

------------------------------------------------------------------------

## PHASE 3 --- Core economy

Goal: real persistent progression.

Implement:

-   Coin balance;
-   egg balance;
-   chicken definitions;
-   owned chickens;
-   production rate;
-   offline production;
-   storage capacity;
-   collect;
-   sell;
-   purchase chicken;
-   upgrade chicken;
-   transaction ledger.

Write tests for economy formulas.

Critical economy operations must be atomic.

------------------------------------------------------------------------

## PHASE 4 --- Home/Farm

Goal: make Home the strongest screen.

Implement:

-   farm scene;
-   displayed chickens;
-   idle animations;
-   production status;
-   collect flow;
-   quick sell;
-   farm progress;
-   daily objective preview;
-   animated counters.

Optimize for Telegram mobile viewport.

------------------------------------------------------------------------

## PHASE 5 --- Active Farm

Goal: create a satisfying optional 30--90 second interaction.

Implement:

-   session start;
-   energy;
-   falling eggs;
-   hit/tap detection;
-   normal/golden egg;
-   combo;
-   reward animation;
-   server validation;
-   session completion;
-   anti-spam limits.

Performance target:

-   smooth on typical mid-range phones;
-   avoid excessive DOM nodes;
-   pool/reuse objects if necessary.

------------------------------------------------------------------------

## PHASE 6 --- Chicken collection

Implement:

-   collection grid;
-   owned/locked states;
-   rarity;
-   details;
-   purchase;
-   upgrade;
-   equip/display on farm;
-   animations;
-   unlock feedback.

Start with \~6 chickens, not dozens.

------------------------------------------------------------------------

## PHASE 7 --- Market

Implement:

-   sell eggs;
-   amount selection;
-   transaction confirmation;
-   sell animation;
-   balance animation;
-   simple shop/upgrade offers if needed.

Do not add dynamic speculation mechanics yet.

------------------------------------------------------------------------

## PHASE 8 --- Retention systems

Implement:

-   daily claim;
-   streak;
-   daily tasks;
-   task progress;
-   task rewards;
-   farm progression;
-   player XP/level if retained in final design.

Ensure rewards are idempotent.

------------------------------------------------------------------------

## PHASE 9 --- Referrals

Implement Telegram deep links.

Flow:

``` text
Existing user
→ Share invite link
→ New user opens bot/Mini App
→ Referral attribution stored
→ New user completes activation milestone
→ Referral becomes ACTIVE
→ Inviter reward granted once
```

Protect against:

-   self-referral;
-   duplicate reward;
-   repeated account activation;
-   obvious request replay.

Do not rely only on Telegram username.

Use Telegram user IDs internally.

------------------------------------------------------------------------

## PHASE 10 --- Leaderboard / social proof

Implement:

-   Farm Value or selected progression metric;
-   top players;
-   player's own rank;
-   friends/referrals summary.

Cache expensive leaderboard queries if required.

------------------------------------------------------------------------

## PHASE 11 --- Polish

Implement:

-   animation timing;
-   transitions;
-   sound;
-   haptics;
-   skeleton/loading states;
-   empty states;
-   error handling;
-   offline/network recovery;
-   asset optimization;
-   WebP/AVIF where appropriate;
-   lazy loading;
-   mobile performance profiling.

------------------------------------------------------------------------

## PHASE 12 --- Analytics and balancing

Track events such as:

``` text
app_open
onboarding_complete
offline_collect
egg_sell
chicken_buy
chicken_upgrade
active_farm_start
active_farm_finish
daily_claim
task_claim
referral_share
referral_activated
```

Measure:

-   onboarding completion;
-   D1 retention;
-   D7 retention;
-   sessions/day;
-   average session length;
-   eggs produced/day;
-   Coins created/day;
-   Coins spent/day;
-   most purchased chicken;
-   upgrade bottlenecks;
-   active farm usage;
-   referral conversion.

Do not rebalance blindly. Use data.

------------------------------------------------------------------------

# 21. INITIAL UI FLOW

``` text
Telegram
   ↓
Loading / Auth
   ↓
Onboarding (first launch only)
   ↓
HOME
   ├── Collect production
   ├── Quick sell
   ├── Upgrade suggestion
   └── Daily objective
   ↓
ACTIVE FARM
   └── Falling egg mini-session
   ↓
CHICKENS
   ├── Collection
   ├── Buy
   └── Upgrade
   ↓
MARKET
   └── Eggs → Coins
   ↓
MORE
   ├── Daily
   ├── Tasks
   ├── Referrals
   ├── Leaderboard
   └── Settings
```

------------------------------------------------------------------------

# 22. HOME SCREEN WIREFRAME

Concept only; adapt to real device sizes.

``` text
┌────────────────────────────────┐
│ Ruslan Lv.7       🪙 12 458    │
│                    🥚 428/1000 │
├────────────────────────────────┤
│                                │
│          FARM SCENE            │
│                                │
│       🐔        🐔             │
│             🥚                 │
│                                │
│     warm animated farm         │
│                                │
├────────────────────────────────┤
│ Produced while away            │
│ 🥚 284              [COLLECT]  │
├────────────────────────────────┤
│ Daily objective                │
│ Sell 300 eggs       184 / 300  │
│ █████████░░░                   │
├────────────────────────────────┤
│ 🏠       🥚      🐔     🛒    ☰ │
│ Home     Farm  Chickens Market │
└────────────────────────────────┘
```

------------------------------------------------------------------------

# 23. ACTIVE FARM WIREFRAME

``` text
┌────────────────────────────────┐
│ 🥚 512            ⚡ 850/1000  │
├────────────────────────────────┤
│          🥚                    │
│                   🥚           │
│     🥚                         │
│                         ✨🥚    │
│                                │
│              +1                │
│                                │
│             🐔                 │
│                                │
│            COMBO x3            │
│                                │
├────────────────────────────────┤
│ 🏠       🥚      🐔     🛒    ☰ │
└────────────────────────────────┘
```

------------------------------------------------------------------------

# 24. DESIGN TOKENS

Do not scatter arbitrary colors throughout components.

Create tokens.

Conceptual palette:

``` text
background-dark
surface-dark
surface-wood
cream
warm-white
egg-shell
gold
green-success
red-accent
text-primary
text-secondary
```

Buttons should have consistent:

-   height;
-   radius;
-   pressed state;
-   disabled state;
-   loading state.

Respect Telegram safe areas.

------------------------------------------------------------------------

# 25. PERFORMANCE RULES

Telegram Mini App must remain lightweight.

-   compress image assets;
-   lazy-load non-visible chicken assets;
-   preload only current screen essentials;
-   avoid huge transparent PNGs where WebP/AVIF works;
-   use sprite atlases where useful;
-   avoid rerendering the entire farm on every counter tick;
-   animate transforms/opacity instead of expensive layout properties;
-   cap particles;
-   clean timers/listeners on unmount;
-   do not make one API request per tap;
-   batch/validate Active Farm interactions.

------------------------------------------------------------------------

# 26. ERROR HANDLING

Never leave a player uncertain whether a purchase/reward happened.

For mutations:

-   disable duplicate CTA while request is pending;
-   use idempotency where necessary;
-   update balances from authoritative server response;
-   show recoverable error;
-   avoid optimistic balance mutations for critical economy transactions
    unless reconciliation is robust.

If connection is lost during a sale/upgrade, refetch authoritative
state.

------------------------------------------------------------------------

# 27. TESTING PRIORITIES

Highest priority tests:

### Backend

-   Telegram auth validation;
-   offline production cap;
-   production calculations;
-   egg sale;
-   insufficient egg balance;
-   insufficient Coin balance;
-   chicken purchase;
-   chicken upgrade;
-   duplicate daily claim;
-   duplicate referral reward;
-   idempotent economy mutation;
-   concurrent requests.

### Frontend

-   navigation;
-   balance rendering;
-   loading/error states;
-   purchase/upgrade flows;
-   market amount selection;
-   Active Farm cleanup;
-   Telegram viewport/safe-area behavior.

------------------------------------------------------------------------

# 28. FIRST PLAYABLE TARGET

Do not attempt to finish the entire roadmap before testing.

The first externally testable build should contain:

-   Telegram auth;
-   Home;
-   one animated starter chicken;
-   offline egg production;
-   Collect;
-   Market sell;
-   Coins;
-   one upgrade;
-   Active Farm with falling eggs;
-   basic daily reward.

A user should be able to:

``` text
open → collect → sell → upgrade → actively farm → leave → return later
```

If this loop is not satisfying, improve it before adding referrals, 20
chickens or complex monetization.

------------------------------------------------------------------------

# 29. PRODUCT LANGUAGE

Keep UI copy short.

Good:

-   `Collect`
-   `Sell`
-   `Upgrade`
-   `Your farm produced`
-   `Storage full`
-   `Daily reward`
-   `New chicken unlocked`

Avoid:

-   long explanatory paragraphs;
-   fake financial terminology;
-   promises of profit;
-   fiat equivalents;
-   confusing multiple currencies at launch.

Localization should be supported structurally even if MVP launches with
one language.

Do not hardcode all strings directly inside components.

------------------------------------------------------------------------

# 30. FUTURE IDEAS --- NOT MVP

Keep architecture open enough for these, but do not implement until
requested:

-   seasonal chickens;
-   farm skins;
-   weather;
-   chicken breeding;
-   egg rarity;
-   farm buildings;
-   coops;
-   collections;
-   achievements;
-   leagues;
-   friend farms;
-   limited events;
-   bosses/fox attacks as playful events;
-   mystery eggs;
-   cosmetics;
-   Telegram Stars purchases;
-   season pass;
-   clans/co-ops.

No future feature should be prebuilt speculatively.

------------------------------------------------------------------------

# 31. DEFINITION OF QUALITY

The project should feel like a real product, not a hackathon prototype.

A feature is done when:

-   UX is understandable;
-   mobile layout works;
-   loading/error states exist;
-   backend validation exists where needed;
-   types are correct;
-   no secrets are exposed;
-   no obvious duplicate reward exploit exists;
-   animations do not noticeably degrade performance;
-   lint/typecheck/build pass;
-   code follows current repository conventions.

------------------------------------------------------------------------

# 32. CURRENT PRIORITY ORDER

Unless the human developer gives a different task, prioritize:

1.  Repository architecture.
2.  Telegram auth.
3.  App shell/navigation.
4.  Home visual prototype.
5.  Chicken asset/animation integration.
6.  Core economy.
7.  Offline production.
8.  Market/selling.
9.  Chicken upgrades.
10. Active Farm.
11. Daily/tasks.
12. Referrals.
13. Leaderboard.
14. Polish/analytics.
15. Monetization only after the core loop is validated.

------------------------------------------------------------------------

# 33. RULE FOR EVERY NEW AI SESSION

When receiving a new task, respond internally with this workflow:

``` text
1. Inspect current implementation.
2. Identify files/contracts affected.
3. Check whether another module already solves part of the problem.
4. Implement only the requested scope.
5. Preserve shared contracts or update consumers deliberately.
6. Validate server authority for economy-related changes.
7. Run tests/typecheck/lint/build.
8. Summarize changed files, behavior, tests and any migration/config changes.
```

Never assume this specification overrides a newer explicit instruction
from the human developer.

This document defines the baseline product direction and engineering
rules.
