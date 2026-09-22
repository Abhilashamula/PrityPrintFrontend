import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, ArrowRight, X, AlertCircle, Check, FileText, LockKeyhole, MapPin, ShieldCheck, Smartphone } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import FilePreview from '../components/FilePreview'
import { useSessionStore } from '../store/sessionStore'
import { ACCEPTED_EXTENSIONS, validateDocumentFile } from '../lib/documentValidation'
import AccountMenu from '../components/AccountMenu'
import { apiClient } from '../lib/apiClient'

// Use CDN worker to avoid Vite worker bundling issues
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

async function extractPdfInfo(file: File): Promise<{ pageCount: number; previewUrl: string }> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf         = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageCount   = pdf.numPages

  // Render page 1 to canvas → data URL
  const page     = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: 1.5 })
  const canvas   = document.createElement('canvas')
  canvas.width   = viewport.width
  canvas.height  = viewport.height
  const ctx      = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
  const previewUrl = canvas.toDataURL('image/png')

  return { pageCount, previewUrl }
}

export default function UploadScreen() {
  const navigate   = useNavigate()
  const setFile    = useSessionStore((s) => s.setFile)
  const setDocumentId = useSessionStore((s) => s.setDocumentId)
  const pricing    = useSessionStore((s) => s.pricing)
  const selectedPrinterId = useSessionStore((s) => s.selectedPrinterId)
  const selectedPrinterName = useSessionStore((s) => s.selectedPrinterName)

  const [isDragging, setIsDragging] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)

  // Preview state (before committing to store)
  const [stagedFile,       setStagedFile]       = useState<File | null>(null)
  const [stagedPreviewUrl, setStagedPreviewUrl] = useState<string | null>(null)
  const [stagedPageCount,  setStagedPageCount]  = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!selectedPrinterId) navigate('/', { replace: true })
  }, [navigate, selectedPrinterId])

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setLoading(true)
    setStagedFile(null)
    setStagedPreviewUrl(null)
    setStagedPageCount(0)

    try {
      const { extension: ext } = await validateDocumentFile(file, pricing.maxFileMb)
      let previewUrl: string | null = null
      let pageCount = 1   // Default for non-PDFs

      if (ext === 'pdf') {
        const info  = await extractPdfInfo(file)
        pageCount   = info.pageCount
        previewUrl  = info.previewUrl
      } else if (['jpg','jpeg','png'].includes(ext)) {
        previewUrl  = URL.createObjectURL(file)
        pageCount   = 1
      }
      // DOC/DOCX etc.: pageCount remains 1 (server will verify actual count)

      setStagedFile(file)
      setStagedPreviewUrl(previewUrl)
      setStagedPageCount(pageCount)
    } catch (err) {
      console.error(err)
      setError('Could not read the file. It may be corrupted or password-protected.')
    } finally {
      setLoading(false)
    }
  }, [pricing.maxFileMb])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
    // Reset so the same file can be re-selected
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void processFile(file)
  }

  const handleContinue = async () => {
    if (!stagedFile) return
    setLoading(true)
    setError(null)
    try {
      const document = await apiClient.uploadDocument(stagedFile)
      setDocumentId(document.id)
      setFile(stagedFile, stagedPreviewUrl, document.pageCount)
      navigate('/options')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not upload the document.')
    } finally { setLoading(false) }
  }

  const handleClear = () => {
    if (stagedPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(stagedPreviewUrl)
    setStagedFile(null)
    setStagedPreviewUrl(null)
    setStagedPageCount(0)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-lux-paper text-lux-ink flex flex-col screen-enter">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-lux-ink/10 bg-lux-paper lg:px-10">
        <a href="/" className="flex items-center gap-3" aria-label="Ping and Print home">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-lux-ink text-lux-paper"><FileText size={20} strokeWidth={1.6} /></span>
          <span className="leading-none"><span className="block text-lg font-extrabold tracking-[-0.06em]">Ping<span className="text-lux-copper">&amp;</span>Print</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.16em] text-lux-ink/50">Campus printing</span></span>
        </a>
        <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-lux-ink/45 sm:gap-4">
          <span className="flex items-center gap-2 text-lux-ink"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-lux-copper text-white">1</span><span className="hidden sm:inline">Upload</span></span>
          <span className="text-lux-ink/20">/</span><span>Options</span><span className="text-lux-ink/20">/</span><span>Pay</span>
          <AccountMenu />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col items-center px-6 py-12 max-w-5xl mx-auto w-full gap-8 lg:py-16">
        <div className="w-full flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-3 text-xs font-extrabold uppercase tracking-[0.25em] text-lux-copper">Step 01 / Start here</p><h1 className="font-display text-5xl font-semibold leading-none text-lux-ink sm:text-6xl">Bring your work<br /><em className="text-lux-copper">to life.</em></h1><p className="mt-4 text-sm text-lux-ink/60">PDF, Word, PowerPoint, Excel, JPG, PNG · up to {pricing.maxFileMb} MB</p>{selectedPrinterName && <div className="mt-4 inline-flex max-w-full items-center gap-2 border border-lux-copper/30 bg-white px-3 py-2 text-xs font-bold text-lux-ink"><MapPin size={14} className="shrink-0 text-lux-copper" /><span className="truncate">Printing at {selectedPrinterName}</span></div>}</div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-lux-ink/55"><LockKeyhole size={16} className="text-lux-copper" /> Deleted after printing</div>
        </div>

        {/* Drop zone / preview */}
        {!stagedFile ? (
          <div
            className={`w-full border flex flex-col items-center justify-center gap-5 py-16 px-8 cursor-pointer transition-all duration-300
                        min-h-[360px] relative overflow-hidden
                        ${isDragging
                          ? 'border-lux-copper bg-white scale-[1.01] shadow-xl'
                          : 'border-lux-ink/15 bg-white/70 hover:border-lux-copper hover:bg-white hover:shadow-xl'
                        }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            aria-label="Choose a file to upload"
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={ACCEPTED_EXTENSIONS.map(e => `.${e}`).join(',')}
              onChange={handleInputChange}
            />
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-colors
                            ${isDragging ? 'bg-lux-copper text-white' : 'bg-lux-ink text-lux-paper'}`}>
              <UploadCloud size={34} strokeWidth={1.4} />
            </div>
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-pp-blue border-t-transparent rounded-full animate-spin" />
                <p className="text-pp-gray text-sm">Reading file…</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-lux-ink font-extrabold text-xl">Drop your document here</p>
                  <p className="text-lux-ink/55 text-sm mt-2">or choose a file from this device</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                  className="bg-lux-ink hover:bg-lux-copper text-white font-extrabold px-8 py-4
                             touch-target text-sm uppercase tracking-[0.12em] transition-colors"
                >
                  Choose file <ArrowRight size={16} className="ml-2 inline" />
                </button>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {['PDF', 'DOCX', 'PPTX', 'XLSX', 'JPG', 'PNG'].map((t) => (
                    <span key={t} className="border border-lux-ink/10 bg-lux-paper px-3 py-1.5 text-[10px] text-lux-ink/60 font-extrabold tracking-[0.12em]">
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full">
            <div className="flex items-center justify-between mb-3">
              <p className="font-extrabold uppercase tracking-[0.14em] text-xs text-lux-ink">Selected file</p>
              <button
                onClick={handleClear}
                className="flex items-center gap-1 text-lux-ink/55 hover:text-red-500 text-sm transition-colors touch-target"
                aria-label="Remove selected file"
              >
                <X size={16} /> Remove
              </button>
            </div>
            <FilePreview
              file={stagedFile}
              previewUrl={stagedPreviewUrl}
              parsedPageCount={stagedPageCount}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="w-full flex items-start gap-3 bg-red-50 border border-red-200 px-4 py-3">
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Continue button */}
        {stagedFile && (
          <button
            onClick={handleContinue}
            className="w-full bg-lux-ink hover:bg-lux-copper text-white font-extrabold
                       text-base py-5 touch-target flex items-center justify-center gap-3
                       transition-colors animate-slide-up shadow-lg uppercase tracking-[0.12em]"
          >
            {loading ? 'Uploading securely...' : 'Continue to Print Options'}
            <ArrowRight size={24} />
          </button>
        )}
        <div className="grid w-full gap-3 border-t border-lux-ink/10 pt-6 text-xs text-lux-ink/55 sm:grid-cols-3">
          <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-lux-copper" /> Private file handling</span>
          <span className="flex items-center gap-2"><Check size={16} className="text-lux-copper" /> Clear pricing before payment</span>
          <span className="flex items-center gap-2"><Smartphone size={16} className="text-lux-copper" /> Upload from your phone</span>
        </div>
      </div>
    </div>
  )
}

