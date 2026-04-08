import { join, extname } from 'node:path'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { claimRepo } from '#server/repositories/claim.repo'
import { claimPhotoRepo } from '#server/repositories/claim-photo.repo'
import { claimHistoryRepo } from '#server/repositories/claim-history.repo'
import { ErrorCode } from '#server/utils/error-codes'
import type { PhotoType, ClaimPhotoStatus, UserRole } from '~~/shared/utils/constants'

// ── Constants ──────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png'] as const
const UPLOAD_BASE_DIR = 'public/uploads/claims'

type AuthUser = {
  id: string
  role?: UserRole
  branch: string | null
}

export interface UploadedFile {
  filename: string
  type: string
  data: Buffer
}

export interface UploadPhotoPayload {
  claimId: number
  photoType: PhotoType
  file: UploadedFile
}

// ── Helpers ────────────────────────────────────────────────

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
}

function getExtension(filename: string, mimeType: string): string {
  const ext = extname(filename).toLowerCase()
  if (ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
    return ext
  }
  // Fallback to mime type
  if (mimeType === 'image/png') return '.png'
  return '.jpg'
}

function getUploadDir(claimId: number): string {
  return join(process.cwd(), UPLOAD_BASE_DIR, String(claimId))
}

// ── Service ────────────────────────────────────────────────

