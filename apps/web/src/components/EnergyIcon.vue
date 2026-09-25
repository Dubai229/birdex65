<script setup lang="ts">
// Значок энергии режима Play: ⚡ цвета режима (оранжевый, красный, зелёный).
import type { PlayMode } from '@/economy/modes'

withDefaults(defineProps<{ mode?: PlayMode; size?: number; color?: string }>(), {
  mode: 'catch',
  size: 18,
  color: 'var(--gold)',
})
</script>

<template>
  <span class="energy-icon" :style="{ width: size + 'px', height: size + 'px' }">
    <span class="bolt" :style="{ fontSize: size * 0.9 + 'px', color, textShadow: `0 0 6px ${color}` }">⚡</span>
  </span>
</template>

<style scoped>
.energy-icon { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; vertical-align: middle; line-height: 1; }
</style>
