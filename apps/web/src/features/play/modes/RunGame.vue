<script setup lang="ts">
// Chicken Flight: виртуальные яйца -> серверная сессия -> collect/crash решает API.
import { computed, onMounted } from 'vue'
import { useRunGame } from './useRunGame'
import { useGameStore } from '@/stores/game'
import { formatNumber } from '@/economy/format'
import EggIcon from '@/components/EggIcon.vue'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'

const emit = defineEmits<{ back: [] }>()
const game = useGameStore()
const g = useRunGame()

const chickenKey = computed(() => game.displayedChicken?.key ?? game.chickens?.[0]?.key ?? 'farm_hen')
const statusTitle = computed(() => {
  if (g.state.value === 'COLLECTED') return 'SUCCESS!'
  if (g.state.value === 'CRASHED') return 'CRASHED'
  if (g.state.value === 'COLLECTING') return 'COLLECTING...'
  if (g.state.value === 'STARTING') return 'READY...'
  return 'CHICKEN FLIGHT'
})
const net = computed(() => g.settledReward.value - g.settledAmount.value)

function fmtMultiplier(v: number) {
  return `${v.toFixed(2)}x`
}

function back() {
  if (g.state.value === 'FLYING' || g.state.value === 'COLLECTING' || g.state.value === 'STARTING') return
  emit('back')
}

onMounted(g.loadActive)
</script>

<template>
  <div class="screen flight" :class="[`zone-${g.zone.value}`, { flying: g.state.value === 'FLYING', crashed: g.state.value === 'CRASHED' }]">
    <div class="topbar">
      <button class="back" :disabled="g.state.value === 'FLYING' || g.state.value === 'COLLECTING' || g.state.value === 'STARTING'" @click="back">‹</button>
      <div>
        <h1>{{ statusTitle }}</h1>
        <p>Virtual Eggs only</p>
      </div>
      <span class="balance"><EggIcon :size="18" /> {{ formatNumber(g.balance.value) }}</span>
    </div>

    <section class="scene">
      <div class="layer stars" />
      <div class="layer clouds one" />
      <div class="layer clouds two" />
      <div class="moon">◐</div>
      <div class="farm-strip">
        <span>🌾</span><span>🏡</span><span>🌾</span><span>🌳</span><span>🌾</span>
      </div>

      <div class="multiplier" :class="{ hot: g.currentMultiplier.value >= 5, space: g.currentMultiplier.value >= 10 }">
        {{ fmtMultiplier(g.currentMultiplier.value) }}
      </div>
      <div v-if="g.milestone.value" class="milestone">{{ g.milestone.value }}</div>

      <div class="chicken-wrap">
        <div class="flame left" />
        <ChickenAvatar :chicken-key="chickenKey" :size="116" idle />
        <div class="rocket">🚀</div>
        <div class="flame right" />
      </div>

      <div v-if="g.state.value === 'CRASHED'" class="crash-burst">💥</div>
      <div v-if="g.state.value === 'COLLECTED'" class="success-burst">+{{ formatNumber(net) }}</div>
    </section>

    <section v-if="g.state.value === 'IDLE' || g.state.value === 'STARTING'" class="panel setup">
      <div class="label">RUN AMOUNT</div>
      <div class="amount-box">
        <button @click="g.step(-25)">−</button>
        <label>
          <EggIcon :size="22" />
          <input
            :value="g.amount.value"
            inputmode="numeric"
            pattern="[0-9]*"
            aria-label="Run amount"
            @input="g.setCustomAmount(($event.target as HTMLInputElement).value)"
          />
        </label>
        <button @click="g.step(25)">+</button>
      </div>
      <div class="presets">
        <button v-for="p in g.CONFIG.presets" :key="p" :class="{ on: g.amount.value === p }" :disabled="p > g.balance.value" @click="g.setAmount(p)">
          {{ p }}
        </button>
      </div>
      <div class="label collect-label">AUTO COLLECT X</div>
      <div class="x-box">
        <label>
          <input
            :value="g.targetMultiplier.value"
            inputmode="decimal"
            aria-label="Auto collect multiplier"
            @input="g.setTargetMultiplier(($event.target as HTMLInputElement).value)"
          />
          <b>x</b>
        </label>
        <div class="x-presets">
          <button v-for="x in [1.5, 2, 3, 5]" :key="x" :class="{ on: g.targetMultiplier.value === x }" @click="g.setTargetMultiplier(x)">
            {{ x }}x
          </button>
        </div>
      </div>
      <div class="returns">
        <span>{{ g.targetMultiplier.value.toFixed(2) }}x → {{ formatNumber(Math.floor(g.amount.value * g.targetMultiplier.value)) }}</span>
        <span>5x → {{ formatNumber(g.amount.value * 5) }}</span>
        <span>10x → {{ formatNumber(g.amount.value * 10) }}</span>
      </div>
      <PrimaryButton :disabled="!g.canLaunch.value || g.state.value === 'STARTING'" @click="g.launch">
        ▶ PLAY · 🚀 LAUNCH
      </PrimaryButton>
      <p v-if="g.amount.value > g.balance.value" class="blocked">
        Need at least {{ formatNumber(g.amount.value) }} eggs to launch.
      </p>
      <p v-else-if="g.balance.value < g.CONFIG.minAmount" class="blocked">
        Need at least {{ formatNumber(g.CONFIG.minAmount) }} eggs to play.
      </p>
    </section>

    <section v-else-if="g.state.value === 'FLYING' || g.state.value === 'COLLECTING'" class="panel active">
      <div class="run-stats">
        <span>RUN <b><EggIcon :size="16" /> {{ formatNumber(g.amount.value) }}</b></span>
        <span>CURRENT <b><EggIcon :size="16" /> {{ formatNumber(g.currentReward.value) }}</b></span>
      </div>
      <PrimaryButton :disabled="g.state.value === 'COLLECTING'" @click="g.collect">
        COLLECT {{ formatNumber(g.currentReward.value) }} 🥚
      </PrimaryButton>
    </section>

    <section v-else class="panel result">
      <h2>{{ g.state.value === 'COLLECTED' ? 'SUCCESS!' : 'CRASHED' }}</h2>
      <div class="result-line">{{ fmtMultiplier(g.settledMultiplier.value) }}</div>
      <p v-if="g.state.value === 'COLLECTED'">
        🥚 {{ formatNumber(g.settledAmount.value) }} → 🥚 {{ formatNumber(g.settledReward.value) }}
      </p>
      <p v-else>Run: -{{ formatNumber(g.settledAmount.value) }} 🥚</p>
      <strong v-if="g.state.value === 'COLLECTED'" class="profit">+{{ formatNumber(net) }} Eggs</strong>
      <PrimaryButton @click="g.playAgain">{{ g.state.value === 'COLLECTED' ? 'PLAY AGAIN' : 'TRY AGAIN' }}</PrimaryButton>
    </section>

    <section v-if="g.state.value === 'IDLE' && g.history.value.length" class="history">
      <span>RECENT FLIGHTS</span>
      <b v-for="h in g.history.value" :key="h.id" :class="{ lost: h.status === 'CRASHED' }">
        {{ fmtMultiplier(h.multiplier) }}
      </b>
    </section>
  </div>
