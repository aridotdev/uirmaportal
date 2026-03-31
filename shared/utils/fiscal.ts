// shared/utils/fiscal.ts
// ========================================
// FISCAL PERIOD UTILITIES
// ========================================
// Source of truth for fiscal period definitions used across
// the entire application: frontend filters, backend queries,
// report aggregation, and dummy data generation.
//
// Fiscal calendar follows Japanese corporate fiscal year:
//   FH (First Half) = 1 Apr – 30 Sep
//   LH (Last Half)  = 1 Oct – 31 Mar
//
// Label convention:
//   fiscalLabel = "<YYYY><FH|LH>"
//   e.g. "2025FH" = 1 Apr 2025 – 30 Sep 2025
//        "2025LH" = 1 Oct 2025 – 31 Mar 2026
//
// The fiscal year label always uses the calendar year of
// the FIRST month in that fiscal year (April).
// So FY2025 = Apr 2025 – Mar 2026.
//   2025FH = Apr 2025 – Sep 2025
//   2025LH = Oct 2025 – Mar 2026

// ────────────────────────────────────────
// Constants
// ────────────────────────────────────────

/** Fiscal half values */
export const FISCAL_HALVES = ['FH', 'LH'] as const
export type FiscalHalf = (typeof FISCAL_HALVES)[number]

/** Month number where the fiscal year starts (April = 4) */
export const FISCAL_YEAR_START_MONTH = 4

/** Month number where the LH starts (October = 10) */
export const FISCAL_LH_START_MONTH = 10

/** Report period granularity options */
export const PERIOD_GRANULARITIES = ['daily', 'weekly', 'monthly'] as const
export type PeriodGranularity = (typeof PERIOD_GRANULARITIES)[number]

/** Period filter modes for report screens */
export const PERIOD_FILTER_MODES = [
  'this_month',
  'last_month',
  'this_fiscal_half',
  'last_fiscal_half',
  'this_fiscal_year',
  'last_fiscal_year',
  'this_calendar_year',
  'custom'
] as const
export type PeriodFilterMode = (typeof PERIOD_FILTER_MODES)[number]

// ────────────────────────────────────────
// Core Types
// ────────────────────────────────────────

/** Resolved fiscal period info for a single point in time */
export interface FiscalPeriodInfo {
  /** Calendar year, e.g. 2026 */
  calendarYear: number
  /** Calendar month 1-12, e.g. 3 = March */
  calendarMonth: number
  /** Fiscal year label, e.g. 2025 (for FY Apr 2025 – Mar 2026) */
  fiscalYear: number
  /** FH or LH */
  fiscalHalf: FiscalHalf
  /** Combined label, e.g. "2025LH" */
  fiscalLabel: string
  /** Fiscal month 1-12 within the fiscal year (Apr=1, Mar=12) */
  fiscalMonth: number
}

/** A date range representing a complete fiscal period */
export interface FiscalDateRange {
  /** Inclusive start date (midnight UTC) */
  startDate: Date
  /** Inclusive end date (23:59:59.999 UTC) */
  endDate: Date
  /** Human-readable label, e.g. "2025FH" or "FY2025" */
  label: string
}

/** Period filter contract for API queries */
export interface PeriodFilter {
  mode: PeriodFilterMode
  /** For 'custom' mode */
  startDate?: string | Date
  /** For 'custom' mode */
  endDate?: string | Date
}

// ────────────────────────────────────────
// Conversion Functions
// ────────────────────────────────────────

/**
 * Get fiscal period info for a given date.
 *
 * @param date - Date object, ISO string, or unix timestamp (ms)
 * @returns FiscalPeriodInfo with all period dimensions
 *
 * @example
 * getFiscalPeriodInfo('2025-04-15') // { fiscalYear: 2025, fiscalHalf: 'FH', fiscalLabel: '2025FH', fiscalMonth: 1, ... }
 * getFiscalPeriodInfo('2026-03-31') // { fiscalYear: 2025, fiscalHalf: 'LH', fiscalLabel: '2025LH', fiscalMonth: 12, ... }
 * getFiscalPeriodInfo('2025-10-01') // { fiscalYear: 2025, fiscalHalf: 'LH', fiscalLabel: '2025LH', fiscalMonth: 7, ... }
 */
