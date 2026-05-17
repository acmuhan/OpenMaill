<script setup lang="ts">
interface Props {
  variant?: 'info' | 'success' | 'warning' | 'error' | 'neutral'
  size?: 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  variant: 'info',
  size: 'sm',
})

const variantClass: Record<string, string> = {
  info: 'bg-primary-fixed text-on-primary-fixed',
  success: 'bg-secondary-fixed text-on-secondary-fixed',
  warning: 'bg-tertiary-fixed text-on-tertiary-fixed',
  error: 'bg-error-container text-on-error-container',
  neutral: 'bg-surface-container text-on-surface-variant',
}

const sizeClass: Record<string, string> = {
  sm: 'text-xs px-3 py-1 gap-1.5',
  md: 'text-sm px-4 py-1.5 gap-2',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full font-medium tracking-wide whitespace-nowrap',
      variantClass[$props.variant],
      sizeClass[$props.size],
    ]"
  >
    <slot name="icon" />
    <slot />
  </span>
</template>
