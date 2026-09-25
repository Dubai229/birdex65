<script setup lang="ts">
// Фон для вторичных вкладок: выбранный фон фермы, размытый и приглушённый.
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { FARM_BACKGROUNDS } from '@/config/assets'
import GameBackground from './GameBackground.vue'

withDefaults(defineProps<{ dim?: number; blur?: number }>(), { dim: 0.55, blur: 10 })
const settings = useSettingsStore()
const src = computed(() => FARM_BACKGROUNDS[settings.farmBg] ?? FARM_BACKGROUNDS[0])
</script>

<template>
  <GameBackground :src="src" :dim="dim" :blur="blur" />
</template>
