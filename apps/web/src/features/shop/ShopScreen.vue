<script setup lang="ts">
// Вкладка 5 — Магазин: покупка новых куриц за монеты.
import { CHICKENS } from '@/config/chickens'
import ShopItem from './ShopItem.vue'
import CoinBalance from '@/components/CoinBalance.vue'
import { ASSETS } from '@/config/assets'
import { t } from '@/i18n'

const forSale = CHICKENS.filter((c) => c.price > 0)
</script>

<template>
  <div class="screen">
    <div class="row">
      <h1 class="screen-title title-ico"><img :src="ASSETS.ui.shop" alt="" /> {{ t('shop.title') }}</h1>
      <div class="spacer" />
      <CoinBalance />
    </div>
    <ShopItem v-for="def in forSale" :key="def.key" :def="def" />
  </div>
</template>

<style scoped>
.title-ico { display: inline-flex; align-items: center; gap: 8px; }
.title-ico img { width: 36px; height: 36px; object-fit: contain; }
</style>
