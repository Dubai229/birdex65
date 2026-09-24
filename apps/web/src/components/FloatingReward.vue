<script setup lang="ts">
// Всплывающее "+N" над точкой. Родитель держит массив и удаляет по событию done.
defineProps<{ text: string; x: number; y: number; gold?: boolean }>()
defineEmits<{ done: [] }>()
</script>

<template>
  <span class="float" :class="{ gold }" :style="{ left: x + 'px', top: y + 'px' }" @animationend="$emit('done')">
    {{ text }}
  </span>
</template>

<style scoped>
.float {
  position: absolute; pointer-events: none; z-index: 5;
  font-weight: 900; font-size: 22px; color: var(--warm-white);
  text-shadow: 0 2px 0 rgba(0, 0, 0, 0.5);
  transform: translate(-50%, -50%);
  animation: float-up 0.8s ease-out forwards;
}
.float.gold { color: var(--gold); font-size: 28px; }
@keyframes float-up {
  from { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
  to { opacity: 0; transform: translate(-50%, -140%) scale(1.15); }
}
</style>
