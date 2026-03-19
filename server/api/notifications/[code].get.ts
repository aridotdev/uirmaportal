import { defects, notifications, productModels, vendors } from '~~/server/utils/notification-data'

export default defineEventHandler((event) => {
  const code = getRouterParam(event, 'code')

  if (!code) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Notification code is required'
    })
  }

  const notification = notifications.find(
    n => n.notificationCode.toLowerCase() === code.toLowerCase()
  )

  if (!notification) {
    throw createError({
      statusCode: 404,
      statusMessage: `Notification with code "${code}" not found`
    })
  }

  const model = productModels.find(m => m.id === notification.modelId)
  const vendor = vendors.find(v => v.id === notification.vendorId)

  return {
    notification: {
      id: notification.id,
      notificationCode: notification.notificationCode,
      notificationDate: notification.notificationDate,
      branch: notification.branch,
      status: notification.status
    },
    productModel: model
      ? { id: model.id, name: model.name, inch: model.inch }
      : null,
    vendor: vendor
      ? {
          id: vendor.id,
          code: vendor.code,
          name: vendor.name,
          requiredPhotos: vendor.requiredPhotos,
          requiredFields: vendor.requiredFields
        }
      : null,
    defects: defects.map(d => ({ id: d.id, code: d.code, name: d.name }))
  }
})
