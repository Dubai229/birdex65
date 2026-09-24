<script setup lang="ts">
// Выезжающая снизу панель для Награды/Рейтинга/Друзей/Настроек.
defineProps<{ open: boolean; title: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <Transition name="sheet">
    <div v-if="open" class="backdrop" @click.self="$emit('close')">
      <div class="sheet">
        <div class="head row">
          <h2>{{ title }}</h2>
          <div class="spacer" />
          <button class="x" @click="$emit('close')">✕</button>
        </div>
        <div class="body"><slot /></div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.backdrop {
  position: fixed; inset: 0; z-index: 50; background: rgba(0, 0, 0, 0.6);
  display: flex; align-items: flex-end;
}
.sheet {
  width: 100%; max-height: 85vh; overflow-y: auto;
  background: linear-gradient(180deg, #3a2616, var(--surface-darker));
  border-top: 3px solid var(--border-wood);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: 14px 16px calc(20px + var(--safe-bottom));
}
h2 { margin: 0; font-size: 20px; font-weight: 900; }
.x { width: 34px; height: 34px; border-radius: 50%; background: rgba(0, 0, 0, 0.4); font-size: 16px; }
.body { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
.sheet-enter-active, .sheet-leave-active { transition: opacity 0.2s; }
.sheet-enter-active .sheet, .sheet-leave-active .sheet { transition: transform 0.25s ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; }
.sheet-enter-from .sheet, .sheet-leave-to .sheet { transform: translateY(100%); }
</style>
