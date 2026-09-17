export const ACCEPTED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
  'jpg', 'jpeg', 'png', 'txt',
] as const

const ACCEPTED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'text/plain',
])

const OFFICE_EXTENSIONS = new Set(['docx', 'pptx', 'xlsx'])

export interface DocumentValidationResult {
  extension: string
  bytes: Uint8Array
}

export async function validateDocumentFile(
  file: File,
  maxFileMb: number,
): Promise<DocumentValidationResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (!ACCEPTED_EXTENSIONS.includes(extension as typeof ACCEPTED_EXTENSIONS[number])) {
    throw new Error(`"${extension || 'unknown'}" files are not supported.`)
  }

  if (file.size === 0) throw new Error('The selected file is empty.')
  if (file.size > maxFileMb * 1024 * 1024) {
    throw new Error(`File too large. Maximum allowed size is ${maxFileMb} MB.`)
  }

  if (file.type && !ACCEPTED_MIME.has(file.type)) {
    throw new Error('Unsupported file type. Please check the file and try again.')
  }

  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  const isZipOffice = bytes[0] === 0x50 && bytes[1] === 0x4b
  const isPlainText = extension === 'txt' && !bytes.includes(0)

  const signatureMatches =
    (extension === 'pdf' && isPdf) ||
    (['jpg', 'jpeg'].includes(extension) && isJpeg) ||
    (extension === 'png' && isPng) ||
    (OFFICE_EXTENSIONS.has(extension) && isZipOffice) ||
    (['doc', 'ppt', 'xls'].includes(extension)) ||
    isPlainText

  if (!signatureMatches) {
    throw new Error('The file contents do not match its extension or may be corrupted.')
  }

  return { extension, bytes }
}
