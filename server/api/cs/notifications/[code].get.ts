import { createError, defineEventHandler, getRouterParam } from 'h3'
import { notifications, productModels, vendors, defects } from '~~/server/utils/notification-data'
import type { NotificationRecord, ProductModelRecord, VendorRecord } from '~~/server/utils/notification-data'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Notification code is required'
    })
  }

  const notification = notifications.find((n: NotificationRecord) => n.notificationCode === code)

  if (!notification) {
    return null
  }

  const productModel = productModels.find((m: ProductModelRecord) => m.id === notification.modelId)
  const vendor = vendors.find((v: VendorRecord) => v.id === notification.vendorId)

  // For CS specifically, we might want to return some defect options related to vendor
  // For now return all defects
  const relevantDefects = defects

  return {
    notification,
    productModel,
    vendor,
    defects: relevantDefects
  }
})
