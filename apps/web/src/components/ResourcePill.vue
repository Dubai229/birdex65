<script setup lang="ts">
import { formatNumber } from '@/economy/format'

defineProps<{ icon: string; value: number; max?: number; plus?: boolean }>()
defineEmits<{ plus: [] }>()
</script>

<template>
  <div class="pill">
    <span class="icon">{{ icon }}</span>
    <span class="value">
      {{ formatNumber(value) }}<span v-if="max !== undefined" class="max"> / {{ formatNumber(max) }}</span>
    </span>
    <button v-if="plus" class="plus" @click="$emit('plus')">+</button>
  </div>
</template>

<style scoped>
.pill {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 6px 4px 4px; border-radius: 999px;
  background: rgba(0, 0, 0, 0.45); border: 2px solid var(--surface-wood);
  min-height: 34px;
}
.icon { font-size: 20px; line-height: 1; }
.value { font-weight: 900; font-size: 16px; white-space: nowrap; }
.max { color: var(--text-secondary); font-size: 13px; }
.plus {
  width: 24px; height: 24px; border-radius: 7px; font-weight: 900;
  background: var(--green-success); box-shadow: 0 2px 0 var(--green-dark);
}
</style>
