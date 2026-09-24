<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUiStore } from '@/stores/ui'
import { useGameStore } from '@/stores/game'
import { useSettingsStore } from '@/stores/settings'
import BottomSheet from '@/components/BottomSheet.vue'
import PrimaryButton from '@/components/PrimaryButton.vue'
import { t } from '@/i18n'

const ui = useUiStore()
const game = useGameStore()
const settings = useSettingsStore()
const name = ref('')

watch(
  () => ui.sheet,
  (s) => {
    if (s === 'settings') name.value = game.profile?.farmName ?? ''
  },
)

const toggles = [
  { key: 'sound', icon: '🔊' },
  { key: 'music', icon: '🎵' },
  { key: 'haptics', icon: '📳' },
] as const
</script>

<template>
  <BottomSheet :open="ui.sheet === 'settings'" :title="t('settings.title')" @close="ui.closeSheet()">
    <label class="muted small">{{ t('settings.farmName') }}</label>
    <div class="row">
      <input v-model="name" maxlength="24" class="input" />
      <PrimaryButton small :loading="game.pending === 'rename'" @click="game.renameFarm(name)">
        {{ t('settings.save') }}
      </PrimaryButton>
    </div>
    <label v-for="tg in toggles" :key="tg.key" class="card toggle row">
      <span>{{ tg.icon }} {{ t(`settings.${tg.key}`) }}</span>
      <div class="spacer" />
      <input v-model="settings[tg.key]" type="checkbox" />
    </label>
  </BottomSheet>
</template>

<style scoped>
.small { font-size: 12px; }
.input {
  flex: 1; height: 40px; padding: 0 12px; border-radius: var(--radius-sm);
  border: 2px solid var(--surface-wood); background: rgba(0, 0, 0, 0.4); color: var(--text-primary);
}
.toggle { padding: 12px; }
input[type='checkbox'] { width: 22px; height: 22px; accent-color: var(--green-success); }
</style>
