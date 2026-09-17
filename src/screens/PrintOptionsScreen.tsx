
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Crop,
  FileText,
  LayoutTemplate,
  ListFilter,
  Minus,
  Palette,
  Plus,
  RectangleHorizontal,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react'

import { useSessionStore } from '../store/sessionStore'
import { validatePageRange } from '../lib/pageRangeParser'
import ImageCropper from '../components/ImageCropper'
import FilePreview from '../components/FilePreview'
import AccountMenu from '../components/AccountMenu'

function OptionCard<T extends string>({
  value,
  current,
  onSelect,
  label,
  description,
  icon,
}: {
  value: T
  current: T
  onSelect: (value: T) => void
  label: string
  description?: string
  icon: React.ReactNode
}) {
  const active = value === current

  return (
    <button
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={`
        group
        relative
        flex
        min-h-[82px]
        flex-1
        items-center
        gap-4
        rounded-[20px]
        border
        p-4
        text-left
        transition-all
        duration-200
        hover:-translate-y-0.5

        md:min-h-[92px]
        md:flex-row
        md:items-center
        md:justify-start
        md:gap-4

        ${
          active
            ? 'border-lux-ink bg-lux-ink text-lux-paper shadow-[0_14px_30px_rgba(23,33,31,0.16)]'
            : 'border-lux-ink/10 bg-white/75 text-lux-ink hover:border-lux-copper/50 hover:bg-white hover:shadow-[0_10px_24px_rgba(23,33,31,0.06)]'
        }
      `}
    >
      <span
        className={`
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-[14px]

          ${
            active
              ? 'bg-lux-copper text-white'
              : 'bg-lux-paper text-lux-copper'
          }
        `}
      >
        {icon}
      </span>

      <span className="min-w-0">
        <span className="block text-[15px] font-extrabold leading-5">
          {label}
        </span>

        {description && (
          <span
            className={`
              mt-1.5
              block
              text-xs
              leading-5

              ${
                active
                  ? 'text-lux-paper/60'
                  : 'text-lux-ink/50'
              }
            `}
          >
            {description}
          </span>
        )}
      </span>

      {active && (
        <Check
          size={17}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-lux-copper"
        />
      )}
    </button>
  )
}

