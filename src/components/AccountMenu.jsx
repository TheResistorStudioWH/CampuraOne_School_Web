import { useEffect, useRef, useState } from 'react'

const actions = [
  { label: '账号设置', icon: 'person', page: 'account' },
  { label: '学校资料', icon: 'school', page: 'profile' },
  { label: '校区与学生', icon: 'switch', page: 'directory' },
]

function MenuIcon({ name }) {
  const paths = {
    person: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    school: <><path d="m3 9 9-5 9 5M5 10v10h14V10M9 20v-6h6v6M2 20h20" /><path d="M9 10h.01M15 10h.01" /></>,
    switch: <><path d="M4 7h16l-4-4M20 17H4l4 4" /></>,
    logout: <><path d="M10 4H4v16h6M10 12h11l-4-4M21 12l-4 4" /></>,
  }
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function AccountMenu({ school, onAction, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapRef = useRef(null)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return
    panelRef.current?.querySelector('button')?.focus()
    function dismiss(event) {
      if (!wrapRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [isOpen])

  function closeAndFocus() {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  function handleKeys(event) {
    if (event.key === 'Escape') {
      event.preventDefault()
      closeAndFocus()
    }
    if (!isOpen || !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = [...panelRef.current.querySelectorAll('button')]
    const index = buttons.indexOf(document.activeElement)
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
      : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    buttons[next].focus()
  }

  return (
    <div className="school-profile-wrap" ref={wrapRef} onKeyDown={handleKeys}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false) }}>
      <button ref={triggerRef} type="button" className="school-profile account-trigger"
        aria-expanded={isOpen} aria-controls="account-actions" aria-label="账号管理"
        onClick={() => setIsOpen((value) => !value)}>
        <span className="school-logo">{school.logo ? <img src={school.logo} alt="" /> : school.logoText}</span>
        <span className="account-identity"><strong>{school.adminName}</strong><small>{school.name}</small></span>
        <span className={`account-disclosure ${isOpen ? 'open' : ''}`} aria-hidden="true">⌄</span>
      </button>
      {isOpen && (
        <div ref={panelRef} className="account-panel" id="account-actions" aria-label="账号操作">
          <div className="account-menu-caption">管理</div>
          <div className="account-actions">
            {actions.map((action) => (
              <button key={action.label} type="button" onClick={() => { closeAndFocus(); onAction(action.page) }}>
                <MenuIcon name={action.icon} /><span>{action.label}</span><span className="menu-row-chevron" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
          <div className="account-menu-divider" />
          <div className="account-actions">
            <button type="button" className="danger-action" onClick={onLogout}><MenuIcon name="logout" /><span>退出登录</span></button>
          </div>
        </div>
      )}
    </div>
  )
}
