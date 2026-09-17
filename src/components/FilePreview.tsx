import { FileText, Image, Table, Presentation, File } from 'lucide-react'

interface FilePreviewProps {
  file:            File
  previewUrl:      string | null
  parsedPageCount: number
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext))
    return <Image size={32} className="text-lux-copper" />
  if (['xls', 'xlsx', 'csv'].includes(ext))
    return <Table size={32} className="text-green-600" />
  if (['ppt', 'pptx'].includes(ext))
    return <Presentation size={32} className="text-lux-copper" />
  if (['doc', 'docx', 'txt'].includes(ext))
    return <FileText size={32} className="text-lux-ink" />
  if (ext === 'pdf')
    return <FileText size={32} className="text-lux-copper" />
  return <File size={32} className="text-lux-ink/50" />
}

export default function FilePreview({ file, previewUrl, parsedPageCount }: FilePreviewProps) {
  return (
    <div className="border border-lux-ink/15 bg-white shadow-xl overflow-hidden animate-slide-up">
      {/* Preview image / canvas fallback */}
      <div className="bg-[#E8E7D9] flex items-center justify-center h-48 relative">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Document first page preview"
            className="max-h-full max-w-full object-contain rounded"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-60">
            <FileIcon name={file.name} />
            <span className="text-xs text-lux-ink/55">No preview available</span>
          </div>
        )}
        {/* Page count badge */}
        {parsedPageCount > 0 && (
          <span className="absolute bottom-3 right-3 bg-lux-ink text-white text-xs font-semibold px-3 py-1.5">
            {parsedPageCount} {parsedPageCount === 1 ? 'page' : 'pages'}
          </span>
        )}
      </div>

      {/* File meta */}
      <div className="px-5 py-4 flex items-center gap-3">
        <FileIcon name={file.name} />
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-lux-ink text-sm truncate">{file.name}</p>
          <p className="text-lux-ink/55 text-xs mt-0.5">{formatBytes(file.size)}</p>
        </div>
      </div>
    </div>
  )
}

