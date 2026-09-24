<script setup lang="ts">
// Визуальная сцена фермы. Пока без картинок — градиент + emoji. Фон: ASSETS.farm.background.
import { ref } from 'vue'
import ChickenAvatar from '@/components/ChickenAvatar.vue'
import { ASSETS } from '@/config/assets'
import { playSound } from '@/services/audio'
import { t } from '@/i18n'

defineProps<{ chickenKey: string | null; perHour: number }>()
defineEmits<{ pick: [] }>()

const happy = ref(false)
function poke() {
  playSound('cluck')
  happy.value = true
  setTimeout(() => (happy.value = false), 600)
}
</script>

<template>
  <section class="scene" :style="{ backgroundImage: `url(${ASSETS.farm.background})` }">
    <div class="sky" />
    <div class="barn">🏚️</div>
    <div class="fence">🪵🪵🪵🪵🪵🪵</div>
    <div class="nest">🪺</div>

    <button v-if="chickenKey" class="hero" :class="{ happy }" @click="poke">
      <ChickenAvatar :chicken-key="chickenKey" :size="170" />
    </button>

    <div class="rate">🥚 {{ t('farm.perHour', { n: perHour }) }}</div>
    <button class="pick" @click="$emit('pick')">🔄 {{ t('farm.chooseChicken') }}</button>
  </section>
</template>

<style scoped>
.scene {
  position: relative; height: 46vh; min-height: 280px; max-height: 420px;
  border-radius: var(--radius-lg); overflow: hidden;
  border: 3px solid var(--surface-wood);
  background-color: #6d8b3a; background-size: cover; background-position: center;
}
.sky {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, #f7c77a 0%, #e9a255 35%, #7a9a3f 60%, #56702a 100%);
  opacity: 0.9;
}
.barn { position: absolute; left: 8%; top: 18%; font-size: 72px; }
.fence { position: absolute; left: 0; right: 0; top: 52%; font-size: 26px; letter-spacing: -4px; opacity: 0.85; text-align: center; }
.nest { position: absolute; right: 12%; bottom: 16%; font-size: 40px; }
.hero { position: absolute; left: 50%; bottom: 10%; transform: translateX(-50%); }
.hero.happy { animation: hop 0.5s ease; }
@keyframes hop {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  40% { transform: translateX(-50%) translateY(-18px); }
}
.rate {
  position: absolute; left: 10px; top: 10px; padding: 6px 10px; border-radius: 99px;
  background: rgba(0, 0, 0, 0.5); font-size: 13px;
}
.pick {
  position: absolute; right: 10px; top: 10px; padding: 6px 10px; border-radius: 99px;
  background: rgba(0, 0, 0, 0.5); font-size: 13px;
}
</style>
