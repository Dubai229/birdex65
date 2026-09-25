<script setup lang="ts">
// Текст, в котором 🪙 заменяется картинкой монеты (тосты, подписи из i18n).
import { computed } from 'vue'
import CoinIcon from './CoinIcon.vue'

const props = withDefaults(defineProps<{ text: string; size?: number }>(), { size: 16 })
const parts = computed(() => props.text.split('🪙'))
</script>

<template>
  <span><template v-for="(p, i) in parts" :key="i"><CoinIcon v-if="i > 0" :size="size" />{{ p }}</template></span>
</template>
