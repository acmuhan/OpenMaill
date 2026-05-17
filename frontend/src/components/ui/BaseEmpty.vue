<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  icon?: 'inbox' | 'folder' | 'box' | 'spark' | 'alert'
  variant?: 'default' | 'subtle' | 'error'
}

withDefaults(defineProps<Props>(), {
  icon: 'inbox',
  variant: 'default',
})

const iconPath: Record<string, string> = {
  inbox: 'M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 0 0-2.15-1.588H6.911a2.25 2.25 0 0 0-2.15 1.588L2.35 13.177a2.25 2.25 0 0 0-.1.661Z',
  folder: 'M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z',
  box: 'M21 7.5l-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9',
  spark: 'M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z',
  alert: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.732 0 2.815-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z',
}
</script>

<template>
  <div
    :class="[
      'flex flex-col items-center justify-center text-center gap-3 rounded-md p-8',
      variant === 'error'
        ? 'bg-error-container/40 border border-error/20 text-on-error-container'
        : variant === 'subtle'
          ? 'bg-transparent'
          : 'bg-surface-container-low/60 border border-dashed border-outline-variant/40',
    ]"
  >
    <div
      :class="[
        'w-12 h-12 rounded-full flex items-center justify-center',
        variant === 'error' ? 'bg-error/15 text-error' : 'bg-primary-fixed/60 text-primary',
      ]"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" :d="iconPath[icon]" />
      </svg>
    </div>
    <h3 v-if="title" class="text-base font-semibold text-on-surface">{{ title }}</h3>
    <p v-if="description" class="text-sm text-on-surface-variant/80 max-w-md leading-relaxed">
      {{ description }}
    </p>
    <slot />
  </div>
</template>
