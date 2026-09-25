<script setup lang="ts">
import { computed } from 'vue'
import FarmBackdrop from '@/components/FarmBackdrop.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import EggIcon from '@/components/EggIcon.vue'
import { formatNumber } from '@/economy/format'
import { TELEGRAM_CHANNEL_LINK } from '@/config/telegram'
import { openTgLink } from '@/services/telegram'
import { useGameStore } from '@/stores/game'
import { useUiStore } from '@/stores/ui'
import { t } from '@/i18n'

const game = useGameStore()
const ui = useUiStore()

const subscribed = computed(() => !!game.state?.events.channelSubscribed)
const claimed = computed(() => !!game.state?.events.channelBonusClaimed)

function subscribe() {
  openTgLink(TELEGRAM_CHANNEL_LINK)
}

async function check() {
  const ok = await game.verifyChannelSubscription()
  if (ok) ui.toast(t('events.subscribed'), 'success')
}

async function claim() {
  const coins = await game.claimChannelBonus()
  if (coins > 0) ui.toast(t('events.claimed', { n: formatNumber(coins) }), 'success')
}
</script>

<template>
  <FarmBackdrop />
  <div class="screen events">
    <h1 class="screen-title">🗺️ {{ t('events.title') }}</h1>
    <div class="events-list">
      <div class="card event-row">
        <div class="event-icon"><EggIcon :size="36" golden /></div>
        <div class="event-copy">
          <h2>{{ t('events.channelTitle') }}</h2>
          <p class="muted">{{ t('events.channelText') }}</p>
        </div>
        <div class="actions">
          <PrimaryButton small variant="gold" @click="subscribe">
            {{ t('events.subscribe') }}
          </PrimaryButton>
          <PrimaryButton v-if="!subscribed" small :loading="game.pending === 'channel-check'" @click="check">
            {{ t('events.check') }}
          </PrimaryButton>
          <PrimaryButton
            v-else
            small
            :disabled="claimed"
            :loading="game.pending === 'channel-bonus'"
            @click="claim"
          >
            {{ claimed ? t('events.alreadyClaimed') : t('events.claimBonus') }}
          </PrimaryButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.events { position: relative; z-index: 1; }
.events-list { display: flex; flex-direction: column; gap: 8px; }
.event-row { min-height: 74px; padding: 8px; display: grid; grid-template-columns: 38px minmax(0, 1fr) 78px; gap: 8px; align-items: center; }
.event-icon {
  width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%;
  background:
    radial-gradient(circle at 38% 30%, rgba(255, 248, 202, 0.9), rgba(245, 184, 46, 0.45) 42%, rgba(0, 0, 0, 0.28) 72%),
    rgba(0, 0, 0, 0.35);
  box-shadow: inset 0 0 0 1px rgba(255, 222, 112, 0.35), 0 0 14px rgba(245, 184, 46, 0.42);
}
.event-copy { min-width: 0; }
h2 { margin: 0 0 4px; font-size: 14px; line-height: 1.1; }
p { margin: 0; font-size: 11px; line-height: 1.2; }
.actions { display: grid; grid-template-columns: 1fr; gap: 6px; }
.actions :deep(.btn) { width: 100%; min-width: 0; height: 30px; padding: 0 6px; font-size: 11px; border-radius: 7px; }
</style>
