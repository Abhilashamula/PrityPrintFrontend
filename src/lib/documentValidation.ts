export const ACCEPTED_EXTENSIONS = [
  'pdf', 'jpg', 'jpeg', 'png', 'tif', 'tiff',
  'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx',
  'odt', 'odp', 'ods', 'rtf',
] as const

const ACCEPTED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.presentation',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/rtf',
  'text/rtf',
])

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
  const isTiff = (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0) ||
    (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0 && bytes[3] === 0x2a)
  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04
  const isOle = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0
  const isRtf = bytes[0] === 0x7b && bytes[1] === 0x5c && bytes[2] === 0x72 && bytes[3] === 0x74 && bytes[4] === 0x66
  const zipOffice = ['docx', 'pptx', 'xlsx', 'odt', 'odp', 'ods'].includes(extension)
  const legacyOffice = ['doc', 'ppt', 'xls'].includes(extension)
  const signatureMatches =
    (extension === 'pdf' && isPdf) ||
    (['jpg', 'jpeg'].includes(extension) && isJpeg) ||
    (extension === 'png' && isPng) ||
    (['tif', 'tiff'].includes(extension) && isTiff) ||
    (zipOffice && isZip) ||
    (legacyOffice && isOle) ||
    (extension === 'rtf' && isRtf)

  if (!signatureMatches) {
    throw new Error('The file contents do not match its extension or may be corrupted.')
  }

  return { extension, bytes }
}
