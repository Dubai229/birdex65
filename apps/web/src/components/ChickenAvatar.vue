<script setup lang="ts">
// Картинка курицы. Если PNG ещё нет — emoji-заглушка. idle-анимация на CSS.
import { computed, ref } from 'vue'
import { getChickenDef } from '@/config/chickens'

const props = withDefaults(defineProps<{ chickenKey: string; size?: number; idle?: boolean; locked?: boolean }>(), {
  size: 96,
  idle: true,
  locked: false,
})

const def = computed(() => getChickenDef(props.chickenKey))
const imgFailed = ref(false)
// Случайная задержка, чтобы курицы "дышали" не синхронно.
const delay = `${(Math.random() * -3).toFixed(2)}s`
</script>

<template>
  <div
    class="avatar"
    :class="{ idle, locked }"
    :style="{ width: size + 'px', height: size + 'px', animationDelay: delay }"
  >
    <img v-if="!imgFailed" :src="def.asset" :alt="def.name" draggable="false" @error="imgFailed = true" />
    <span v-else class="emoji" :style="{ fontSize: size * 0.72 + 'px' }">{{ def.emoji }}</span>
  </div>
</template>

<style scoped>
.avatar { display: flex; align-items: flex-end; justify-content: center; transform-origin: 50% 100%; }
.avatar.idle { animation: breathe 3.2s ease-in-out infinite; }
.avatar.locked { filter: brightness(0.25) saturate(0); }
img { width: 100%; height: 100%; object-fit: contain; }
.emoji { line-height: 1; filter: drop-shadow(0 6px 4px rgba(0, 0, 0, 0.4)); }
</style>
