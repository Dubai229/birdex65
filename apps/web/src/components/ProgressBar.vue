<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{ value: number; max: number; color?: string }>(), {
  color: 'var(--gold)',
})
const pct = computed(() => (props.max > 0 ? Math.min(100, (props.value / props.max) * 100) : 0))
</script>

<template>
  <div class="bar"><div class="fill" :style="{ width: pct + '%', background: color }" /></div>
</template>

<style scoped>
.bar { height: 10px; border-radius: 99px; background: rgba(0, 0, 0, 0.5); overflow: hidden; }
.fill { height: 100%; border-radius: 99px; transition: width 0.4s ease; }
</style>
