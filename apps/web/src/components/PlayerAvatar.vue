<script setup lang="ts">
// Аватарка игрока: выбранная курица в кружке. Не выбрана или ключ неизвестен — фермер.
import { computed } from 'vue'
import { CHICKENS } from '@/config/chickens'
import ChickenAvatar from './ChickenAvatar.vue'

const props = withDefaults(defineProps<{ chickenKey?: string | null; size?: number }>(), { chickenKey: null, size: 40 })
const known = computed(() => !!props.chickenKey && CHICKENS.some((c) => c.key === props.chickenKey))
</script>

<template>
  <span class="pava" :style="{ width: size + 'px', height: size + 'px' }">
    <ChickenAvatar v-if="known" :chicken-key="chickenKey!" :size="Math.round(size * 0.86)" :idle="false" />
    <span v-else class="farmer" :style="{ fontSize: Math.round(size * 0.58) + 'px' }">🧑‍🌾</span>
  </span>
</template>

<style scoped>
.pava {
  flex: 0 0 auto; border-radius: 50%; overflow: hidden; display: grid; place-items: center;
  background: radial-gradient(circle at 50% 35%, #6b4526, var(--surface-wood));
  border: 2px solid var(--gold);
}
.farmer { line-height: 1; }
</style>
