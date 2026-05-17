<script setup lang="ts">
interface Option {
  label: string
  value: string
  description?: string
  disabled?: boolean
}

interface Props {
  modelValue: string
  options: Option[]
  label?: string
  hint?: string
  disabled?: boolean
  name?: string
}

withDefaults(defineProps<Props>(), {
  disabled: false,
})

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <fieldset class="flex flex-col gap-2">
    <legend v-if="label" class="text-sm font-medium text-on-surface-variant tracking-wide">
      {{ label }}
    </legend>
    <div class="flex flex-col gap-2">
      <label
        v-for="opt in options"
        :key="opt.value"
        :class="[
          'flex items-start gap-3 rounded-2xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 transition-colors',
          modelValue === opt.value ? 'border-primary bg-primary/5' : '',
          disabled || opt.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-surface-container-low/80',
        ]"
      >
        <input
          type="radio"
          class="mt-1 h-4 w-4 accent-primary"
          :name="name || label || 'radio-group'"
          :checked="modelValue === opt.value"
          :disabled="disabled || opt.disabled"
          @change="$emit('update:modelValue', opt.value)"
        >
        <span class="flex flex-col gap-0.5">
          <span class="text-sm font-medium text-on-surface">{{ opt.label }}</span>
          <span v-if="opt.description" class="text-xs text-on-surface-variant/70 leading-snug">{{ opt.description }}</span>
        </span>
      </label>
    </div>
    <span v-if="hint" class="text-xs text-on-surface-variant/70 px-1 leading-snug">{{ hint }}</span>
  </fieldset>
</template>