export function getFiscalPeriodInfo(date: Date | string | number): FiscalPeriodInfo {
  const d = toDate(date)
  const calendarYear = d.getFullYear()
  const calendarMonth = d.getMonth() + 1 // 1-12

  // Fiscal year: if month >= April (4), FY = calendarYear; otherwise FY = calendarYear - 1
  const fiscalYear = calendarMonth >= FISCAL_YEAR_START_MONTH ? calendarYear : calendarYear - 1

  // Fiscal half: Apr-Sep = FH, Oct-Mar = LH
  const fiscalHalf: FiscalHalf = calendarMonth >= FISCAL_YEAR_START_MONTH && calendarMonth < FISCAL_LH_START_MONTH
    ? 'FH'
    : 'LH'

  const fiscalLabel = `${fiscalYear}${fiscalHalf}`

  // Fiscal month: Apr=1, May=2, ..., Mar=12
  const fiscalMonth = calendarMonth >= FISCAL_YEAR_START_MONTH
    ? calendarMonth - FISCAL_YEAR_START_MONTH + 1
    : calendarMonth + (12 - FISCAL_YEAR_START_MONTH + 1)

  return {
    calendarYear,
    calendarMonth,
    fiscalYear,
    fiscalHalf,
    fiscalLabel,
    fiscalMonth
  }
}

/**
 * Get the fiscal label string for a date (shorthand).
 * @returns e.g. "2025FH" or "2025LH"
 */
export function getFiscalLabel(date: Date | string | number): string {
  return getFiscalPeriodInfo(date).fiscalLabel
}

/**
 * Get the fiscal year number for a date.
 * @returns e.g. 2025
 */
export function getFiscalYear(date: Date | string | number): number {
  return getFiscalPeriodInfo(date).fiscalYear
}

/**
 * Get the fiscal half for a date.
 * @returns 'FH' or 'LH'
 */
export function getFiscalHalf(date: Date | string | number): FiscalHalf {
  return getFiscalPeriodInfo(date).fiscalHalf
}

// ────────────────────────────────────────
// Date Range Functions
// ────────────────────────────────────────

/**
 * Get the date range for a specific fiscal half.
 *
 * @param fiscalYear - e.g. 2025
 * @param half - 'FH' or 'LH'
 * @returns FiscalDateRange with start/end dates
 *
 * @example
 * getFiscalHalfRange(2025, 'FH') // { startDate: 2025-04-01, endDate: 2025-09-30, label: '2025FH' }
 * getFiscalHalfRange(2025, 'LH') // { startDate: 2025-10-01, endDate: 2026-03-31, label: '2025LH' }
 */
export function getFiscalHalfRange(fiscalYear: number, half: FiscalHalf): FiscalDateRange {
  if (half === 'FH') {
    return {
      startDate: new Date(Date.UTC(fiscalYear, 3, 1)), // Apr 1
      endDate: endOfDay(new Date(Date.UTC(fiscalYear, 8, 30))), // Sep 30
      label: `${fiscalYear}FH`
    }
  }
  // LH: Oct of fiscalYear to Mar of fiscalYear+1
  return {
    startDate: new Date(Date.UTC(fiscalYear, 9, 1)), // Oct 1
    endDate: endOfDay(new Date(Date.UTC(fiscalYear + 1, 2, 31))), // Mar 31
    label: `${fiscalYear}LH`
  }
}

/**
 * Get the date range for a full fiscal year.
 *
 * @param fiscalYear - e.g. 2025 → Apr 2025 – Mar 2026
 * @returns FiscalDateRange
 */
export function getFiscalYearRange(fiscalYear: number): FiscalDateRange {
  return {
    startDate: new Date(Date.UTC(fiscalYear, 3, 1)), // Apr 1
    endDate: endOfDay(new Date(Date.UTC(fiscalYear + 1, 2, 31))), // Mar 31
    label: `FY${fiscalYear}`
  }
}

