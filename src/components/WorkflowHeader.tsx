import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react'
import AccountMenu from './AccountMenu'

type Step = 'upload' | 'options' | 'review'

interface WorkflowHeaderProps {
  step: Step
  onBack?: () => void
}

const steps: Array<{ id: Step; label: string; number: number }> = [
  { id: 'upload', label: 'Upload', number: 1 },
  { id: 'options', label: 'Options', number: 2 },
  { id: 'review', label: 'Review', number: 3 },
]

export default function WorkflowHeader({ step, onBack }: WorkflowHeaderProps) {
  return (
    <header className="header-enter sticky top-0 z-30 border-b border-lux-ink/10 bg-lux-paper/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto] items-center gap-x-3 px-4 py-3 sm:grid-cols-[1fr_auto_1fr] sm:px-8 sm:py-4">
        <div className="min-w-0">
          {onBack ? (
            <button onClick={onBack} className="touch-target flex items-center gap-2 text-sm font-bold text-lux-ink/60 hover:text-lux-ink" aria-label="Go back">
              <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
            </button>
          ) : (
            <a href="/" className="inline-flex min-w-0 items-center gap-2.5" aria-label="Ping and Print home">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lux-ink text-lux-paper sm:h-10 sm:w-10"><FileText size={19} strokeWidth={1.6} /></span>
              <span className="min-w-0 leading-none"><span className="block truncate text-base font-extrabold sm:text-lg">Ping<span className="text-lux-copper">&amp;</span>Print</span><span className="mt-1 hidden text-[8px] font-bold uppercase tracking-[0.16em] text-lux-ink/50 min-[390px]:block">Campus printing</span></span>
            </a>
          )}
        </div>

        <div className="col-start-2 row-start-1 flex min-w-0 items-center justify-end gap-2 sm:col-start-3">
          <span className="hidden items-center gap-2 text-xs font-bold text-lux-ink/50 lg:flex"><ShieldCheck size={16} className="text-lux-copper" /> Secure session</span>
          <AccountMenu />
        </div>

        <nav className="col-span-2 mt-3 flex min-w-0 items-center justify-center gap-2 border-t border-lux-ink/10 pt-3 text-[10px] font-extrabold uppercase tracking-[0.1em] sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:mt-0 sm:border-0 sm:pt-0 sm:text-xs" aria-label="Print order progress">
          {steps.map((item, index) => {
            const active = item.id === step
            return (
              <div key={item.id} className="contents">
                {index > 0 && <span className="text-lux-copper/70">/</span>}
                <span className={`flex items-center gap-1.5 whitespace-nowrap ${active ? 'text-lux-ink' : 'text-lux-ink/35'}`} aria-current={active ? 'step' : undefined}>
                  {active && <span className="status-breathe flex h-6 w-6 items-center justify-center rounded-full bg-lux-copper text-white sm:h-7 sm:w-7">{item.number}</span>}
                  <span>{item.label}</span>
                </span>
              </div>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
