<script setup lang="ts">
import { computed } from 'vue'
import BaseSpinner from './BaseSpinner.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  icon?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  fullWidth: false,
  icon: false,
  type: 'button',
})

const sizeClass = computed(() => {
  if (props.icon) {
    return {
      sm: 'h-9 w-9 p-0',
      md: 'h-11 w-11 p-0',
      lg: 'h-12 w-12 p-0',
    }[props.size]
  }
  return {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-sm',
    lg: 'h-12 px-7 text-base',
  }[props.size]
})

const variantClass = computed(() => {
  const variants: Record<string, string> = {
    primary:
      'bg-primary text-on-primary hover:bg-primary-container shadow-[0_2px_8px_rgba(0,61,155,0.25)] hover:shadow-[0_4px_16px_rgba(0,61,155,0.32)]',
    secondary:
      'bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim',
    ghost:
      'bg-transparent text-on-surface hover:bg-surface-container-low border border-outline-variant',
    danger:
      'bg-error text-on-error hover:bg-error/90 shadow-[0_2px_8px_rgba(186,26,26,0.2)]',
  }
  return variants[props.variant]
})
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200',
      'focus:outline-none focus:ring-4 focus:ring-primary/20',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
      'active:scale-[0.98]',
      sizeClass,
      variantClass,
      fullWidth ? 'w-full' : '',
    ]"
  >
    <BaseSpinner v-if="loading" size="sm" />
    <slot />
  </button>
</template>
