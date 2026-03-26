<script setup lang="ts">
import type { ClaimStatus, ClaimPhotoStatus, VendorClaimStatus, NotificationStatus } from '~~/shared/utils/constants'
import {
  CLAIM_STATUS_CONFIG,
  PHOTO_STATUS_CONFIG,
  VENDOR_CLAIM_STATUS_CONFIG,
  NOTIFICATION_STATUS_CONFIG,
  type StatusConfig
} from '~/utils/status-config'

type BadgeVariant = 'claim' | 'photo' | 'vendor-claim' | 'notification'

const props = withDefaults(defineProps<{
  status: string
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  showDot?: boolean
}>(), {
  variant: 'claim',
  size: 'sm',
  showDot: false
})

const config = computed<StatusConfig | null>(() => {
  switch (props.variant) {
    case 'claim':
      return CLAIM_STATUS_CONFIG[props.status as ClaimStatus] ?? null
    case 'photo':
      return PHOTO_STATUS_CONFIG[props.status as ClaimPhotoStatus] ?? null
    case 'vendor-claim':
      return VENDOR_CLAIM_STATUS_CONFIG[props.status as VendorClaimStatus] ?? null
    case 'notification':
      return NOTIFICATION_STATUS_CONFIG[props.status as NotificationStatus] ?? null
    default:
      return null
  }
})

const displayLabel = computed(() => {
  if (config.value) return config.value.label
  return props.status.replace(/_/g, ' ')
})

const sizeClasses = computed(() => {
  return props.size === 'md'
    ? 'px-4 py-1.5 text-[10px]'
    : 'px-3 py-1 text-[9px]'
})
</script>

<template>
  <span
    v-if="config"
    :class="[
      'inline-flex items-center gap-1.5 rounded-full border font-black uppercase tracking-widest',
      config.color,
      sizeClasses
    ]"
  >
    <span
      v-if="showDot"
      class="h-1.5 w-1.5 rounded-full bg-current"
    />
    <component
      :is="config.icon"
      v-if="!showDot && props.size === 'md'"
      class="h-3 w-3"
    />
    {{ displayLabel }}
  </span>
</template>
