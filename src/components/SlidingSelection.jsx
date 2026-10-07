import { useEffect, useRef } from 'react'

export default function SlidingSelection({ containerRef, activeKey }) {
  const indicator = useRef(null)
  useEffect(() => {
    const container = containerRef.current
    function update() {
      const target = [...container.querySelectorAll('[data-selection-key]')].find(e => e.dataset.selectionKey === activeKey)
      if (!target || !indicator.current) return
      const bounds = container.getBoundingClientRect(), rect = target.getBoundingClientRect()
      Object.assign(indicator.current.style, { width: `${rect.width}px`, height: `${rect.height}px`, transform: `translate(${rect.left - bounds.left}px, ${rect.top - bounds.top}px)` })
    }
    update()
    const observer = new ResizeObserver(update); observer.observe(container)
    return () => observer.disconnect()
  }, [activeKey, containerRef])
  return <span ref={indicator} className="module-selection-indicator" aria-hidden="true" />
}
