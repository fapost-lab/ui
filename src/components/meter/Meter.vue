<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { computed } from "vue"
import { cn } from "@fapost/ui/lib/utils"
import { meterValue, type MeterTone } from "./meter"

/**
 * A measured value in a known range, such as the share of a plan's limit in use: a thin track with a fill in a tone.
 * It is a `meter`, not a progress bar, so a screen reader reads the label and the value ("Assistants, 80% used").
 */
const props = withDefaults(
  defineProps<{
    value: number
    label: string
    max?: number
    tone?: MeterTone
    class?: HTMLAttributes["class"]
  }>(),
  { max: 100, tone: "primary" },
)

const fills = {
  primary: "bg-primary",
  success: "bg-success-dot",
  warning: "bg-warning-dot",
  danger: "bg-danger-dot",
} as const

const current = computed(() => meterValue(props.value, props.max))
const width = computed(() => (props.max > 0 ? (current.value / props.max) * 100 : 0))
</script>

<template>
  <div
    role="meter"
    data-slot="meter"
    :data-tone="tone"
    :aria-label="label"
    :aria-valuenow="current"
    aria-valuemin="0"
    :aria-valuemax="max"
    :class="cn('bg-muted h-2 w-full overflow-hidden rounded-full', props.class)"
  >
    <div :class="cn('h-full rounded-full transition-[width]', fills[tone])" :style="{ width: `${width}%` }" />
  </div>
</template>
