import { useEffect, useRef, useState } from 'react'

export default function HoverQuickControl({ kind = 'module', label, children }) {
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  const root = useRef(null)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  useEffect(() => {
    if (!open) return
    function dismiss(event) { if (!root.current?.contains(event.target)) setOpen(false) }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open])
  function enter() { window.clearTimeout(timer.current); setOpen(true) }
  function leave() { timer.current = window.setTimeout(() => setOpen(false), 220) }
  return <div ref={root} className={`${kind}-quick-control ${open ? 'open' : ''}`}
    onPointerEnter={event => { if (event.pointerType !== 'touch') enter() }} onPointerLeave={event => { if (event.pointerType !== 'touch') leave() }}
    onFocus={enter} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) leave() }}
    onKeyDown={e => { if (e.key === 'Escape') { window.clearTimeout(timer.current); e.currentTarget.querySelector('button')?.focus(); setOpen(false); } }}>
    <button type="button" className={`${kind}-quick-trigger`} aria-label={label} aria-expanded={open}
      onClick={event => { window.clearTimeout(timer.current); setOpen(value => event.nativeEvent.pointerType === 'mouse' ? true : !value) }} />
    <div className={`${kind}-quick-menu`} aria-label={label} aria-hidden={!open} inert={!open} onClick={e => { if (e.target.closest('[data-close-quick]')) setOpen(false) }}>{children}</div>
  </div>
}
