<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { useSlots } from "vue"
import { cn } from "@fapost/ui/lib/utils"

/**
 * A status (active, unsubscribed, blocked): a soft badge in the status's tone with a coloured dot before the label.
 * Without a label it is the bare dot, for places that only mark a state (a notification row).
 */
const props = withDefaults(
  defineProps<{
    tone?: "success" | "info" | "warning" | "danger" | "neutral"
    class?: HTMLAttributes["class"]
  }>(),
  { tone: "neutral" },
)

const slots = useSlots()

const dots = {
  success: "bg-success-dot",
  info: "bg-info-dot",
  warning: "bg-warning-dot",
  danger: "bg-danger-dot",
  neutral: "bg-neutral-dot",
} as const

const pills = {
  success: "bg-success text-success-foreground",
  info: "bg-info text-info-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
  neutral: "bg-neutral text-neutral-foreground",
} as const
</script>

<template>
  <span
    v-if="slots.default"
    data-slot="status-dot"
    :class="cn('inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] py-[3px] text-xs font-semibold', pills[tone], props.class)"
  >
    <span :class="cn('size-1.5 shrink-0 rounded-full', dots[tone])" aria-hidden="true" />
    <slot />
  </span>
  <span
    v-else
    data-slot="status-dot"
    :class="cn('inline-block size-2 shrink-0 rounded-full', dots[tone], props.class)"
    aria-hidden="true"
  />
</template>
