import { useLayoutEffect, useRef } from 'react'

export default function SlidingSelection({ containerRef, activeKey }) {
  const indicator = useRef(null)
  const initialized = useRef(false)
  useLayoutEffect(() => {
    const container = containerRef.current
    const currentIndicator = indicator.current
    if (!container || !currentIndicator) return
    let frame = null, restoreFrame = null
    function update() {
      const target = [...container.querySelectorAll('[data-selection-key]')].find(e => e.dataset.selectionKey === activeKey)
      if (!target) return
      const bounds = container.getBoundingClientRect(), rect = target.getBoundingClientRect()
      if (!initialized.current) currentIndicator.style.transition = 'none'
      Object.assign(currentIndicator.style, { width: `${rect.width}px`, height: `${rect.height}px`, transform: `translate3d(${rect.left - bounds.left}px, ${rect.top - bounds.top}px, 0)` })
      if (!initialized.current) {
        initialized.current = true
        restoreFrame = window.requestAnimationFrame(() => { currentIndicator.style.transition = '' })
      }
    }
    update()
    const observer = new ResizeObserver(() => { window.cancelAnimationFrame(frame); frame = window.requestAnimationFrame(update) })
    observer.observe(container)
    return () => { observer.disconnect(); window.cancelAnimationFrame(frame); window.cancelAnimationFrame(restoreFrame); currentIndicator.style.transition = '' }
  }, [activeKey, containerRef])
  return <span ref={indicator} className="module-selection-indicator" aria-hidden="true" />
}