/**
 * Get the date range for a calendar month.
 *
 * @param year - Calendar year
 * @param month - Calendar month 1-12
 */
export function getCalendarMonthRange(year: number, month: number): FiscalDateRange {
  const lastDay = new Date(Date.UTC(year, month, 0)).getDate()
  return {
    startDate: new Date(Date.UTC(year, month - 1, 1)),
    endDate: endOfDay(new Date(Date.UTC(year, month - 1, lastDay))),
    label: `${year}-${String(month).padStart(2, '0')}`
  }
}

/**
 * Get the date range for a calendar year.
 */
export function getCalendarYearRange(year: number): FiscalDateRange {
  return {
    startDate: new Date(Date.UTC(year, 0, 1)),
    endDate: endOfDay(new Date(Date.UTC(year, 11, 31))),
    label: `${year}`
  }
}

// ────────────────────────────────────────
// Period Filter Resolution
// ────────────────────────────────────────

/**
 * Resolve a PeriodFilterMode into a concrete date range.
 *
 * @param mode - The filter mode to resolve
 * @param referenceDate - The "now" reference (defaults to current date)
 * @param customRange - Required when mode is 'custom'
 */
export function resolvePeriodFilter(
  mode: PeriodFilterMode,
  referenceDate?: Date | string | number,
  customRange?: { startDate: string | Date, endDate: string | Date }
): FiscalDateRange {
  const now = referenceDate ? toDate(referenceDate) : new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  switch (mode) {
    case 'this_month':
      return getCalendarMonthRange(year, month)

    case 'last_month': {
      const prevMonth = month === 1 ? 12 : month - 1
      const prevYear = month === 1 ? year - 1 : year
      return getCalendarMonthRange(prevYear, prevMonth)
    }

    case 'this_fiscal_half': {
      const info = getFiscalPeriodInfo(now)
      return getFiscalHalfRange(info.fiscalYear, info.fiscalHalf)
    }

    case 'last_fiscal_half': {
      const info = getFiscalPeriodInfo(now)
      if (info.fiscalHalf === 'FH') {
        // Currently in FH → last half was previous year's LH
        return getFiscalHalfRange(info.fiscalYear - 1, 'LH')
      }
      // Currently in LH → last half was this year's FH
      return getFiscalHalfRange(info.fiscalYear, 'FH')
    }

    case 'this_fiscal_year': {
      const info = getFiscalPeriodInfo(now)
      return getFiscalYearRange(info.fiscalYear)
    }

    case 'last_fiscal_year': {
      const info = getFiscalPeriodInfo(now)
      return getFiscalYearRange(info.fiscalYear - 1)
    }

    case 'this_calendar_year':
      return getCalendarYearRange(year)

    case 'custom': {
      if (!customRange) {
        throw new Error('customRange is required when mode is "custom"')
      }
      return {
        startDate: toDate(customRange.startDate),
        endDate: endOfDay(toDate(customRange.endDate)),
        label: 'Custom'
      }
    }

    default:
      return getCalendarMonthRange(year, month)
  }
}

// ────────────────────────────────────────
// Label / Display Helpers
// ────────────────────────────────────────

/**
 * Parse a fiscal label like "2025FH" into its components.
 * Returns null if invalid.
 */
export function parseFiscalLabel(label: string): { fiscalYear: number, fiscalHalf: FiscalHalf } | null {
  const match = label.match(/^(\d{4})(FH|LH)$/)
  if (!match || !match[1] || !match[2]) return null
  return {
    fiscalYear: parseInt(match[1], 10),
    fiscalHalf: match[2] as FiscalHalf
  }
}

/**
 * Get a human-readable display string for a fiscal label.
 *
 * @example
 * formatFiscalLabel('2025FH') // "FY2025 First Half (Apr–Sep 2025)"
 * formatFiscalLabel('2025LH') // "FY2025 Last Half (Oct 2025–Mar 2026)"
 */
