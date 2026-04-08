/**
 * Database Seed Script
 *
 * Seeds minimal development data:
 * - 4 users (1 per role: CS, QRCC, MANAGEMENT, ADMIN)
 * - 3 vendors (MOKA, MTC, SDP)
 * - 5 product models
 * - 7 defect masters
 * - 25 notification masters
 *
 * Usage: pnpm db:seed
 */

import { drizzle } from 'drizzle-orm/libsql'
import 'dotenv/config'
import * as schema from './schema'
import { getFiscalPeriodInfo } from '../../shared/utils/fiscal'
import type { PhotoType, FieldName, NotificationStatus, UserRole } from '../../shared/utils/constants'

const db = drizzle({
  connection: { url: process.env.DB_FILE_NAME || 'file:local.db' },
  schema
})

const ts = (iso: string) => new Date(iso).getTime()

// ────────────────────────────────────────────────────────────────
// Users (1 per role)
// ────────────────────────────────────────────────────────────────

const users: (typeof schema.user.$inferInsert)[] = [
  {
    id: 'user-cs-001',
    name: 'CS Staff',
    email: 'cs@sharp.co.id',
    emailVerified: false,
    username: 'cs_staff',
    displayUsername: 'cs_staff',
    role: 'CS' as UserRole,
    branch: 'JAKARTA',
    isActive: true
  },
  {
    id: 'user-qrcc-001',
    name: 'QRCC Reviewer',
    email: 'qrcc@sharp.co.id',
    emailVerified: false,
    username: 'qrcc_reviewer',
    displayUsername: 'qrcc_reviewer',
    role: 'QRCC' as UserRole,
    branch: 'JAKARTA',
    isActive: true
  },
  {
    id: 'user-mgmt-001',
    name: 'Management User',
    email: 'management@sharp.co.id',
    emailVerified: false,
    username: 'management',
    displayUsername: 'management',
    role: 'MANAGEMENT' as UserRole,
    branch: 'JAKARTA',
    isActive: true
  },
  {
    id: 'user-admin-001',
    name: 'Admin User',
    email: 'admin@sharp.co.id',
    emailVerified: false,
    username: 'admin',
    displayUsername: 'admin',
    role: 'ADMIN' as UserRole,
    branch: 'JAKARTA',
    isActive: true
  }
]

// ────────────────────────────────────────────────────────────────
// Vendors
// ────────────────────────────────────────────────────────────────

const vendors: (typeof schema.vendor.$inferInsert)[] = [
  {
    code: 'MOKA',
    name: 'MOKA Display',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF', 'WO_PANEL', 'WO_PANEL_SN'] as PhotoType[],
    requiredFields: ['odfNumber', 'version', 'week'] as FieldName[],
    createdBy: 'user-admin-001',
    updatedBy: 'user-admin-001'
  },
  {
    code: 'MTC',
    name: 'MTC Panel',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF'] as PhotoType[],
    requiredFields: [] as FieldName[],
    createdBy: 'user-admin-001',
    updatedBy: 'user-admin-001'
  },
  {
    code: 'SDP',
    name: 'SDP Electronics',
    requiredPhotos: ['CLAIM', 'CLAIM_ZOOM', 'PANEL_SN', 'ODF'] as PhotoType[],
    requiredFields: [] as FieldName[],
    createdBy: 'user-admin-001',
    updatedBy: 'user-admin-001'
  }
]

// ────────────────────────────────────────────────────────────────
// Product Models
// ────────────────────────────────────────────────────────────────

const productModels: (typeof schema.productModel.$inferInsert)[] = [
  { name: '4T-C43HJ6000I', inch: 43, vendorId: 1, createdBy: 'user-admin-001', updatedBy: 'user-admin-001' },
  { name: '4T-C55HJ6000I', inch: 55, vendorId: 1, createdBy: 'user-admin-001', updatedBy: 'user-admin-001' },
  { name: '4T-C50FJ1I', inch: 50, vendorId: 2, createdBy: 'user-admin-001', updatedBy: 'user-admin-001' },
  { name: '4T-C55FJ1I', inch: 55, vendorId: 2, createdBy: 'user-admin-001', updatedBy: 'user-admin-001' },
  { name: '2T-C-42FD1I', inch: 42, vendorId: 3, createdBy: 'user-admin-001', updatedBy: 'user-admin-001' }
]

// ────────────────────────────────────────────────────────────────
// Defect Masters
// ────────────────────────────────────────────────────────────────

const defectMasters: (typeof schema.defectMaster.$inferInsert)[] = [
  { code: 'DEF-001', name: 'No Display', createdBy: 'user-admin-001', updatedBy: 'user-admin-001' },
  { code: 'DEF-002', name: 'Vertical Line', createdBy: 'user-admin-001', updatedBy: 'user-admin-001' },
  { code: 'DEF-003', name: 'Horizontal Line', createdBy: 'user-admin-001', updatedBy: 'user-admin-001' },
  { code: 'DEF-004', name: 'Broken Panel', createdBy: 'user-admin-001', updatedBy: 'user-admin-001' },
  { code: 'DEF-005', name: 'Flicker', createdBy: 'user-admin-001', updatedBy: 'user-admin-001' },
  { code: 'DEF-006', name: 'Dark Spot', createdBy: 'user-admin-001', updatedBy: 'user-admin-001' },
  { code: 'DEF-007', name: 'Backlight Bleed', createdBy: 'user-admin-001', updatedBy: 'user-admin-001' }
]

// ────────────────────────────────────────────────────────────────
// Notification Masters (25 records across fiscal periods)
// ────────────────────────────────────────────────────────────────

