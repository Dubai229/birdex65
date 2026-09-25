<script setup lang="ts">
// Вкладка 6 — События. Заглушка: сезоны, ивенты, лисы и т.д. — позже.
import FarmBackdrop from '@/components/FarmBackdrop.vue'
import { t } from '@/i18n'
</script>

<template>
  <FarmBackdrop />
  <div class="screen events">
    <h1 class="screen-title">🗺️ {{ t('events.title') }}</h1>
    <div class="card soon">
      <div class="big">🦊🥚🎃</div>
      <p class="muted">{{ t('events.soon') }}</p>
    </div>
  </div>
</template>

<style scoped>
.events { position: relative; z-index: 1; }
.soon { padding: 30px 16px; text-align: center; }
.big { font-size: 48px; }
</style>
