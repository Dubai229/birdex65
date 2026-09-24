<script setup lang="ts">
// Друзья / рефералы. Награда — только за АКТИВНОГО друга (проверяет сервер).
import { computed, ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useGameStore } from '@/stores/game'
import { api } from '@/services/api'
import { shareInviteLink } from '@/services/telegram'
import type { Friend } from '@/types/game'
import BottomSheet from '@/components/BottomSheet.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { t } from '@/i18n'

// TODO: имя бота подставить, когда будет создан.
const BOT_LINK = 'https://t.me/birdex_bot/app'

const ui = useUiStore()
const game = useGameStore()
const friends = ref<Friend[]>([])
const active = computed(() => friends.value.filter((f) => f.active).length)

watch(
  () => ui.sheet,
  async (s) => {
    if (s === 'friends') friends.value = await api.friends().catch(() => [])
  },
)

function invite() {
  shareInviteLink(`${BOT_LINK}?startapp=ref_${game.profile?.id ?? ''}`, t('friends.inviteText'))
}
</script>

<template>
  <BottomSheet :open="ui.sheet === 'friends'" :title="t('friends.title')" @close="ui.closeSheet()">
    <div class="card stats row">
      <span>🐤 {{ t('friends.count', { n: friends.length }) }}</span>
      <div class="spacer" />
      <span class="muted">{{ t('friends.active', { n: active }) }}</span>
    </div>
    <div v-for="f in friends" :key="f.id" class="card friend row">
      <span class="ava">🧑‍🌾</span>
      <span>{{ f.name }}</span>
      <div class="spacer" />
      <span :class="f.active ? 'ok' : 'muted'">{{ f.active ? t('friends.activeLabel') : t('friends.inactiveLabel') }}</span>
    </div>
    <PrimaryButton variant="gold" @click="invite">📨 {{ t('friends.invite') }}</PrimaryButton>
  </BottomSheet>
</template>

<style scoped>
.stats { padding: 12px; font-weight: 900; }
.friend { padding: 10px 12px; }
.ava { font-size: 22px; }
.ok { color: var(--green-success); }
</style>
