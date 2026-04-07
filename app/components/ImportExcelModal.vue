<script setup lang="ts">
import * as XLSX from 'xlsx'

interface ImportColumn {
  key: string
  label: string
  required: boolean
}

interface ParsedPreviewRow {
  rowNumber: number
  values: Record<string, string>
  isValid: boolean
  error: string | null
}

const props = defineProps<{
  open: boolean
  columns: ImportColumn[]
  validateRow?: (row: Record<string, unknown>) => string | null
}>()

const emit = defineEmits<{
  close: []
  import: [rows: Record<string, unknown>[]]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const parseError = ref('')
const missingRequiredColumns = ref<string[]>([])
const previewRows = ref<ParsedPreviewRow[]>([])

const validCount = computed(() => previewRows.value.filter(row => row.isValid).length)
const invalidCount = computed(() => previewRows.value.length - validCount.value)

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getHeaderAliases(column: ImportColumn) {
  return [normalizeHeader(column.key), normalizeHeader(column.label)]
}

function detectHeaderRow(sheetRows: string[][]) {
  let bestIndex = 0
  let bestScore = -1

  const maxScanRows = Math.min(sheetRows.length, 10)
  for (let rowIndex = 0; rowIndex < maxScanRows; rowIndex++) {
    const row = sheetRows[rowIndex] ?? []
    const normalizedCells = row.map(cell => normalizeHeader(String(cell ?? '')))

    const score = props.columns.reduce((count, column) => {
      const aliases = getHeaderAliases(column)
      const matched = normalizedCells.some(cell => aliases.includes(cell))
      return matched ? count + 1 : count
    }, 0)

    if (score > bestScore) {
      bestScore = score
      bestIndex = rowIndex
    }
  }

  return bestIndex
}

function mapColumnIndexes(headers: string[]) {
  const normalizedHeaders = headers.map(header => normalizeHeader(String(header ?? '')))

  return props.columns.reduce<Record<string, number | undefined>>((acc, column) => {
    const aliases = getHeaderAliases(column)
    const columnIndex = normalizedHeaders.findIndex(header => aliases.includes(header))
    acc[column.key] = columnIndex >= 0 ? columnIndex : undefined
    return acc
  }, {})
}

function buildPreviewRows(rows: string[][], columnIndexes: Record<string, number | undefined>) {
  return rows
    .map((row, rowOffset) => {
      const mappedRow = props.columns.reduce<Record<string, string>>((acc, column) => {
        const columnIndex = columnIndexes[column.key]
        const rawValue = typeof columnIndex === 'number' ? row[columnIndex] : ''
        acc[column.key] = String(rawValue ?? '').trim()
        return acc
      }, {})

      const errors: string[] = []

      for (const requiredColumn of props.columns.filter(column => column.required)) {
        if (!mappedRow[requiredColumn.key]) {
          errors.push(`${requiredColumn.label} wajib diisi`)
        }
      }

      if (missingRequiredColumns.value.length > 0) {
        errors.push(`Kolom wajib tidak ditemukan: ${missingRequiredColumns.value.join(', ')}`)
      }

      if (props.validateRow) {
        const customError = props.validateRow(mappedRow)
        if (customError) {
          errors.push(customError)
        }
      }

      return {
        rowNumber: rowOffset + 1,
        values: mappedRow,
        isValid: errors.length === 0,
        error: errors.length > 0 ? errors.join(' | ') : null
      }
    })
    .filter(row => Object.values(row.values).some(value => value.length > 0))
}

async function parseFile(file: File) {
  parseError.value = ''
  previewRows.value = []
  missingRequiredColumns.value = []
  fileName.value = file.name

  const isExcelFile = /\.(xlsx|xls)$/i.test(file.name)
  if (!isExcelFile) {
    parseError.value = 'Format file tidak didukung. Gunakan .xlsx atau .xls.'
    return
  }

  try {
    const fileBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(fileBuffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
      parseError.value = 'Sheet tidak ditemukan di file Excel.'
      return
    }

    const sheet = workbook.Sheets[firstSheetName]
    if (!sheet) {
      parseError.value = 'Sheet tidak ditemukan di file Excel.'
      return
    }
    const allRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false
    })

    if (!allRows.length) {
      parseError.value = 'File Excel kosong.'
      return
    }

    const headerRowIndex = detectHeaderRow(allRows)
    const headerRow = allRows[headerRowIndex] ?? []
    const dataRows = allRows.slice(headerRowIndex + 1)

    const columnIndexes = mapColumnIndexes(headerRow)

    missingRequiredColumns.value = props.columns
      .filter(column => column.required && typeof columnIndexes[column.key] !== 'number')
      .map(column => column.label)

    previewRows.value = buildPreviewRows(dataRows, columnIndexes)

    if (!previewRows.value.length) {
      parseError.value = 'Tidak ada data baris yang bisa dipreview.'
    }
  } catch {
    parseError.value = 'Gagal membaca file Excel. Pastikan format file valid.'
  }
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  await parseFile(file)
}

