<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

interface Option {
  label: string
  value: string | number
  disabled?: boolean
}

interface Props {
  modelValue?: string | number
  options: Option[]
  label?: string
  hint?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  id?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  required: false,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const activeIndex = ref(-1)

const enabledOptions = computed(() => props.options.filter((opt) => !opt.disabled))
const selectedOption = computed(() => props.options.find((opt) => String(opt.value) === String(props.modelValue)))
const displayText = computed(() => selectedOption.value?.label || props.placeholder || '请选择')
const controlId = computed(() => props.id || `select-${Math.random().toString(36).slice(2)}`)
const listboxId = computed(() => `${controlId.value}-listbox`)

function close() {
  open.value = false
}

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  if (open.value) {
    const selectedIndex = props.options.findIndex((opt) => String(opt.value) === String(props.modelValue))
    activeIndex.value = selectedIndex >= 0 ? selectedIndex : props.options.findIndex((opt) => !opt.disabled)
  }
}

function choose(opt: Option) {
  if (opt.disabled) return
  emit('update:modelValue', String(opt.value))
  close()
}

function onOutsideClick(event: MouseEvent) {
  if (!rootEl.value?.contains(event.target as Node)) close()
}

function move(delta: number) {
  if (!open.value) {
    toggle()
    return
  }
  if (!enabledOptions.value.length) return

  const currentValue = props.options[activeIndex.value]?.value
  const enabledIndex = enabledOptions.value.findIndex((opt) => String(opt.value) === String(currentValue))
  const nextEnabled = enabledOptions.value[(enabledIndex + delta + enabledOptions.value.length) % enabledOptions.value.length]
  activeIndex.value = props.options.findIndex((opt) => String(opt.value) === String(nextEnabled.value))
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    move(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    move(-1)
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    if (!open.value) return toggle()
    const opt = props.options[activeIndex.value]
    if (opt) choose(opt)
  } else if (event.key === 'Escape') {
    close()
  }
}

watch(open, async (value) => {
  if (!value) return
  await nextTick()
  document.addEventListener('mousedown', onOutsideClick)
})

watch(open, (value) => {
  if (!value) document.removeEventListener('mousedown', onOutsideClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutsideClick)
})
</script>

<template>
  <div ref="rootEl" class="relative flex flex-col gap-2">
    <span
      v-if="label"
      :id="`${controlId}-label`"
      class="text-sm font-medium text-on-surface-variant tracking-wide flex items-center gap-1"
    >
      {{ label }}
      <span v-if="required" class="text-error">*</span>
    </span>
    <div class="relative">
      <button
        :id="controlId"
        type="button"
        role="combobox"
        :aria-expanded="open"
        :aria-controls="listboxId"
        :aria-labelledby="label ? `${controlId}-label ${controlId}` : undefined"
        :disabled="disabled"
        @click="toggle"
        @keydown="onKeydown"
        :class="[
          'w-full px-5 pr-12 rounded-full bg-surface-container-lowest text-on-surface text-sm text-left',
          'border border-outline-variant/60 transition-all duration-200',
          'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          size === 'sm' ? 'h-10' : size === 'lg' ? 'h-14' : 'h-12',
        ]"
      >
        <span :class="selectedOption ? '' : 'text-on-surface-variant/55'">{{ displayText }}</span>
      </button>
      <svg
        class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant transition-transform"
        :class="open && 'rotate-180'"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="m6 9 6 6 6-6" />
      </svg>

      <Transition name="select-pop">
        <div
          v-if="open"
          :id="listboxId"
          role="listbox"
          :aria-labelledby="label ? `${controlId}-label` : undefined"
          class="absolute z-40 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-1 shadow-[0_18px_45px_rgba(15,23,42,0.16)]"
        >
          <button
            v-for="(opt, index) in options"
            :key="opt.value"
            type="button"
            role="option"
            :aria-selected="String(opt.value) === String(modelValue)"
            :disabled="opt.disabled"
            @mouseenter="activeIndex = index"
            @click="choose(opt)"
            :class="[
              'flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-4 py-2 text-left text-sm transition-colors',
              String(opt.value) === String(modelValue) ? 'bg-primary text-on-primary' : 'text-on-surface',
              activeIndex === index && String(opt.value) !== String(modelValue) ? 'bg-surface-container-low' : '',
              opt.disabled ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer',
            ]"
          >
            <span class="truncate">{{ opt.label }}</span>
            <svg
              v-if="String(opt.value) === String(modelValue)"
              class="h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m5 13 4 4L19 7" />
            </svg>
          </button>
        </div>
      </Transition>
    </div>
    <span v-if="hint" class="text-xs text-on-surface-variant/70 px-3 leading-snug">{{ hint }}</span>
  </div>
</template>

<style scoped>
.select-pop-enter-active,
.select-pop-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
}

.select-pop-enter-from,
.select-pop-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
