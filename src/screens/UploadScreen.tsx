import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UploadCloud, ArrowRight, X, AlertCircle, Check, LockKeyhole, MapPin, ShieldCheck, Smartphone, FileText } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import FilePreview from '../components/FilePreview'
import { useSessionStore } from '../store/sessionStore'
import { ACCEPTED_EXTENSIONS, validateDocumentFile } from '../lib/documentValidation'
import { apiClient } from '../lib/apiClient'
import WorkflowHeader from '../components/WorkflowHeader'

pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

async function extractPdfInfo(file: File): Promise<{ pageCount: number; previewUrl: string }> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf         = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const pageCount   = pdf.numPages
  const page        = await pdf.getPage(1)
  const viewport    = page.getViewport({ scale: 1.5 })
  const canvas      = document.createElement('canvas')
  canvas.width      = viewport.width
  canvas.height     = viewport.height
  const ctx         = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport }).promise
  const previewUrl  = canvas.toDataURL('image/png')
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
      let pageCount = 1
      if (ext === 'pdf') {
        const info = await extractPdfInfo(file)
        pageCount   = info.pageCount
        previewUrl  = info.previewUrl
      } else if (['jpg','jpeg','png'].includes(ext)) {
        previewUrl  = URL.createObjectURL(file)
        pageCount   = 1
      } else {
        pageCount = 0
      }
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

  const FORMATS = ['PDF', 'DOCX', 'PPTX', 'XLSX', 'TIFF', 'JPG / PNG']

  return (
    <div className="min-h-screen text-ink flex flex-col screen-enter"
      style={{ background: 'linear-gradient(180deg, #091525 0%, #0f1923 100%)' }}>

      {/* Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="orb orb-purple" style={{ width: 450, height: 450, top: '-8%', right: '-5%', opacity: 0.5 }} />
        <div className="orb orb-teal" style={{ width: 300, height: 300, bottom: '5%', left: '-4%', opacity: 0.45 }} />
        <div className="dot-grid absolute inset-0 opacity-20" />
      </div>

      <WorkflowHeader step="upload" />

      <div className="relative z-10 flex-1 flex flex-col items-center px-4 py-8 max-w-5xl mx-auto w-full gap-7 sm:px-6 sm:py-12 lg:py-16">

        {/* Title */}
        <div className="w-full flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.26em] text-gradient-teal">Step 01 / Start here</p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl" style={{ fontFamily: 'Syne, sans-serif' }}>
              Bring your work
              <br /><span className="text-gradient-brand">to life.</span>
            </h1>
            <p className="mt-3 text-sm text-ink-muted">
              PDF, Office, OpenDocument, images · up to {pricing.maxFileMb} MB
            </p>
            {selectedPrinterName && (
              <div className="mt-4 inline-flex max-w-full items-center gap-2 glass-brand rounded-2xl px-4 py-2 text-xs font-bold text-brand-light">
                <MapPin size={13} className="shrink-0" />
                <span className="truncate">Printing at {selectedPrinterName}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-ink-muted">
            <LockKeyhole size={15} className="text-accent-teal" /> Deleted after printing
          </div>
        </div>

        {/* Drop zone / Preview */}
        {!stagedFile ? (
          <div
            className={`w-full rounded-3xl flex flex-col items-center justify-center gap-5 py-16 px-8 cursor-pointer transition-all duration-300 min-h-[360px] relative overflow-hidden
              ${isDragging
                ? 'scale-[1.01]'
                : 'hover:scale-[1.005]'
              }`}
            style={{
              background: isDragging
                ? 'rgba(108,99,255,0.12)'
                : 'rgba(255,255,255,0.03)',
              border: isDragging
                ? '2px dashed rgba(108,99,255,0.70)'
                : '2px dashed rgba(255,255,255,0.12)',
              boxShadow: isDragging ? '0 0 40px rgba(108,99,255,0.20), inset 0 0 40px rgba(108,99,255,0.08)' : 'none',
            }}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            aria-label="Choose a file to upload"
          >
            <input ref={inputRef} type="file" className="hidden"
              accept={ACCEPTED_EXTENSIONS.map(e => `.${e}`).join(',')}
              onChange={handleInputChange} />

            {/* Glowing circle */}
            <div className={`relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-300
              ${isDragging ? 'shadow-glow-brand' : ''}`}
              style={{ background: isDragging ? 'linear-gradient(135deg, #6C63FF, #FF3CAC)' : 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.35)' }}>
              <UploadCloud size={38} strokeWidth={1.5} className={isDragging ? 'text-white' : 'text-brand'} />
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand/30 border-t-brand" />
                <p className="text-ink-muted text-sm font-medium">Reading file…</p>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-ink font-extrabold text-xl">Drop your document here</p>
                  <p className="text-ink-muted text-sm mt-2">or choose a file from this device</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                  className="btn-primary shine-on-hover relative flex items-center gap-2 touch-target">
                  Choose file <ArrowRight size={16} />
                </button>
                <div className="flex flex-wrap gap-2 justify-center">
                  {FORMATS.map((t) => (
                    <span key={t} className="glass rounded-full px-3 py-1.5 text-[10px] text-ink-dim font-bold tracking-[0.12em] flex items-center gap-1.5">
                      <FileText size={10} /> {t}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold uppercase tracking-[0.14em] text-xs text-gradient-teal">Selected file</p>
              <button onClick={handleClear}
                className="flex items-center gap-1.5 text-ink-muted hover:text-red-400 text-sm transition-colors touch-target"
                aria-label="Remove selected file">
                <X size={15} /> Remove
              </button>
            </div>
            <div className="glass rounded-2xl overflow-hidden">
              <FilePreview file={stagedFile} previewUrl={stagedPreviewUrl} parsedPageCount={stagedPageCount} />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="w-full flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 animate-slide-up">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Continue button */}
        {stagedFile && (
          <button onClick={handleContinue} disabled={loading}
            className="btn-primary shine-on-hover relative w-full flex items-center justify-center gap-3 py-5 text-base animate-slide-up disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? (
              <><span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> Uploading securely…</>
            ) : (
              <>Continue to Print Options <ArrowRight size={22} /></>
            )}
          </button>
        )}

        {/* Trust chips */}
        <div className="grid w-full gap-3 border-t border-white/08 pt-6 text-xs font-medium text-ink-muted sm:grid-cols-3">
          <span className="flex items-center gap-2">
            <ShieldCheck size={15} className="text-accent-teal" /> Private file handling
          </span>
          <span className="flex items-center gap-2">
            <Check size={15} className="text-brand" /> Clear pricing before payment
          </span>
          <span className="flex items-center gap-2">
            <Smartphone size={15} className="text-accent-orange" /> Upload from your phone
          </span>
        </div>
      </div>
    </div>
  )
}
