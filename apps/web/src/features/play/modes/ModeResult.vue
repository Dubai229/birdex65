<script setup lang="ts">
import EnergyIcon from '@/components/EnergyIcon.vue'
import type { PlayMode } from '@/economy/modes'
// Итог попытки в режимах Лисы / Бомбы: сколько яиц, "Ещё раз" и "В меню".
import PrimaryButton from '@/components/PrimaryButton.vue'
import EggIcon from '@/components/EggIcon.vue'
import { formatNumber } from '@/economy/format'
import { t } from '@/i18n'

defineProps<{ phase: string; eggs: number; line: string; cost: number; win?: boolean; mode?: PlayMode }>()
defineEmits<{ again: []; back: [] }>()
</script>

<template>
  <div class="overlay">
    <div v-if="phase !== 'result'" class="big">…</div>
    <template v-else>
      <div v-if="win" class="win">🏆 {{ t('modes.win') }}</div>
      <div class="big"><EggIcon :size="34" /> +{{ formatNumber(eggs) }}</div>
      <div class="muted">{{ line }}</div>
      <PrimaryButton variant="gold" @click="$emit('again')">▶ {{ t('play.again') }} · <EnergyIcon :mode="mode" :size="18" />{{ cost }}</PrimaryButton>
      <PrimaryButton variant="wood" @click="$emit('back')">{{ t('modes.toMenu') }}</PrimaryButton>
    </template>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute; inset: 0; z-index: 5; background: rgba(20, 10, 4, 0.66);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 20px; text-align: center;
}
.overlay :deep(.btn) { min-width: 220px; }
.big { display: inline-flex; align-items: center; gap: 8px; font-size: 36px; font-weight: 900; color: var(--gold); text-shadow: 0 3px 0 #6a3a16; }
.win { font-size: 24px; font-weight: 900; color: #fff3c4; animation: glow 1.2s ease-in-out infinite alternate; }
@keyframes glow { to { text-shadow: 0 0 18px rgba(255, 210, 90, 0.95); } }
</style>
