<script setup lang="ts">
import { computed } from 'vue'
import { getChickenDef } from '@/config/chickens'
import { chickenProduction } from '@/economy/production'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import { t } from '@/i18n'

const props = defineProps<{ chickenKey: string; level: number | null; selected?: boolean }>()
defineEmits<{ select: [] }>()

const def = computed(() => getChickenDef(props.chickenKey))
const owned = computed(() => props.level !== null)
const perHour = computed(() => chickenProduction(props.chickenKey, props.level ?? 1))
</script>

<template>
  <button class="card cc" :class="[def.rarity, { selected, locked: !owned }]" @click="$emit('select')">
    <div class="name">{{ def.name }}</div>
    <div class="lvl muted">{{ owned ? t('chickens.level', { n: level! }) : '🔒' }}</div>
    <ChickenAvatar :chicken-key="chickenKey" :size="70" :idle="owned" :locked="!owned" />
    <div class="rate">🥚 {{ perHour }} / ч</div>
  </button>
</template>

<style scoped>
.cc { position: relative; padding: 8px 6px 6px; display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; }
.cc.selected { border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold), var(--shadow-card); }
.name { font-weight: 900; font-size: 14px; }
.lvl { font-size: 11px; }
.rate { font-size: 12px; padding: 2px 8px; border-radius: 99px; background: rgba(0, 0, 0, 0.4); }
.common .name { color: var(--rarity-common); }
.uncommon .name { color: var(--rarity-uncommon); }
.rare .name { color: var(--rarity-rare); }
.epic .name { color: var(--rarity-epic); }
.legendary .name { color: var(--rarity-legendary); }
</style>
