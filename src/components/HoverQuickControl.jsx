import { useEffect, useRef, useState } from 'react'

export default function HoverQuickControl({ kind = 'module', label, children }) {
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  function enter() { window.clearTimeout(timer.current); setOpen(true) }
  function leave() { timer.current = window.setTimeout(() => setOpen(false), 220) }
  return <div className={`${kind}-quick-control ${open ? 'open' : ''}`}
    onPointerEnter={enter} onPointerLeave={leave}
    onFocus={enter} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) leave() }}
    onKeyDown={e => { if (e.key === 'Escape') { window.clearTimeout(timer.current); e.currentTarget.querySelector('button')?.focus(); setOpen(false); } }}>
    <button type="button" className={`${kind}-quick-trigger`} aria-label={label} aria-expanded={open}
      onClick={() => { window.clearTimeout(timer.current); setOpen(true) }} />
    <div className={`${kind}-quick-menu`} aria-label={label} aria-hidden={!open} inert={!open} onClick={e => { if (e.target.closest('[data-close-quick]')) setOpen(false) }}>{children}</div>
  </div>
}
