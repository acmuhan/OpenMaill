<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  padding?: 'sm' | 'md' | 'lg'
  elevation?: 'flat' | 'soft' | 'lifted'
}

withDefaults(defineProps<Props>(), {
  padding: 'md',
  elevation: 'soft',
})

const paddingClass: Record<string, string> = {
  sm: 'p-4 sm:p-5',
  md: 'p-6 sm:p-7',
  lg: 'p-7 sm:p-9',
}

const elevationClass: Record<string, string> = {
  flat: 'bg-surface-container-lowest border border-outline-variant/30',
  soft: 'bg-surface-container-lowest shadow-[0_4px_24px_rgba(15,23,42,0.04)]',
  lifted: 'bg-surface-container-lowest shadow-[0_16px_40px_rgba(15,23,42,0.06)]',
}
</script>

<template>
  <section
    :class="['rounded-md', paddingClass[$props.padding], elevationClass[$props.elevation]]"
  >
    <header
      v-if="title || $slots.actions || $slots.title"
      class="flex items-start justify-between gap-4 mb-5"
    >
      <div class="flex flex-col gap-1">
        <slot name="title">
          <h2 class="text-xl font-semibold tracking-tight text-on-surface">
            {{ title }}
          </h2>
        </slot>
        <p v-if="subtitle" class="text-sm text-on-surface-variant/80">
          {{ subtitle }}
        </p>
      </div>
      <div v-if="$slots.actions" class="flex items-center gap-2 shrink-0">
        <slot name="actions" />
      </div>
    </header>
    <slot />
    <footer v-if="$slots.footer" class="mt-5 pt-5 border-t border-outline-variant/30">
      <slot name="footer" />
    </footer>
  </section>
</template>
