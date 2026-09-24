<script setup lang="ts">
withDefaults(
  defineProps<{ variant?: 'green' | 'gold' | 'wood'; disabled?: boolean; loading?: boolean; small?: boolean }>(),
  { variant: 'green', disabled: false, loading: false, small: false },
)
defineEmits<{ click: [] }>()
</script>

<template>
  <button
    class="btn"
    :class="[variant, { small, disabled: disabled || loading }]"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <span v-if="loading" class="spinner" />
    <slot v-else />
  </button>
</template>

<style scoped>
.btn {
  height: var(--btn-height); padding: 0 18px; border-radius: var(--radius-md);
  font-weight: 900; font-size: 17px; color: #fff;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
  transition: transform 0.08s, filter 0.15s;
}
.btn.small { height: 36px; font-size: 14px; padding: 0 12px; border-radius: var(--radius-sm); }
.btn:active:not(.disabled) { transform: translateY(3px); box-shadow: none; }
.green { background: linear-gradient(180deg, #5fd04f, var(--green-success)); box-shadow: 0 4px 0 var(--green-dark); }
.gold { background: linear-gradient(180deg, #ffd35c, var(--gold)); box-shadow: 0 4px 0 var(--gold-dark); color: #4a2a05; text-shadow: none; }
.wood { background: linear-gradient(180deg, var(--surface-wood-light), var(--surface-wood)); box-shadow: 0 4px 0 #3a2414; }
.disabled { filter: grayscale(0.8) brightness(0.7); cursor: default; }
.spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 3px solid rgba(255, 255, 255, 0.35); border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
