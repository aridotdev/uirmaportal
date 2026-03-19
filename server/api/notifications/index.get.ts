import { NOTIFICATION_STATUSES } from '~~/shared/utils/constants'

export default defineEventHandler(async () => {
  const dummyData = Array.from({ length: 25 }, (_, i) => {
    const id = i + 1
    const notificationDate = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
    const status = NOTIFICATION_STATUSES[Math.floor(Math.random() * NOTIFICATION_STATUSES.length)]
    const vendorId = (i % 3) + 1
    const modelId = (i % 5) + 1

    return {
      id,
      notificationCode: `NTF-${2024000 + id}`,
      notificationDate: notificationDate.getTime(),
      modelId,
      branch: ['JKT01', 'SUB02', 'BDG03', 'MDN04', 'MKR05'][i % 5],
      vendorId,
      status,
      createdBy: 'system-dummy',
      updatedBy: 'system-dummy',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  })

  return {
    success: true,
    data: dummyData
  }
})