export function formatFiscalLabel(label: string): string {
  const parsed = parseFiscalLabel(label)
  if (!parsed) return label

  const { fiscalYear, fiscalHalf } = parsed
  if (fiscalHalf === 'FH') {
    return `FY${fiscalYear} First Half (Apr\u2013Sep ${fiscalYear})`
  }
  return `FY${fiscalYear} Last Half (Oct ${fiscalYear}\u2013Mar ${fiscalYear + 1})`
}

/**
 * Get the display label for a PeriodFilterMode.
 */
export function getPeriodFilterLabel(mode: PeriodFilterMode): string {
  const labels: Record<PeriodFilterMode, string> = {
    this_month: 'This Month',
    last_month: 'Last Month',
    this_fiscal_half: 'This Fiscal Half',
    last_fiscal_half: 'Last Fiscal Half',
    this_fiscal_year: 'This Fiscal Year',
    last_fiscal_year: 'Last Fiscal Year',
    this_calendar_year: 'This Calendar Year',
    custom: 'Custom Range'
  }
  return labels[mode]
}

/**
 * Generate an array of fiscal half labels for the last N halves.
 * Useful for populating dropdown filters or chart x-axes.
 *
 * @example
 * getRecentFiscalHalves(4, '2026-03-15')
 * // ['2024FH', '2024LH', '2025FH', '2025LH']
 */
export function getRecentFiscalHalves(count: number, referenceDate?: Date | string | number): string[] {
  const ref = referenceDate ? toDate(referenceDate) : new Date()
  const current = getFiscalPeriodInfo(ref)

  const result: string[] = []
  let fy = current.fiscalYear
  let half = current.fiscalHalf

  // Include current, then go backwards
  for (let i = 0; i < count; i++) {
    result.unshift(`${fy}${half}`)
    if (half === 'FH') {
      half = 'LH'
      fy -= 1
    } else {
      half = 'FH'
    }
  }

  return result
}

/**
 * Generate month labels within a fiscal half for chart x-axes.
 *
 * @example
 * getFiscalHalfMonths('2025FH')
 * // ['Apr-25', 'May-25', 'Jun-25', 'Jul-25', 'Aug-25', 'Sep-25']
 *
 * getFiscalHalfMonths('2025LH')
 * // ['Oct-25', 'Nov-25', 'Dec-25', 'Jan-26', 'Feb-26', 'Mar-26']
 */
export function getFiscalHalfMonths(fiscalLabel: string): string[] {
  const parsed = parseFiscalLabel(fiscalLabel)
  if (!parsed) return []

  const { fiscalYear, fiscalHalf } = parsed
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  if (fiscalHalf === 'FH') {
    // Apr(3) to Sep(8)
    return [3, 4, 5, 6, 7, 8].map(m => `${monthNames[m]}-${String(fiscalYear).slice(2)}`)
  }
  // LH: Oct(9), Nov(10), Dec(11) of fiscalYear; Jan(0), Feb(1), Mar(2) of fiscalYear+1
  const fy2 = String(fiscalYear).slice(2)
  const fy2next = String(fiscalYear + 1).slice(2)
  return [
    `${monthNames[9]}-${fy2}`, `${monthNames[10]}-${fy2}`, `${monthNames[11]}-${fy2}`,
    `${monthNames[0]}-${fy2next}`, `${monthNames[1]}-${fy2next}`, `${monthNames[2]}-${fy2next}`
  ]
}

/**
 * Check if a date falls within a given fiscal label's range.
 */
export function isDateInFiscalPeriod(date: Date | string | number, fiscalLabel: string): boolean {
  const parsed = parseFiscalLabel(fiscalLabel)
  if (!parsed) return false

  const range = getFiscalHalfRange(parsed.fiscalYear, parsed.fiscalHalf)
  const d = toDate(date)
  return d >= range.startDate && d <= range.endDate
}

// ────────────────────────────────────────
// Internal Helpers
// ────────────────────────────────────────

function toDate(input: Date | string | number): Date {
  if (input instanceof Date) return input
  if (typeof input === 'number') return new Date(input)
  return new Date(input)
}

function endOfDay(date: Date): Date {
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    23, 59, 59, 999
  ))
}
