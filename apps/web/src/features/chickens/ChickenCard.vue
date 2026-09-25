<script setup lang="ts">
import { computed } from 'vue'
import { getChickenDef } from '@/config/chickens'
import { chickenProduction } from '@/economy/production'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import EggIcon from '@/components/EggIcon.vue'
import { formatCompact } from '@/economy/format'
import { t } from '@/i18n'

const props = defineProps<{ chickenKey: string; level: number | null; selected?: boolean }>()
defineEmits<{ select: [] }>()

const def = computed(() => getChickenDef(props.chickenKey))
const owned = computed(() => props.level !== null)
const perHour = computed(() => chickenProduction(props.chickenKey, props.level ?? 1))
const pct = computed(() => ((props.level ?? 0) / def.value.maxLevel) * 100)
</script>

<template>
  <button class="card cc" :class="[def.rarity, { selected, locked: !owned }]" @click="$emit('select')">
    <div class="name">{{ def.name }}</div>
    <ChickenAvatar :chicken-key="chickenKey" :size="64" :idle="owned" :locked="!owned" />
    <div class="rate"><EggIcon :size="13" /> {{ formatCompact(perHour) }} / ч</div>
    <div v-if="owned" class="prog" :title="t('chickens.levelOf', { n: level!, max: def.maxLevel })">
      <div class="bar"><div class="fill" :style="{ width: pct + '%' }" /></div>
      <span class="lv">{{ level }}/{{ def.maxLevel }}</span>
    </div>
    <div v-else class="lock">🔒</div>
  </button>
</template>

<style scoped>
.cc { position: relative; padding: 8px 6px 7px; display: flex; flex-direction: column; align-items: center; gap: 3px; text-align: center; min-width: 0; }
.cc.selected { border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold), var(--shadow-card); }
.name { font-weight: 900; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.rate { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; padding: 2px 7px; border-radius: 99px; background: rgba(0, 0, 0, 0.4); }
.prog { display: flex; align-items: center; gap: 5px; width: 100%; padding: 0 2px; }
.bar { flex: 1; height: 6px; border-radius: 99px; background: rgba(0, 0, 0, 0.5); overflow: hidden; }
.fill { height: 100%; background: linear-gradient(90deg, var(--gold-dark), var(--gold)); border-radius: 99px; transition: width 0.4s; }
.lv { font-size: 10px; font-weight: 900; color: var(--gold); font-variant-numeric: tabular-nums; }
.lock { font-size: 11px; height: 12px; line-height: 12px; }
.common .name { color: var(--rarity-common); }
.uncommon .name { color: var(--rarity-uncommon); }
.rare .name { color: var(--rarity-rare); }
.epic .name { color: var(--rarity-epic); }
.legendary .name { color: var(--rarity-legendary); }
</style>
