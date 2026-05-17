<script setup lang="ts">
interface Tab {
  value: string
  label: string
  badge?: string
  disabled?: boolean
}

interface Props {
  modelValue: string
  tabs: Tab[]
  variant?: 'pill' | 'underline'
  size?: 'sm' | 'md'
  fullWidth?: boolean
}

withDefaults(defineProps<Props>(), {
  variant: 'pill',
  size: 'md',
  fullWidth: false,
})

defineEmits<{
  'update:modelValue': [v: string]
}>()
</script>

<template>
  <div
    :class="[
      'flex gap-2 overflow-x-auto',
      variant === 'pill' ? 'p-1 bg-surface-container-low/60 rounded-full self-start' : 'border-b border-outline-variant/40',
      fullWidth && 'w-full',
    ]"
  >
    <button
      v-for="t in tabs"
      :key="t.value"
      type="button"
      :disabled="t.disabled"
      @click="$emit('update:modelValue', t.value)"
      :class="[
        'inline-flex items-center gap-2 whitespace-nowrap font-medium transition-colors',
        size === 'sm' ? 'text-xs px-3 py-1' : 'text-sm px-4 py-1.5',
        fullWidth && 'flex-1 justify-center',
        t.disabled && 'opacity-50 cursor-not-allowed',
        variant === 'pill' && modelValue === t.value && 'bg-primary text-on-primary rounded-full shadow',
        variant === 'pill' && modelValue !== t.value && !t.disabled && 'text-on-surface-variant hover:text-on-surface rounded-full',
        variant === 'underline' && modelValue === t.value && 'text-primary border-b-2 border-primary -mb-px py-2',
        variant === 'underline' && modelValue !== t.value && 'text-on-surface-variant hover:text-on-surface py-2',
      ]"
    >
      {{ t.label }}
      <span
        v-if="t.badge"
        class="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed"
      >
        {{ t.badge }}
      </span>
    </button>
  </div>
</template>
