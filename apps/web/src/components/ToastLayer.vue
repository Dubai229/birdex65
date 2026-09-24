<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
const ui = useUiStore()
</script>

<template>
  <div class="toasts">
    <TransitionGroup name="toast">
      <div v-for="item in ui.toasts" :key="item.id" class="toast" :class="item.kind">{{ item.text }}</div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed; left: 0; right: 0; top: calc(var(--safe-top) + 110px); z-index: 60;
  display: flex; flex-direction: column; align-items: center; gap: 6px; pointer-events: none;
}
.toast {
  padding: 10px 16px; border-radius: 99px; font-weight: 800; font-size: 14px;
  background: rgba(20, 12, 6, 0.92); border: 2px solid var(--surface-wood);
}
.toast.success { border-color: var(--green-success); }
.toast.error { border-color: var(--red-accent); }
.toast-enter-active, .toast-leave-active { transition: all 0.25s; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-10px); }
</style>