async function handleDrop(event: DragEvent) {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  await parseFile(file)
}

function triggerFileInput() {
  fileInput.value?.click()
}

function resetState() {
  fileName.value = ''
  parseError.value = ''
  missingRequiredColumns.value = []
  previewRows.value = []
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function handleClose() {
  resetState()
  emit('close')
}

function confirmImport() {
  const validRows = previewRows.value
    .filter(row => row.isValid)
    .map(row => row.values as Record<string, unknown>)

  emit('import', validRows)
  handleClose()
}

watch(() => props.open, (isOpen) => {
  if (!isOpen) {
    resetState()
  }
})
</script>

<template>
  <UModal
    :open="open"
    :ui="{
      content: 'bg-[#0a0a0a] border border-white/10 rounded-3xl max-w-5xl w-full',
      overlay: 'bg-black/80 backdrop-blur-sm'
    }"
    @close="handleClose"
  >
    <template #content>
      <div class="p-6 md:p-8 space-y-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-[10px] font-black uppercase tracking-[0.28em] text-white/30">
              Notification Master
            </p>
            <h3 class="mt-2 text-2xl font-black italic text-white">
              Import Excel
            </h3>
            <p class="mt-2 text-sm text-white/55">
              Upload file .xlsx/.xls, review validasi, lalu import baris valid.
            </p>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            @click="handleClose"
          />
        </div>

        <div
          v-if="previewRows.length === 0"
          class="space-y-4"
        >
          <div
            class="cursor-pointer rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] p-10 text-center transition-all hover:border-amber-400/50 hover:bg-white/[0.04]"
            @click="triggerFileInput"
            @dragover.prevent
            @drop="handleDrop"
          >
            <input
              ref="fileInput"
              type="file"
              accept=".xlsx,.xls"
              class="hidden"
              @change="handleFileChange"
            >
            <p class="text-sm font-semibold text-white">
              Drag & drop file Excel di sini
            </p>
            <p class="mt-2 text-xs text-white/45">
              atau klik untuk pilih file (.xlsx / .xls)
            </p>
          </div>

          <div
            v-if="fileName"
            class="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/65"
          >
            File: <span class="font-semibold text-white">{{ fileName }}</span>
          </div>

          <div
            v-if="parseError"
            class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            {{ parseError }}
          </div>

          <div class="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
            <p class="text-[11px] font-black uppercase tracking-[0.2em] text-white/35">
              Expected Columns
            </p>
            <div class="mt-3 flex flex-wrap gap-2">
              <span
                v-for="column in columns"
                :key="column.key"
                class="rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                :class="column.required ? 'border-amber-400/35 bg-amber-400/10 text-amber-300' : 'border-white/10 bg-white/5 text-white/55'"
              >
                {{ column.label }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-else
          class="space-y-4"
        >
          <div class="flex flex-wrap items-center gap-3 text-sm">
            <span class="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">
              {{ validCount }} valid
            </span>
            <span class="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-red-300">
              {{ invalidCount }} invalid
            </span>
            <span
              v-if="missingRequiredColumns.length > 0"
              class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-300"
            >
              Missing: {{ missingRequiredColumns.join(', ') }}
            </span>
          </div>

          <div class="max-h-[420px] overflow-auto rounded-2xl border border-white/10">
            <table class="w-full min-w-[920px] text-left">
              <thead class="sticky top-0 bg-[#0f0f0f]">
                <tr class="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  <th class="px-4 py-3">
                    Row
                  </th>
                  <th
                    v-for="column in columns"
                    :key="column.key"
                    class="px-4 py-3"
                  >
                    {{ column.label }}
                  </th>
                  <th class="px-4 py-3">
                    Status
                  </th>
                  <th class="px-4 py-3">
                    Error
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                <tr
                  v-for="row in previewRows"
                  :key="`row-${row.rowNumber}`"
                  :class="row.isValid ? 'bg-emerald-500/[0.03]' : 'bg-red-500/[0.04]'"
                >
                  <td class="px-4 py-3 text-xs text-white/45">
                    {{ row.rowNumber }}
                  </td>
                  <td
                    v-for="column in columns"
                    :key="`${row.rowNumber}-${column.key}`"
                    class="px-4 py-3 text-xs text-white/80"
                  >
                    {{ row.values[column.key] || '-' }}
                  </td>
                  <td
                    class="px-4 py-3 text-xs font-semibold"
                    :class="row.isValid ? 'text-emerald-300' : 'text-red-300'"
                  >
                    {{ row.isValid ? 'VALID' : 'INVALID' }}
                  </td>
                  <td class="px-4 py-3 text-xs text-red-300">
                    {{ row.error || '-' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              @click="resetState"
            >
              Reset
            </UButton>
            <UButton
              color="primary"
              :disabled="validCount === 0"
              @click="confirmImport"
            >
              Import {{ validCount }} Rows
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
