import { useEffect, useRef } from 'react'

export default function ConfirmDialog({ open, title, description, confirmLabel, danger = false, onCancel, onConfirm }: {
  open: boolean; title: string; description: string; confirmLabel: string; danger?: boolean; onCancel: () => void; onConfirm: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const key = (event: KeyboardEvent) => { if (event.key === 'Escape') onCancel() }
    document.addEventListener('keydown', key); return () => document.removeEventListener('keydown', key)
  }, [open, onCancel])
  if (!open) return null
  return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <div className="w-full bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-w-md sm:rounded-lg">
      <h2 id="confirm-title" className="text-xl font-extrabold">{title}</h2><p className="mt-3 text-sm leading-6 text-lux-ink/65">{description}</p>
      <div className="mt-6 flex justify-end gap-3"><button ref={cancelRef} onClick={onCancel} className="min-h-11 border px-4 font-bold">Cancel</button><button onClick={onConfirm} className={`min-h-11 px-4 font-bold text-white ${danger ? 'bg-red-700' : 'bg-lux-ink'}`}>{confirmLabel}</button></div>
    </div>
  </div>
}
