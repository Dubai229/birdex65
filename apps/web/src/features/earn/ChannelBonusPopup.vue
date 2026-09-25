<script setup lang="ts">
// Окно "Спасибо за подписку!" — всплывает, когда игрок вернулся из канала и подписка подтвердилась.
import PrimaryButton from '@/components/PrimaryButton.vue'
import CoinIcon from '@/components/CoinIcon.vue'
import { formatNumber } from '@/economy/format'
import { t } from '@/i18n'

defineProps<{ coins: number; loading: boolean }>()
defineEmits<{ claim: []; close: [] }>()
</script>

<template>
  <div class="backdrop" @click.self="$emit('close')">
    <div class="frame">
      <div class="rays" />
      <button class="x" aria-label="close" @click="$emit('close')">✕</button>
      <div class="title">{{ t('earn.popupTitle') }}</div>
      <div class="muted text">{{ t('earn.popupText') }}</div>
      <div class="prize"><CoinIcon :size="54" class="coin" /> {{ formatNumber(coins) }}</div>
      <PrimaryButton variant="gold" :loading="loading" @click="$emit('claim')">{{ t('earn.popupClaim') }}</PrimaryButton>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 24px;
  background: rgba(10, 5, 2, 0.7); animation: fade 0.2s ease;
}
.frame {
  position: relative; width: 100%; max-width: 320px; padding: 26px 18px 18px; border-radius: 22px; overflow: hidden;
  display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center;
  background: linear-gradient(180deg, #5a3a22, #2a1a0d);
  border: 3px solid var(--gold);
  box-shadow: 0 0 0 3px #6a3a16, 0 0 40px rgba(245, 184, 46, 0.55), inset 0 2px 0 rgba(255, 230, 160, 0.35);
  animation: pop 0.35s cubic-bezier(0.3, 1.4, 0.5, 1);
}
.frame :deep(.btn) { width: 100%; }
.rays {
  position: absolute; left: 50%; top: 42%; width: 420px; height: 420px; margin: -210px 0 0 -210px; pointer-events: none;
  background: repeating-conic-gradient(rgba(255, 210, 90, 0.16) 0 10deg, transparent 10deg 20deg);
  animation: spin 14s linear infinite;
}
.x { position: absolute; top: 8px; right: 10px; z-index: 1; font-size: 16px; opacity: 0.7; }
.title { position: relative; font-size: 22px; font-weight: 900; color: var(--warm-white); text-shadow: 0 2px 0 #6a3a16; }
.text { position: relative; font-size: 13px; }
.prize {
  position: relative; display: inline-flex; align-items: center; gap: 8px; margin: 6px 0;
  font-size: 44px; font-weight: 900; color: var(--gold); text-shadow: 0 3px 0 #6a3a16;
}
.coin { filter: drop-shadow(0 0 14px rgba(245, 184, 46, 0.8)); animation: bob 1.6s ease-in-out infinite; }
@keyframes fade { from { opacity: 0; } }
@keyframes pop { from { transform: scale(0.6); opacity: 0; } }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
