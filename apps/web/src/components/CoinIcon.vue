<script setup lang="ts">
// Иконка монеты для всей игры (ASSETS.ui.coin). Нет файла — emoji.
import { ref } from 'vue'
import { ASSETS } from '@/config/assets'

withDefaults(defineProps<{ size?: number }>(), { size: 18 })
const failed = ref(false)
</script>

<template>
  <span class="coin-icon" :style="{ width: size + 'px', height: size + 'px' }">
    <img v-if="!failed" :src="ASSETS.ui.coin" alt="" draggable="false" @error="failed = true" />
    <span v-else :style="{ fontSize: size * 0.9 + 'px' }">🪙</span>
  </span>
</template>

<style scoped>
.coin-icon { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; vertical-align: middle; line-height: 1; }
img { width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
</style>
