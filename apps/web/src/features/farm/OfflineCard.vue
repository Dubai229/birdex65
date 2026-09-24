<script setup lang="ts">
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'
import PrimaryButton from '@/components/PrimaryButton.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { formatNumber } from '@/economy/format'
import { t } from '@/i18n'

const emit = defineEmits<{ collected: [n: number] }>()
const game = useGameStore()

const full = computed(() => {
  const b = game.balance
  return !!b && b.eggs >= b.storageCapacity
})

async function collect() {
  const n = await game.collect()
  if (n > 0) emit('collected', n)
}
</script>

<template>
  <div class="card offline">
    <div class="row">
      <div>
        <div class="muted small">{{ full ? t('farm.storageFull') : t('farm.produced') }}</div>
        <div class="amount">🥚 {{ formatNumber(game.readyToCollect) }}</div>
      </div>
      <div class="spacer" />
      <PrimaryButton
        :disabled="game.readyToCollect <= 0"
        :loading="game.pending === 'collect'"
        @click="collect"
      >
        {{ t('farm.collect') }}
      </PrimaryButton>
    </div>
    <div class="storage">
      <span class="muted small">{{ t('farm.storage') }}</span>
      <ProgressBar
        :value="game.balance?.eggs ?? 0"
        :max="game.balance?.storageCapacity ?? 1"
        :color="full ? 'var(--red-accent)' : 'var(--egg-shell)'"
      />
    </div>
  </div>
</template>

<style scoped>
.offline { padding: 12px 14px; display: flex; flex-direction: column; gap: 10px; }
.small { font-size: 13px; }
.amount { font-size: 26px; font-weight: 900; }
.storage { display: flex; flex-direction: column; gap: 4px; }
</style>