function makeNotification(
  notificationCode: string,
  notificationDateIso: string,
  modelId: number,
  branch: string,
  vendorId: number,
  status: NotificationStatus
): typeof schema.notificationMaster.$inferInsert {
  const dateMs = ts(notificationDateIso)
  const fp = getFiscalPeriodInfo(dateMs)
  return {
    notificationCode,
    notificationDate: new Date(dateMs),
    modelId,
    branch,
    vendorId,
    status,
    fiscalYear: fp.fiscalYear,
    fiscalHalf: fp.fiscalHalf,
    fiscalLabel: fp.fiscalLabel,
    calendarYear: fp.calendarYear,
    calendarMonth: fp.calendarMonth,
    createdBy: 'user-admin-001',
    updatedBy: 'user-admin-001'
  }
}

const notificationMasters = [
  // 2025LH (Oct 2025 - Mar 2026)
  makeNotification('NTF-2026001', '2026-03-31T10:00:00Z', 1, 'JAKARTA', 1, 'NEW'),
  makeNotification('NTF-2026002', '2026-03-15T08:00:00Z', 2, 'SURABAYA', 2, 'USED'),
  makeNotification('NTF-2026003', '2026-02-20T09:00:00Z', 3, 'MEDAN', 3, 'NEW'),
  makeNotification('NTF-2026004', '2026-01-10T11:00:00Z', 4, 'BANDUNG', 1, 'USED'),
  makeNotification('NTF-2025005', '2025-12-18T14:00:00Z', 5, 'MAKASSAR', 2, 'EXPIRED'),
  makeNotification('NTF-2025006', '2025-11-25T07:00:00Z', 1, 'JAKARTA', 3, 'NEW'),
  makeNotification('NTF-2025007', '2025-10-01T00:00:00Z', 2, 'SURABAYA', 1, 'USED'),
  makeNotification('NTF-2025008', '2025-10-15T09:00:00Z', 3, 'MEDAN', 2, 'USED'),

  // 2025FH (Apr 2025 - Sep 2025)
  makeNotification('NTF-2025009', '2025-09-30T23:00:00Z', 4, 'BANDUNG', 3, 'EXPIRED'),
  makeNotification('NTF-2025010', '2025-09-15T08:00:00Z', 5, 'MAKASSAR', 1, 'USED'),
  makeNotification('NTF-2025011', '2025-08-20T10:00:00Z', 1, 'JAKARTA', 2, 'NEW'),
  makeNotification('NTF-2025012', '2025-07-10T12:00:00Z', 2, 'SURABAYA', 3, 'NEW'),
  makeNotification('NTF-2025013', '2025-06-15T09:00:00Z', 3, 'MEDAN', 1, 'EXPIRED'),
  makeNotification('NTF-2025014', '2025-05-20T14:00:00Z', 4, 'BANDUNG', 2, 'NEW'),
  makeNotification('NTF-2025015', '2025-04-01T00:00:00Z', 5, 'MAKASSAR', 3, 'USED'),
  makeNotification('NTF-2025016', '2025-04-15T08:00:00Z', 1, 'JAKARTA', 1, 'USED'),

  // 2024LH (Oct 2024 - Mar 2025)
  makeNotification('NTF-2025017', '2025-03-31T22:00:00Z', 2, 'SURABAYA', 2, 'EXPIRED'),
  makeNotification('NTF-2025018', '2025-02-15T10:00:00Z', 3, 'MEDAN', 3, 'NEW'),
  makeNotification('NTF-2025019', '2025-01-10T11:00:00Z', 4, 'BANDUNG', 1, 'USED'),
  makeNotification('NTF-2024020', '2024-12-20T09:00:00Z', 5, 'MAKASSAR', 2, 'EXPIRED'),
  makeNotification('NTF-2024021', '2024-11-15T14:00:00Z', 1, 'JAKARTA', 3, 'EXPIRED'),
  makeNotification('NTF-2024022', '2024-10-01T00:00:00Z', 2, 'SURABAYA', 1, 'USED'),
  makeNotification('NTF-2024023', '2024-10-20T08:00:00Z', 3, 'MEDAN', 2, 'USED'),
  makeNotification('NTF-2024024', '2024-10-30T12:00:00Z', 4, 'BANDUNG', 3, 'EXPIRED'),
  makeNotification('NTF-2024025', '2024-11-25T15:00:00Z', 5, 'MAKASSAR', 1, 'USED')
]

// ────────────────────────────────────────────────────────────────
// Seed Runner
// ────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding database...\n')

  // 1. Users
  console.log('Inserting users...')
  for (const u of users) {
    await db.insert(schema.user).values(u).onConflictDoNothing()
  }
  console.log(`  -> ${users.length} users`)

  // 2. Vendors
  console.log('Inserting vendors...')
  for (const v of vendors) {
    await db.insert(schema.vendor).values(v).onConflictDoNothing()
  }
  console.log(`  -> ${vendors.length} vendors`)

  // 3. Product Models
  console.log('Inserting product models...')
  for (const pm of productModels) {
    await db.insert(schema.productModel).values(pm).onConflictDoNothing()
  }
  console.log(`  -> ${productModels.length} product models`)

  // 4. Defect Masters
  console.log('Inserting defect masters...')
  for (const d of defectMasters) {
    await db.insert(schema.defectMaster).values(d).onConflictDoNothing()
  }
  console.log(`  -> ${defectMasters.length} defect masters`)

  // 5. Notification Masters
  console.log('Inserting notification masters...')
  for (const n of notificationMasters) {
    await db.insert(schema.notificationMaster).values(n).onConflictDoNothing()
  }
  console.log(`  -> ${notificationMasters.length} notification masters`)

  console.log('\nSeed completed successfully!')
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