export default function PrintOptionsScreen() {
  const navigate = useNavigate()

  const file = useSessionStore((state) => state.file)
  const filePreviewUrl = useSessionStore(
    (state) => state.filePreviewUrl
  )
  const setFile = useSessionStore((state) => state.setFile)
  const parsedPageCount = useSessionStore(
    (state) => state.parsedPageCount
  )
  const printOptions = useSessionStore(
    (state) => state.printOptions
  )
  const setPrintOptions = useSessionStore(
    (state) => state.setPrintOptions
  )
  const totalPages = useSessionStore(
    (state) => state.totalPages
  )
  const totalCost = useSessionStore(
    (state) => state.totalCost
  )
  const pricing = useSessionStore(
    (state) => state.pricing
  )

  const [rangeError, setRangeError] = useState<string | null>(null)
  const [isCropEditorOpen, setIsCropEditorOpen] = useState(true)

  useEffect(() => {
    if (!file) {
      navigate('/upload', { replace: true })
    }
  }, [file, navigate])

  const updateOption = <
    K extends keyof typeof printOptions
  >(
    key: K,
    value: (typeof printOptions)[K]
  ) => {
    setPrintOptions({
      [key]: value,
    })
  }

  const handleRangeChange = (value: string) => {
    setPrintOptions({
      customPageRange: value,
    })

    setRangeError(
      value.trim()
        ? validatePageRange(value, parsedPageCount)
        : null
    )
  }

  const canContinue =
    printOptions.pageRange === 'all' ||
    (!rangeError &&
      Boolean(printOptions.customPageRange.trim()))

  const summary = [
    ['File', file?.name ?? '—'],
    ['Pages', `${parsedPageCount} total`],
    ['Paper size', `Fit to ${printOptions.paperSize}`],
    ['Copies', String(printOptions.copies)],
    [
      'Orientation',
      printOptions.orientation === 'portrait'
        ? 'Portrait'
        : 'Landscape',
    ],
    [
      'Sides',
      printOptions.sides === 'single'
        ? 'Single-sided'
        : 'Double-sided',
    ],
    [
      'Color',
      printOptions.colorMode === 'bw'
        ? 'Black & White'
        : 'Color',
    ],
    [
      'Range',
      printOptions.pageRange === 'all'
        ? 'All pages'
        : printOptions.customPageRange || '—',
    ],
  ]

  const isImageFile = Boolean(
    file && ['jpg', 'jpeg', 'png'].includes(
      file.name.split('.').pop()?.toLowerCase() ?? ''
    )
  )

  const handleCropApply = (croppedFile: File, previewUrl: string) => {
    if (filePreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(filePreviewUrl)
    }
    setFile(croppedFile, previewUrl, parsedPageCount)
    setIsCropEditorOpen(false)
  }

  return (
    <main className="min-h-screen bg-lux-paper text-lux-ink screen-enter">

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-lux-ink/10 bg-lux-paper/95 px-4 py-3 backdrop-blur-md sm:px-8 sm:py-4">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4">

          <button
            onClick={() => navigate('/upload')}
            className="touch-target flex items-center gap-2 text-sm font-bold text-lux-ink/60 transition-colors hover:text-lux-ink"
            aria-label="Back to upload"
          >
            <ArrowLeft size={18} />

            <span className="hidden sm:inline">
              Back
            </span>
          </button>

          <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.14em] sm:gap-3 sm:text-xs">
            <span className="text-lux-ink/30">
              Upload
            </span>

            <span className="text-lux-copper">
              /
            </span>

            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lux-copper text-white">
              2
            </span>

            <span>
              Options
            </span>

            <span className="text-lux-ink/20">
              /
            </span>

            <span className="text-lux-ink/30">
              Pay
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold text-lux-ink/50">
            <ShieldCheck
              size={16}
              className="text-lux-copper"
            />

            <span className="hidden sm:inline">Secure session</span>
            <AccountMenu />
          </div>
        </div>
      </header>

      {/* Main layout */}
      <div
        className="
          mx-auto
          grid
          max-w-[1440px]
          gap-10
          px-4
          py-8
          pb-10

          sm:px-8
          sm:py-10

          md:grid-cols-[minmax(0,1fr)_380px]
          md:gap-12
          md:px-10
          md:pb-14

          xl:grid-cols-[minmax(0,1fr)_420px]
          xl:gap-16
          xl:px-12
        "
      >

        {/* Left side */}
        <section className="min-w-0">

          {/* Page title */}
          <div className="mb-8">
            <p className="mb-3 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-lux-copper">
              <Sparkles size={14} />
              Personalise your print
            </p>

            <h1 className="font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Print it your way.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-lux-ink/55 sm:text-base">
              Fine-tune the details before we prepare your order.
            </p>
          </div>

          <div className="mb-8">
            {isImageFile && filePreviewUrl && isCropEditorOpen ? (
              <ImageCropper
                file={file!}
                previewUrl={filePreviewUrl}
                onApply={handleCropApply}
              />
            ) : isImageFile && filePreviewUrl ? (
              <div>
                <FilePreview
                  file={file!}
                  previewUrl={filePreviewUrl}
                  parsedPageCount={parsedPageCount}
                />
                <button
                  type="button"
                  onClick={() => setIsCropEditorOpen(true)}
                  className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 border border-lux-ink/15 bg-white px-5 py-3 text-sm font-extrabold uppercase tracking-[0.1em] text-lux-ink transition-colors hover:border-lux-copper hover:text-lux-copper"
                >
                  <Crop size={17} />
                  Edit crop
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-3 border border-lux-ink/10 bg-white/70 p-5 text-sm text-lux-ink/60">
                <Crop size={18} className="mt-0.5 shrink-0 text-lux-copper" />
                <p>
                  Cropping is available for JPG, JPEG, and PNG files. This document format keeps its original page layout.
                </p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-7">

            {/* Copies */}
            <section className="border-b border-lux-ink/10 pb-7">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2 text-sm font-extrabold">
                  <Copy
                    size={18}
                    className="text-lux-copper"
                  />

                  Number of copies
                </h2>

                <span className="text-xs font-bold text-lux-ink/40">
                  Max 99
                </span>
              </div>

              <div className="flex w-full max-w-sm items-center justify-between rounded-2xl border border-lux-ink/10 bg-white p-2.5 shadow-sm">

                <button
                  onClick={() =>
                    updateOption(
                      'copies',
                      Math.max(
                        1,
                        printOptions.copies - 1
                      )
                    )
                  }
                  className="touch-target flex h-11 w-11 items-center justify-center rounded-xl bg-lux-paper text-lux-ink transition-colors hover:bg-lux-copper hover:text-white"
                  aria-label="Decrease copies"
                >
                  <Minus size={20} />
                </button>

                <span className="px-8 text-2xl font-extrabold">
                  {printOptions.copies}
                </span>

                <button
                  onClick={() =>
                    updateOption(
                      'copies',
                      Math.min(
                        99,
                        printOptions.copies + 1
                      )
                    )
                  }
                  className="touch-target flex h-11 w-11 items-center justify-center rounded-xl bg-lux-ink text-lux-paper transition-colors hover:bg-lux-copper"
                  aria-label="Increase copies"
                >
                  <Plus size={20} />
                </button>

              </div>
            </section>

            {/* Orientation */}
            <section className="border-b border-lux-ink/10 pb-7">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
                <RectangleHorizontal
                  size={18}
                  className="text-lux-copper"
                />

                Orientation
              </h2>

              <div className="flex flex-col gap-4 sm:flex-row">
                <OptionCard
                  value="portrait"
                  current={printOptions.orientation}
                  onSelect={(value) =>
                    updateOption(
                      'orientation',
                      value
                    )
                  }
                  label="Portrait"
                  description="Classic vertical page"
                  icon={
                    <FileText size={20} />
                  }
                />

                <OptionCard
                  value="landscape"
                  current={printOptions.orientation}
                  onSelect={(value) =>
                    updateOption(
                      'orientation',
                      value
                    )
                  }
                  label="Landscape"
                  description="Wide presentation"
                  icon={
                    <LayoutTemplate size={20} />
                  }
                />
              </div>
            </section>

            {/* Paper size */}
            <section className="border-b border-lux-ink/10 pb-7">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
                <FileText size={18} className="text-lux-copper" />
                Paper size
              </h2>

              <div className="flex flex-col gap-4 sm:flex-row">
                <OptionCard
                  value="A4"
                  current={printOptions.paperSize}
                  onSelect={(value) => updateOption('paperSize', value)}
                  label="A4"
                  description="Fit document to 210 × 297 mm"
                  icon={<FileText size={20} />}
                />

                <OptionCard
                  value="A6"
                  current={printOptions.paperSize}
                  onSelect={(value) => updateOption('paperSize', value)}
                  label="A6"
                  description="Fit document to 105 × 148 mm"
                  icon={<FileText size={20} />}
                />
              </div>

              <p className="mt-3 text-xs leading-5 text-lux-ink/45">
                The document will be scaled to fit the selected paper without cropping.
              </p>
            </section>

            {/* Sides */}
            <section className="border-b border-lux-ink/10 pb-7">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
                <LayoutTemplate
                  size={18}
                  className="text-lux-copper"
                />

                Sides
              </h2>

              <div className="flex flex-col gap-4 sm:flex-row">
                <OptionCard
                  value="single"
                  current={printOptions.sides}
                  onSelect={(value) =>
                    updateOption(
                      'sides',
                      value
                    )
                  }
                  label="Single-sided"
                  description="One side per sheet"
                  icon={
                    <FileText size={20} />
                  }
                />

                <OptionCard
                  value="double"
                  current={printOptions.sides}
                  onSelect={(value) =>
                    updateOption(
                      'sides',
                      value
                    )
                  }
                  label="Double-sided"
                  description="Save paper and space"
                  icon={
                    <Copy size={20} />
                  }
                />
              </div>
            </section>

            {/* Color mode */}
            <section className="border-b border-lux-ink/10 pb-7">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
                <Palette
                  size={18}
                  className="text-lux-copper"
                />

                Color mode
              </h2>

              <div className="flex flex-col gap-4 sm:flex-row">

                <OptionCard
                  value="bw"
                  current={printOptions.colorMode}
                  onSelect={(value) =>
                    updateOption(
                      'colorMode',
                      value
                    )
                  }
                  label={`B&W · ₹${pricing.bwPerPage}/page`}
                  description="Crisp and economical"
                  icon={
                    <span className="h-5 w-5 rounded-md bg-gradient-to-br from-zinc-700 to-zinc-300" />
                  }
                />

                <OptionCard
                  value="color"
                  current={printOptions.colorMode}
                  onSelect={(value) =>
                    updateOption(
                      'colorMode',
                      value
                    )
                  }
                  label={`Color · ₹${pricing.colorPerPage}/page`}
                  description="Bring ideas to life"
                  icon={
                    <span className="h-5 w-5 rounded-full bg-gradient-to-br from-lux-copper via-pink-400 to-amber-300" />
                  }
                />

              </div>
            </section>

            {/* Page range */}
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-extrabold">
                <ListFilter
                  size={18}
                  className="text-lux-copper"
                />

                Page range
              </h2>

              <div className="flex flex-col gap-4 sm:flex-row">

                <OptionCard
                  value="all"
                  current={printOptions.pageRange}
                  onSelect={(value) =>
                    updateOption(
                      'pageRange',
                      value
                    )
                  }
                  label={`All ${parsedPageCount} pages`}
                  description="Print the entire file"
                  icon={
                    <ListFilter size={20} />
                  }
                />

                <OptionCard
                  value="custom"
                  current={printOptions.pageRange}
                  onSelect={(value) =>
                    updateOption(
                      'pageRange',
                      value
                    )
                  }
                  label="Custom range"
                  description="Choose specific pages"
                  icon={
                    <ChevronDown size={20} />
                  }
                />

              </div>

              {printOptions.pageRange ===
                'custom' && (
                <div className="mt-5">

                  <input
                    type="text"
                    value={
                      printOptions.customPageRange
                    }
                    onChange={(event) =>
                      handleRangeChange(
                        event.target.value
                      )
                    }
                    placeholder="e.g. 1-5, 8, 10-12"
                    className={`
                      min-h-[56px]
                      w-full
                      rounded-2xl
                      border
                      bg-white
                      px-5
                      text-base
                      outline-none
                      transition-colors
                      placeholder:text-lux-ink/30
                      focus:border-lux-copper

                      ${
                        rangeError
                          ? 'border-red-300'
                          : 'border-lux-ink/15'
                      }
                    `}
                  />

                  {rangeError ? (
                    <p className="mt-2 text-sm text-red-500">
                      {rangeError}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs leading-5 text-lux-ink/45">
                      Separate pages with commas.
                      Maximum page:{' '}
                      {parsedPageCount}.
                    </p>
                  )}

                </div>
              )}
            </section>

          </div>
        </section>

        {/* Right sidebar */}
        <aside className="h-fit md:sticky md:top-24 md:self-start">

          {/* Estimate card */}
          <div className="overflow-hidden rounded-[26px] border border-lux-ink/10 bg-white shadow-[0_18px_50px_rgba(23,33,31,0.08)]">

            {/* Estimate header */}
            <div className="bg-lux-ink px-6 py-6 text-lux-paper">

              <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-lux-paper/55">
                Your estimate
              </p>

              <div className="mt-4 flex items-center justify-between gap-5">

                <span className="font-display text-4xl font-medium leading-none sm:text-5xl">
                  ₹{totalCost.toFixed(2)}
                </span>

                <span className="shrink-0 rounded-full bg-lux-copper px-4 py-2 text-[10px] font-extrabold uppercase tracking-wider">
                  {printOptions.colorMode ===
                  'bw'
                    ? 'B&W'
                    : 'Color'}
                </span>

              </div>

              <p className="mt-4 text-sm leading-6 text-lux-paper/60">
                {totalPages} printable page
                {totalPages === 1
                  ? ''
                  : 's'}{' '}
                · updates live
              </p>

            </div>

            {/* Estimate body */}
            <div className="px-6 py-6">

              {/* Privacy message */}
              <div className="mb-6 flex items-start gap-3 rounded-2xl bg-lux-paper px-4 py-3.5">

                <Smartphone
                  size={19}
                  className="mt-0.5 shrink-0 text-lux-copper"
                />

                <p className="text-xs leading-5 text-lux-ink/60">
                  Your file stays private and is removed after printing.
                </p>

              </div>

              {/* Summary details */}
              <dl className="divide-y divide-lux-ink/10">

                {summary.map(
                  ([key, value]) => (
                    <div
                      key={key}
                      className="
                        grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]
                        items-start
                        gap-4
                        py-3
                        first:pt-0
                        last:pb-0
                      "
                    >

                      <dt className="text-xs font-medium text-lux-ink/45 sm:text-sm">
                        {key}
                      </dt>

                      <dd className="min-w-0 break-words text-right text-xs font-bold leading-5 text-lux-ink sm:text-sm">
                        {value}
                      </dd>

                    </div>
                  )
                )}

              </dl>
            </div>
          </div>

          {/* Review button */}
          <button
            onClick={() =>
              navigate('/summary')
            }
            disabled={
              !canContinue ||
              totalPages === 0
            }
            className="
              mt-4
              flex
              min-h-[58px]
              w-full
              items-center
              justify-center
              gap-3
              rounded-[18px]
              bg-lux-copper
              px-6
              py-4
              text-base
              font-extrabold
              uppercase
              tracking-[0.1em]
              text-white
              shadow-[0_14px_28px_rgba(199,121,82,0.28)]
              transition-all
              duration-200
              hover:-translate-y-0.5
              hover:bg-[#b26743]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            Review order

            <ArrowRight size={20} />
          </button>

        </aside>
      </div>
    </main>
  )
}