import { useState } from 'react'
import { schoolInfo, ads } from '../data/mockData.js'
import DashboardPanel from '../components/DashboardPanel.jsx'
import OperationsPanel from '../components/OperationsPanel.jsx'
import chevronDownIcon from '../assets/icons/chevron.down.png'

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [displayedTab, setDisplayedTab] = useState('dashboard')
  const [isContentLeaving, setIsContentLeaving] = useState(false)
  const [isAccountPanelOpen, setIsAccountPanelOpen] = useState(false)
  const [isAccountPanelClosing, setIsAccountPanelClosing] = useState(false)
  const totalRevenue = ads.reduce((sum, item) => sum + item.price, 0)
  const enabledAdsCount = ads.filter((item) => item.enabled).length
  const currentHour = new Date().getHours()
  const greeting = getGreeting(currentHour)
  const isAccountPanelVisible = isAccountPanelOpen || isAccountPanelClosing

  function openAccountPanel() {
    setIsAccountPanelClosing(false)
    setIsAccountPanelOpen(true)
  }

  function closeAccountPanel() {
    setIsAccountPanelClosing(true)
    setIsAccountPanelOpen(false)

    window.setTimeout(() => {
      setIsAccountPanelClosing(false)
    }, 180)
  }

  function toggleAccountPanel() {
    if (isAccountPanelOpen) {
      closeAccountPanel()
      return
    }

    openAccountPanel()
  }

  function handleLogout() {
    closeAccountPanel()

    window.setTimeout(() => {
      onLogout()
    }, 180)
  }

  function switchTab(nextTab) {
    if (nextTab === activeTab || isContentLeaving) {
      return
    }

    setActiveTab(nextTab)
    setIsContentLeaving(true)

    window.setTimeout(() => {
      setDisplayedTab(nextTab)
      setIsContentLeaving(false)
    }, 160)
  }

  return (
    <main className="admin-shell">
      <header className="top-glass-bar">
        <div className="top-glass-inner">
          <nav
            className={`tab-bar top-tab-bar ${activeTab === 'operations' ? 'show-operations' : 'show-dashboard'}`}
            aria-label="后台页面切换"
          >
            <button
              type="button"
              className={activeTab === 'dashboard' ? 'active' : ''}
              onClick={() => switchTab('dashboard')}
            >
              仪表盘
            </button>
            <button
              type="button"
              className={activeTab === 'operations' ? 'active' : ''}
              onClick={() => switchTab('operations')}
            >
              控制台
            </button>
          </nav>

          <div className="school-profile-wrap">
            <button
              type="button"
              className="school-profile account-trigger"
              onClick={toggleAccountPanel}
              aria-expanded={isAccountPanelOpen}
              aria-label="打开账号管理"
            >
              <div className="school-logo">{schoolInfo.logoText}</div>
              <div>
                <strong>{schoolInfo.name}</strong>
                <p>{schoolInfo.adminName}</p>
              </div>
              <span className={`account-chevron ${isAccountPanelOpen ? 'open' : ''}`} aria-hidden="true">
                <img className="account-chevron-icon" src={chevronDownIcon} alt="" />
              </span>
            </button>

            {isAccountPanelVisible && (
              <div className={`account-panel ${isAccountPanelClosing ? 'closing' : ''}`}>
                <div className="account-panel-head">
                  <div className="school-logo small-logo">{schoolInfo.logoText}</div>
                  <div>
                    <strong>{schoolInfo.adminName}</strong>
                    <p>{schoolInfo.name}</p>
                  </div>
                </div>

                <div className="account-actions">
                  <button type="button">账号设置</button>
                  <button type="button">学校资料</button>
                  <button type="button">切换学校</button>
                  <button
                    type="button"
                    className="danger-action"
                    onClick={handleLogout}
                  >
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="page-title-section">
        <p className="eyebrow">School Admin Console</p>
        <h1>{greeting}，欢迎回来</h1>
        <p className="admin-subtitle">{schoolInfo.name}管理后台</p>
      </section>

      <section className={`tab-content-shell ${isContentLeaving ? 'leaving' : 'entering'}`}>
        {displayedTab === 'dashboard' ? (
          <DashboardPanel
            totalRevenue={totalRevenue}
            enabledAdsCount={enabledAdsCount}
            onOpenConsole={() => switchTab('operations')}
          />
        ) : (
          <OperationsPanel />
        )}
      </section>
    </main>
  )
}

function getGreeting(hour) {
  if (hour >= 5 && hour < 9) return '早上好'
  if (hour >= 9 && hour < 12) return '上午好'
  if (hour >= 12 && hour < 14) return '中午好'
  if (hour >= 14 && hour < 19) return '下午好'
  return '夜深了'
}

export default Dashboard