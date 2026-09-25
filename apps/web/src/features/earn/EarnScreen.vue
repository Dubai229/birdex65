<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import FarmBackdrop from '@/components/FarmBackdrop.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import EggIcon from '@/components/EggIcon.vue'
import DailyRewardTile from '@/components/DailyRewardTile.vue'
import PromoCode from '@/features/settings/PromoCode.vue'
import { TELEGRAM_CHANNEL_LINK } from '@/config/telegram'
import { openTgLink } from '@/services/telegram'
import { formatNumber } from '@/economy/format'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import ChannelBonusPopup from './ChannelBonusPopup.vue'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()

const subscribed = computed(() => !!game.state?.events.channelSubscribed)
const claimed = computed(() => !!game.state?.events.channelBonusClaimed)

// Нажал "Подписаться" → ушёл в канал → вернулся в игру: сами проверяем подписку
// и показываем окно с наградой. Флаг в sessionStorage — на случай, если Telegram перезагрузит игру.
const WAIT_KEY = 'birdex_channel_wait'
const popup = ref(false)

function setWaiting(v: boolean) {
  try {
    if (v) sessionStorage.setItem(WAIT_KEY, '1')
    else sessionStorage.removeItem(WAIT_KEY)
  } catch {
    /* хранилище недоступно — просто без флага */
  }
}
function isWaiting(): boolean {
  try {
    return sessionStorage.getItem(WAIT_KEY) === '1'
  } catch {
    return false
  }
}

function subscribe() {
  if (!claimed.value) setWaiting(true)
  openTgLink(TELEGRAM_CHANNEL_LINK)
}

async function autoCheck() {
  if (document.visibilityState !== 'visible' || !isWaiting() || claimed.value) return
  setWaiting(false)
  const ok = await game.verifyChannelSubscription()
  if (ok && !claimed.value) popup.value = true
}

async function claimFromPopup() {
  await claim()
  popup.value = false
}

onMounted(() => {
  document.addEventListener('visibilitychange', autoCheck)
  window.addEventListener('focus', autoCheck)
  autoCheck()
})
onUnmounted(() => {
  document.removeEventListener('visibilitychange', autoCheck)
  window.removeEventListener('focus', autoCheck)
})

async function check() {
  const ok = await game.verifyChannelSubscription()
  if (ok) ui.toast(t('earn.subscribed'), 'success')
}

async function claim() {
  const coins = await game.claimChannelBonus()
  if (coins > 0) ui.toast(t('earn.claimed', { n: formatNumber(coins) }), 'success')
}
</script>

<template>
  <FarmBackdrop />
  <div class="screen earn">
    <h1 class="screen-title">💎 {{ t('earn.title') }}</h1>

    <div class="list">
      <div class="card task-row reward-row">
        <DailyRewardTile @open="ui.openSheet('reward')" />
        <div class="copy">
          <h2>{{ t('reward.title') }}</h2>
          <p class="muted">{{ t('earn.dailyText') }}</p>
        </div>
      </div>

      <div class="card task-row">
        <div class="task-icon"><EggIcon :size="34" golden /></div>
        <div class="copy">
          <h2>{{ t('earn.channelTitle') }}</h2>
          <p class="muted">{{ t('earn.channelText') }}</p>
        </div>
        <div class="actions">
          <PrimaryButton small variant="gold" @click="subscribe">{{ t('earn.subscribe') }}</PrimaryButton>
          <PrimaryButton v-if="!subscribed" small :loading="game.pending === 'channel-check'" @click="check">
            {{ t('earn.check') }}
          </PrimaryButton>
          <PrimaryButton v-else small :disabled="claimed" :loading="game.pending === 'channel-bonus'" @click="claim">
            {{ claimed ? t('earn.alreadyClaimed') : t('earn.claimBonus') }}
          </PrimaryButton>
        </div>
      </div>
    </div>

    <ChannelBonusPopup
      v-if="popup"
      :coins="1000"
      :loading="game.pending === 'channel-bonus'"
      @claim="claimFromPopup"
      @close="popup = false"
    />

    <div class="promo-dock">
      <PromoCode />
    </div>
  </div>
</template>

<style scoped>
.earn { position: relative; z-index: 1; padding-bottom: 112px; }
.list { display: flex; flex-direction: column; gap: 8px; }
.task-row { min-height: 74px; padding: 8px; display: grid; grid-template-columns: 44px minmax(0, 1fr) 82px; gap: 8px; align-items: center; }
.reward-row { grid-template-columns: 86px minmax(0, 1fr); }
.task-icon { width: 40px; height: 40px; display: grid; place-items: center; border-radius: 50%; background: rgba(0, 0, 0, 0.35); box-shadow: 0 0 12px rgba(245, 184, 46, 0.35); }
.copy { min-width: 0; }
h2 { margin: 0 0 4px; font-size: 14px; line-height: 1.1; }
p { margin: 0; font-size: 11px; line-height: 1.2; }
.actions { display: grid; gap: 6px; }
.actions :deep(.btn) { height: 30px; padding: 0 6px; font-size: 11px; border-radius: 7px; }
.promo-dock {
  position: fixed; left: 12px; right: 12px; bottom: calc(72px + var(--safe-bottom)); z-index: 12;
  max-width: calc(var(--app-width) - 24px); margin: 0 auto;
}
.promo-dock :deep(.promo) { margin: 0; box-shadow: var(--shadow-card); }
</style>