export const claimPhotoService = {
  /**
   * Validate and save a photo file for a claim.
   *
   * 1. Verify claim exists and is owned by the user
   * 2. Verify claim is in an editable status (DRAFT or NEED_REVISION)
   * 3. Validate file: size, mime type, extension
   * 4. Save file to disk: public/uploads/claims/{claimId}/{photoType}.{ext}
   * 5. Upsert claim_photo record (replace if same photoType exists)
   * 6. Log history entry
   */
  async uploadPhoto(payload: UploadPhotoPayload, user: AuthUser) {
    const { claimId, photoType, file } = payload

    // 1. Verify claim exists
    const existing = await claimRepo.findById(claimId)
    if (!existing) {
      throw new Error(ErrorCode.CLAIM_NOT_FOUND)
    }

    // 2. Verify ownership
    if (existing.submittedBy !== user.id) {
      throw new Error(ErrorCode.FORBIDDEN)
    }

    // 3. Verify editable status
    if (existing.claimStatus !== 'DRAFT' && existing.claimStatus !== 'NEED_REVISION') {
      throw new Error(ErrorCode.CLAIM_NOT_EDITABLE)
    }

    // 4. Validate file
    this.validateFile(file)

    // 5. Determine file path and save to disk
    const ext = getExtension(file.filename, file.type)
    const fileName = sanitizeFilename(`${photoType}${ext}`)
    const uploadDir = getUploadDir(claimId)
    const absolutePath = join(uploadDir, fileName)
    const relativePath = `uploads/claims/${claimId}/${fileName}`

    await mkdir(uploadDir, { recursive: true })
    await writeFile(absolutePath, file.data)

    // 6. Check if a photo with same type already exists for this claim
    const existingPhotos = await claimPhotoRepo.findByClaimId(claimId)
    const existingPhoto = existingPhotos.find(p => p.photoType === photoType)

    let photoRecord
    if (existingPhoto) {
      // Delete old file (best effort)
      try {
        const oldAbsolutePath = join(process.cwd(), 'public', existingPhoto.filePath)
        await unlink(oldAbsolutePath)
      } catch {
        // Old file may not exist, that's fine
      }

      // Update existing record
      photoRecord = await claimPhotoRepo.update(existingPhoto.id, {
        filePath: relativePath,
        thumbnailPath: null,
        status: 'PENDING' as ClaimPhotoStatus,
        rejectReason: null
      })
    } else {
      // Insert new record
      photoRecord = await claimPhotoRepo.insert({
        claimId,
        photoType,
        filePath: relativePath,
        status: 'PENDING' as ClaimPhotoStatus
      })
    }

    // 7. Log history
    await claimHistoryRepo.insert({
      claimId,
      action: 'UPLOAD_PHOTO',
      fromStatus: existing.claimStatus,
      toStatus: existing.claimStatus,
      userId: user.id,
      userRole: user.role ?? 'CS',
      note: `Uploaded photo: ${photoType}`
    })

    return photoRecord
  },

  /**
   * Get all photos for a claim.
   */
  async getPhotosByClaimId(claimId: number) {
    return await claimPhotoRepo.findByClaimId(claimId)
  },

  /**
   * Get a single photo by ID.
   */
  async getPhotoById(photoId: number) {
    const photo = await claimPhotoRepo.findById(photoId)
    if (!photo) {
      throw new Error(ErrorCode.PHOTO_NOT_FOUND)
    }
    return photo
  },

  /**
   * Delete a photo (only if claim is editable and user is owner).
   */
  async deletePhoto(photoId: number, user: AuthUser) {
    const photo = await claimPhotoRepo.findById(photoId)
    if (!photo) {
      throw new Error(ErrorCode.PHOTO_NOT_FOUND)
    }

    const existing = await claimRepo.findById(photo.claimId)
    if (!existing) {
      throw new Error(ErrorCode.CLAIM_NOT_FOUND)
    }

    if (existing.submittedBy !== user.id) {
      throw new Error(ErrorCode.FORBIDDEN)
    }

    if (existing.claimStatus !== 'DRAFT' && existing.claimStatus !== 'NEED_REVISION') {
      throw new Error(ErrorCode.CLAIM_NOT_EDITABLE)
    }

    // Delete file from disk (best effort)
    try {
      const absolutePath = join(process.cwd(), 'public', photo.filePath)
      await unlink(absolutePath)
    } catch {
      // File may not exist
    }

    // Delete single photo from DB
    await claimPhotoRepo.deleteById(photoId)

    // Log history
    await claimHistoryRepo.insert({
      claimId: photo.claimId,
      action: 'UPLOAD_PHOTO',
      fromStatus: existing.claimStatus,
      toStatus: existing.claimStatus,
      userId: user.id,
      userRole: user.role ?? 'CS',
      note: `Deleted photo: ${photo.photoType}`
    })

    return { success: true }
  },

  /**
   * Validate an uploaded file (size, mime type, extension).
   * Throws an Error if invalid.
   */
  validateFile(file: UploadedFile): void {
    // Check size
    if (file.data.length > MAX_FILE_SIZE) {
      throw new Error('FILE_TOO_LARGE')
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      throw new Error('INVALID_FILE_TYPE')
    }

    // Check extension
    const ext = extname(file.filename).toLowerCase()
    if (ext && !ALLOWED_EXTENSIONS.includes(ext as typeof ALLOWED_EXTENSIONS[number])) {
      throw new Error('INVALID_FILE_EXTENSION')
    }
  }
}

export function mapPhotoServiceErrorToHttp(error: unknown) {
  const code = error instanceof Error ? error.message : 'UNKNOWN_ERROR'

  if (code === ErrorCode.CLAIM_NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Claim not found' }
  }
  if (code === ErrorCode.PHOTO_NOT_FOUND) {
    return { statusCode: 404, statusMessage: 'Photo not found' }
  }
  if (code === ErrorCode.FORBIDDEN) {
    return { statusCode: 403, statusMessage: 'Forbidden' }
  }
  if (code === ErrorCode.CLAIM_NOT_EDITABLE) {
    return { statusCode: 422, statusMessage: 'Claim is not in an editable status' }
  }
  if (code === 'FILE_TOO_LARGE') {
    return { statusCode: 413, statusMessage: 'File too large. Maximum 5MB allowed' }
  }
  if (code === 'INVALID_FILE_TYPE') {
    return { statusCode: 415, statusMessage: 'Invalid file type. Only JPG and PNG are allowed' }
  }
  if (code === 'INVALID_FILE_EXTENSION') {
    return { statusCode: 415, statusMessage: 'Invalid file extension. Only .jpg, .jpeg, .png are allowed' }
  }

  return { statusCode: 500, statusMessage: 'Internal server error' }
}
