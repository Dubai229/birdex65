<script setup lang="ts">
// Друзья = игроки, пришедшие по твоей ссылке (startapp=ref_<твой Telegram ID>).
// С каждой продажи яиц друга тебе идёт 12% монет — копится на сервере, забираешь кнопкой.
import { computed, ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useGameStore } from '@/stores/game'
import { api } from '@/services/api'
import { shareInviteLink } from '@/services/telegram'
import { TELEGRAM_APP_LINK } from '@/config/telegram'
import { ECONOMY } from '@/config/economy'
import type { Friend } from '@/types/game'
import { formatCompact, formatNumber } from '@/economy/format'
import BottomSheet from '@/components/BottomSheet.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import PlayerAvatar from '@/components/PlayerAvatar.vue'
import CoinIcon from '@/components/CoinIcon.vue'
import { t } from '@/i18n'

const ui = useUiStore()
const game = useGameStore()
const friends = ref<Friend[]>([])
const pending = ref(0)
const total = ref(0)
const online = ref(true)
const loading = ref(false)
const active = computed(() => friends.value.filter((f) => f.active).length)

const myId = computed(() => game.profile?.id ?? '')
const inviteLink = computed(() => `${TELEGRAM_APP_LINK}?startapp=ref_${myId.value}`)

async function load() {
  loading.value = true
  try {
    const res = await api.friends()
    friends.value = res.friends
    pending.value = res.pending
    total.value = res.total
    online.value = res.online
  } catch {
    friends.value = []
  }
  loading.value = false
}

watch(
  () => ui.sheet,
  (s) => {
    if (s === 'friends') load()
  },
)

async function claim() {
  const coins = await game.claimReferral()
  if (coins > 0) ui.toast(t('friends.claimed', { n: formatNumber(coins) }), 'success')
  pending.value = 0
  load()
}

function invite() {
  shareInviteLink(inviteLink.value, t('friends.inviteText'))
}

async function copy() {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    ui.toast(t('friends.copied'), 'success')
  } catch {
    ui.toast(inviteLink.value)
  }
}
</script>

<template>
  <BottomSheet :open="ui.sheet === 'friends'" :title="t('friends.title')" @close="ui.closeSheet()">
    <div v-if="!online" class="muted center">{{ t('friends.offline') }}</div>
    <template v-else>
      <div class="card stats row">
        <span>🐤 {{ t('friends.count', { n: friends.length }) }}</span>
        <div class="spacer" />
        <span class="muted">{{ t('friends.active', { n: active }) }}</span>
      </div>

      <div class="card bonus">
        <div class="muted small">{{ t('friends.share', { p: ECONOMY.referralPercent }) }}</div>
        <div class="row">
          <div>
            <div class="muted small">{{ t('friends.pending') }}</div>
            <div class="pend"><CoinIcon :size="24" /> {{ formatNumber(pending) }}</div>
          </div>
          <div class="spacer" />
          <PrimaryButton small variant="green" :disabled="pending <= 0 || game.pending === 'ref'" @click="claim">
            {{ t('friends.claim') }}
          </PrimaryButton>
        </div>
        <div class="muted tiny">{{ t('friends.total', { n: formatNumber(total) }) }}</div>
      </div>

      <div class="card code">
        <div class="muted small">{{ t('friends.yourId') }}</div>
        <div class="row">
          <code class="id">{{ myId }}</code>
          <div class="spacer" />
          <button class="copy" @click="copy">📋 {{ t('friends.copyLink') }}</button>
        </div>
      </div>

      <div v-if="loading && friends.length === 0" class="muted center">…</div>
      <div v-else-if="friends.length === 0" class="muted center">{{ t('friends.empty') }}</div>
      <div v-for="f in friends" :key="f.id" class="card friend row">
        <PlayerAvatar :chicken-key="f.avatar" :size="42" />
        <div class="who">
          <div class="name">{{ f.name }}</div>
          <div class="muted tiny farm">{{ f.farmName || '—' }} · {{ t('header.level', { n: f.level ?? 1 }) }}</div>
          <div class="tiny" :class="f.active ? 'ok' : 'muted'">
            {{ f.active ? t('friends.activeLabel') : t('friends.inactiveLabel') }}
            <template v-if="f.earned"> · {{ t('friends.brought', { n: formatCompact(f.earned) }) }}</template>
          </div>
        </div>
        <div class="spacer" />
        <span class="coins"><CoinIcon :size="18" /> {{ formatCompact(f.coins ?? 0) }}</span>
      </div>

      <PrimaryButton variant="gold" @click="invite">📨 {{ t('friends.invite') }}</PrimaryButton>
    </template>
  </BottomSheet>
</template>

<style scoped>
.center { text-align: center; padding: 14px; }
.small { font-size: 12px; }
.tiny { font-size: 11px; }
.stats { padding: 12px; font-weight: 900; }
.bonus { padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; border-color: var(--gold-dark); }
.pend { font-size: 22px; font-weight: 900; display: inline-flex; align-items: center; gap: 6px; color: var(--gold); }
.code { padding: 10px 12px; display: flex; flex-direction: column; gap: 4px; }
.id { font-size: 16px; font-weight: 900; color: var(--gold); letter-spacing: 0.04em; }
.copy { padding: 6px 10px; border-radius: var(--radius-sm); background: var(--surface-wood); font-size: 13px; font-weight: 800; }
.friend { padding: 8px 10px; gap: 10px; }
.who { min-width: 0; }
.name { font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.farm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.coins { font-weight: 900; white-space: nowrap; display: inline-flex; align-items: center; gap: 4px; }
.ok { color: var(--green-success); }
</style>
