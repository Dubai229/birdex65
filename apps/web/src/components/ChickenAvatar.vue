<script setup lang="ts">
// Картинка курицы. Нет своей картинки — обычная курица, перекрашенная в оттенок породы.
// idle-анимация (дыхание) на CSS.
import { computed, ref } from 'vue'
import { getChickenDef, PLACEHOLDER_CHICKEN_ASSET } from '@/config/chickens'

const props = withDefaults(defineProps<{ chickenKey: string; size?: number; idle?: boolean; locked?: boolean }>(), {
  size: 96,
  idle: true,
  locked: false,
})

const def = computed(() => getChickenDef(props.chickenKey))
// Ошибка загрузки запоминается по пути картинки: при смене курицы пробуем заново.
const failedSrc = ref<string | null>(null)
const usePlaceholder = computed(() => failedSrc.value === def.value.asset)
const src = computed(() => (usePlaceholder.value ? PLACEHOLDER_CHICKEN_ASSET : def.value.asset))
const tintFilter = computed(() =>
  usePlaceholder.value ? `hue-rotate(${def.value.tint}deg) saturate(1.4)` : undefined,
)
// Случайная задержка, чтобы курицы "дышали" не синхронно.
const delay = `${(Math.random() * -3).toFixed(2)}s`
</script>

<template>
  <div
    class="avatar"
    :class="{ idle, locked }"
    :style="{ width: size + 'px', height: size + 'px', animationDelay: delay }"
  >
    <img
      :src="src"
      :alt="def.name"
      :style="{ filter: tintFilter }"
      draggable="false"
      @error="failedSrc = def.asset"
    />
  </div>
</template>

<style scoped>
.avatar { display: flex; align-items: flex-end; justify-content: center; transform-origin: 50% 100%; }
.avatar.idle { animation: breathe 3.2s ease-in-out infinite; }
.avatar.locked { filter: brightness(0.25) saturate(0); }
img { width: 100%; height: 100%; object-fit: contain; }
</style>
