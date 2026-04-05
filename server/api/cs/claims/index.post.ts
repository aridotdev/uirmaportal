import { readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Payload is required'
    })
  }

  // In a real migration, this would save to a database.
  // For now, we return a success response with mock ID.
  const claimNumber = `CLM-${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

  return {
    success: true,
    message: 'Claim created successfully',
    data: {
      id: Math.floor(Math.random() * 1000),
      claimNumber,
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  }
})
