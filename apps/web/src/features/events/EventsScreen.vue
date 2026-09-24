<script setup lang="ts">
// Вкладка 6 — События. Заглушка: сезоны, ивенты, лисы и т.д. — позже.
import { t } from '@/i18n'
</script>

<template>
  <div class="screen">
    <h1 class="screen-title">🗺️ {{ t('events.title') }}</h1>
    <div class="card soon">
      <div class="big">🦊🥚🎃</div>
      <p class="muted">{{ t('events.soon') }}</p>
    </div>
  </div>
</template>

<style scoped>
.soon { padding: 30px 16px; text-align: center; }
.big { font-size: 48px; }
</style>