</template>

<style scoped>
.flight {
  position: relative; z-index: 1; flex: 1; min-height: 0; gap: 8px;
  padding-bottom: calc(var(--nav-height) + var(--safe-bottom) + 14px); overflow: visible;
}
.topbar {
  display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 14px;
  background: rgba(34, 22, 12, 0.78); border: 1px solid rgba(255, 221, 150, 0.18);
}
.back {
  width: 34px; height: 34px; border-radius: 10px; color: var(--gold); font-size: 28px; line-height: 1;
  background: rgba(0, 0, 0, 0.28); border: 1px solid rgba(255, 220, 150, 0.18);
}
.back:disabled { opacity: 0.35; }
h1, h2, p { margin: 0; }
h1 { font-size: 18px; font-weight: 900; color: var(--warm-white); }
.topbar p { font-size: 11px; color: var(--text-secondary); }
.balance { display: inline-flex; align-items: center; gap: 4px; font-weight: 900; color: var(--gold); }
.scene {
  position: relative; flex: 0 0 clamp(250px, 42vh, 342px); min-height: 250px; overflow: hidden; border-radius: 18px;
  border: 1px solid rgba(255, 228, 170, 0.2);
  background:
    linear-gradient(180deg, #75cef7 0%, #bdeeff 42%, #88d374 76%, #5da241 100%);
  box-shadow: inset 0 0 46px rgba(0, 0, 0, 0.25);
}
.zone-sky .scene { background: linear-gradient(180deg, #4aa6f3 0%, #bdeeff 80%); }
.zone-clouds .scene { background: linear-gradient(180deg, #328de8 0%, #d9f7ff 100%); }
.zone-space .scene, .zone-moon .scene, .zone-deep .scene {
  background: radial-gradient(circle at 70% 18%, rgba(145, 190, 255, 0.28), transparent 18%), linear-gradient(180deg, #11163c 0%, #050817 100%);
}
.layer { position: absolute; inset: -40% 0 0; pointer-events: none; }
.stars {
  opacity: 0; background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 28px 28px;
  animation: drift 5s linear infinite;
}
.zone-space .stars, .zone-moon .stars, .zone-deep .stars { opacity: 0.75; }
.clouds::before, .clouds::after {
  content: ''; position: absolute; width: 108px; height: 34px; border-radius: 999px;
  background: rgba(255, 255, 255, 0.72); filter: blur(0.2px); box-shadow: 38px 10px 0 rgba(255, 255, 255, 0.52), -26px 14px 0 rgba(255, 255, 255, 0.4);
}
.clouds.one { animation: drift 7s linear infinite; }
.clouds.two { animation: drift 10s linear infinite reverse; opacity: 0.72; }
.clouds.one::before { left: 8%; top: 42%; }
.clouds.one::after { right: 2%; top: 58%; }
.clouds.two::before { left: 44%; top: 28%; }
.clouds.two::after { left: 20%; top: 74%; }
.moon {
  position: absolute; right: 24px; top: 28px; opacity: 0; font-size: 60px; color: #fff3a8;
  text-shadow: 0 0 28px rgba(255, 242, 160, 0.55);
}
.zone-moon .moon, .zone-deep .moon { opacity: 1; }
.farm-strip {
  position: absolute; left: 0; right: 0; bottom: 0; height: 62px; display: flex; align-items: flex-end; justify-content: space-around;
  font-size: 32px; background: linear-gradient(180deg, transparent, rgba(37, 93, 31, 0.72));
  transition: transform 0.6s, opacity 0.6s;
}
.flying .farm-strip { animation: farm-drop 3.2s ease-in forwards; }
.zone-clouds .farm-strip, .zone-space .farm-strip, .zone-moon .farm-strip, .zone-deep .farm-strip { opacity: 0; transform: translateY(110%); }
.multiplier {
  position: absolute; left: 50%; top: 42px; transform: translateX(-50%);
  font-size: clamp(42px, 15vw, 72px); font-weight: 1000; line-height: 1; color: #fff6cf;
  text-shadow: 0 4px 0 rgba(92, 50, 20, 0.8), 0 0 24px rgba(255, 206, 82, 0.4);
  font-variant-numeric: tabular-nums;
}
.multiplier.hot { color: #ffe371; transform: translateX(-50%) scale(1.05); }
.multiplier.space { text-shadow: 0 0 24px rgba(102, 196, 255, 0.85), 0 4px 0 rgba(0, 0, 0, 0.7); }
.milestone {
  position: absolute; left: 50%; top: 112px; transform: translateX(-50%); z-index: 4;
  padding: 6px 14px; border-radius: 999px; font-weight: 1000; color: #3a2108;
  background: linear-gradient(180deg, #fff4a6, var(--gold)); box-shadow: 0 4px 0 var(--gold-dark);
  animation: milestone 0.9s ease both;
}
.chicken-wrap {
  position: absolute; left: 50%; top: 52%; width: 142px; height: 142px; transform: translate(-50%, -50%);
  display: grid; place-items: center; animation: hover 0.85s ease-in-out infinite alternate;
}
.rocket { position: absolute; right: 4px; bottom: 24px; font-size: 30px; transform: rotate(-18deg); filter: drop-shadow(0 4px 2px rgba(0, 0, 0, 0.35)); }
.flame {
  position: absolute; bottom: 4px; width: 20px; height: 34px; border-radius: 999px 999px 45% 45%;
  background: linear-gradient(180deg, #fff389, #ff8f28 55%, rgba(255, 45, 20, 0));
  filter: blur(0.2px); opacity: 0; transform-origin: top center;
}
.flying .flame { opacity: 0.9; animation: flame 0.18s ease-in-out infinite alternate; }
.flame.left { left: 34px; transform: rotate(16deg); }
.flame.right { right: 24px; transform: rotate(-16deg); }
.crash-burst, .success-burst {
  position: absolute; left: 50%; top: 48%; transform: translate(-50%, -50%); z-index: 6;
  font-size: 78px; font-weight: 1000; animation: burst 0.55s ease both;
}
.success-burst { color: #b9ff77; font-size: 42px; text-shadow: 0 4px 0 #215d16, 0 0 24px rgba(126, 255, 93, 0.6); }
.panel {
  padding: 12px; border-radius: 16px; background: linear-gradient(180deg, rgba(48, 31, 16, 0.94), rgba(22, 14, 8, 0.95));
  border: 2px solid rgba(138, 93, 54, 0.86); box-shadow: 0 4px 0 rgba(0, 0, 0, 0.35);
}
.label { text-align: center; font-size: 12px; font-weight: 900; color: var(--text-secondary); }
.amount-box { display: grid; grid-template-columns: 48px 1fr 48px; gap: 8px; align-items: center; margin: 8px 0; }
.amount-box button {
  height: 44px; border-radius: 12px; color: var(--gold); font-size: 24px; font-weight: 900;
  background: rgba(0, 0, 0, 0.28); border: 1px solid rgba(255, 220, 150, 0.2);
}
.amount-box label, .x-box label {
  min-height: 48px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border-radius: 12px; color: var(--warm-white); font-size: 26px; font-weight: 1000; background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 220, 150, 0.14); padding: 0 10px;
}
.amount-box input, .x-box input {
  width: 100%; min-width: 0; border: 0; outline: 0; text-align: center;
  color: var(--warm-white); background: transparent; font: inherit; font-size: 25px; font-weight: 1000;
}
.amount-box input { max-width: 130px; }
.x-box { display: grid; grid-template-columns: 112px 1fr; gap: 8px; align-items: center; margin-top: 7px; }
.x-box label { min-height: 40px; font-size: 21px; padding: 0 8px; }
.x-box input { font-size: 21px; }
.x-box b { color: var(--gold); font-size: 18px; }
.collect-label { margin-top: 10px; }
.x-presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
.x-presets button {
  min-height: 40px; border-radius: 10px; color: var(--cream); font-weight: 900;
  background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 220, 150, 0.18);
}
.x-presets button.on { color: #3a2108; background: linear-gradient(180deg, #ffe17a, var(--gold)); }
.amount-box input::-webkit-outer-spin-button, .amount-box input::-webkit-inner-spin-button,
.x-box input::-webkit-outer-spin-button, .x-box input::-webkit-inner-spin-button {
  -webkit-appearance: none; margin: 0;
}
.presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
.presets button {
  min-height: 34px; border-radius: 10px; color: var(--cream); font-weight: 900;
  background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 220, 150, 0.18);
}
.presets button.on { color: #3a2108; background: linear-gradient(180deg, #ffe17a, var(--gold)); }
.returns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin: 10px 0; }
.returns span {
  padding: 6px 4px; border-radius: 10px; text-align: center; font-size: 12px; font-weight: 900;
  color: var(--gold); background: rgba(0, 0, 0, 0.24);
}
.blocked {
  margin-top: 8px; text-align: center; color: #ffb09d; font-size: 12px; font-weight: 800;
}
.active { display: grid; gap: 10px; }
.run-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.run-stats span {
  display: flex; flex-direction: column; gap: 3px; padding: 8px; border-radius: 12px;
  color: var(--text-secondary); font-size: 11px; font-weight: 900; background: rgba(0, 0, 0, 0.24);
}
.run-stats b { display: inline-flex; align-items: center; justify-content: center; gap: 4px; color: var(--warm-white); font-size: 17px; }
.result { display: grid; gap: 8px; text-align: center; }
.result h2 { color: var(--gold); font-size: 24px; }
.result-line { color: var(--warm-white); font-size: 42px; font-weight: 1000; line-height: 1; }
.profit { color: #a8ff69; font-size: 19px; }
.history {
  display: flex; align-items: center; gap: 6px; overflow-x: auto; padding: 6px 2px; scrollbar-width: none;
}
.history span { flex: 0 0 auto; color: var(--text-secondary); font-size: 11px; font-weight: 900; }
.history b {
  flex: 0 0 auto; padding: 5px 8px; border-radius: 999px; color: #b9ff77; background: rgba(0, 0, 0, 0.32);
  border: 1px solid rgba(185, 255, 119, 0.2); font-size: 12px;
}
.history b.lost { color: #ff8b78; border-color: rgba(255, 139, 120, 0.24); }
@keyframes drift { to { transform: translateY(32%); } }
@keyframes farm-drop { to { transform: translateY(110%); opacity: 0; } }
@keyframes hover { to { transform: translate(-50%, -55%) rotate(2deg); } }
@keyframes flame { to { height: 44px; filter: blur(1px); } }
@keyframes milestone {
  0% { opacity: 0; transform: translate(-50%, 10px) scale(0.7); }
  20%, 75% { opacity: 1; transform: translate(-50%, 0) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -10px) scale(1.08); }
}
@keyframes burst {
  0% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
  65% { opacity: 1; transform: translate(-50%, -50%) scale(1.18); }
  100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}
@media (max-height: 690px) {
  .scene { flex-basis: 238px; min-height: 238px; }
  .chicken-wrap { transform: translate(-50%, -42%) scale(0.88); }
  .multiplier { top: 30px; }
}
@media (prefers-reduced-motion: reduce) {
  .stars, .clouds, .farm-strip, .chicken-wrap, .flame, .milestone, .crash-burst, .success-burst { animation: none; }
}
</style>
