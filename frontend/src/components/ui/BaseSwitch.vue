<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  hint?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

withDefaults(defineProps<Props>(), {
  size: 'md',
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <label
    :class="[
      'inline-flex items-center gap-3 cursor-pointer select-none',
      disabled && 'opacity-50 cursor-not-allowed',
    ]"
  >
    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :disabled="disabled"
      @click="$emit('update:modelValue', !modelValue)"
      :class="[
        'relative inline-flex items-center rounded-full transition-colors duration-200 shrink-0',
        'focus:outline-none focus:ring-4 focus:ring-primary/20',
        size === 'sm' ? 'h-5 w-9' : 'h-7 w-12',
        modelValue ? 'bg-primary' : 'bg-outline-variant/60',
      ]"
    >
      <span
        :class="[
          'inline-block rounded-full bg-white shadow transition-transform duration-200',
          size === 'sm' ? 'h-4 w-4' : 'h-6 w-6',
          modelValue
            ? size === 'sm' ? 'translate-x-4' : 'translate-x-5'
            : 'translate-x-0.5',
        ]"
      />
    </button>
    <span v-if="label || $slots.default" class="flex flex-col">
      <span class="text-sm font-medium text-on-surface">
        <slot>{{ label }}</slot>
      </span>
      <span v-if="hint" class="text-xs text-on-surface-variant/70">{{ hint }}</span>
    </span>
  </label>
</template>
