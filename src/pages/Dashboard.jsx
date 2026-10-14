import { lazy, Suspense, useMemo, useState } from 'react'
import { dashboardStats } from '../api/schoolClient.js'
import { useSchoolDemo } from '../demo/DemoContext.jsx'
import { advertisementViewModels, dashboardAdStats } from '../demo/schoolDemo.js'
import DashboardPanel from '../components/DashboardPanel.jsx'
import AccountMenu from '../components/AccountMenu.jsx'
import AccountDemoDialog from '../components/AccountDemoDialog.jsx'

const OperationsPanel = lazy(() => import('../components/OperationsPanel.jsx'))

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [displayedTab, setDisplayedTab] = useState('dashboard')
  const [isContentLeaving, setIsContentLeaving] = useState(false)
  const [requestedAdID, setRequestedAdID] = useState(null)
  const [activeConsoleModule, setActiveConsoleModule] = useState('notice')
  const { state, execute, isDemo, refresh, busy, refreshing } = useSchoolDemo()
  const school = { name: state.profile.schoolName, logo: state.profile.schoolLogo, adminName: state.profile.adminName || '学校管理员' }
  const [accountPage, setAccountPage] = useState(null)
  const advertisements = useMemo(
    () => advertisementViewModels(state.advertisements),
    [state.advertisements],
  )
  const adStats = useMemo(
    () => isDemo ? dashboardAdStats(state) : dashboardStats(state.dashboard),
    [state, isDemo],
  )
  const currentHour = new Date().getHours()
  const greeting = getGreeting(currentHour)
  function handleReviewDecision(adID, action, reason = '') {
    const ad = state.advertisements.find(a => a.adID === adID)
    return execute('advertisements', 'POST', { id: adID, version: ad.version, action, reason })
  }

  function openConsoleModule(moduleName = 'notice', adID = null) {
    setRequestedAdID(adID)
    setActiveConsoleModule(moduleName)
    switchTab('operations')
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

          <div className="top-bar-actions">
            {!isDemo && <button className={`refresh-data-control ${refreshing ? 'is-refreshing' : ''}`} disabled={busy||refreshing} onClick={refresh} aria-label="刷新数据" title="刷新数据">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.64 9A7 7 0 0 1 18 6.5L20 12M4 12l2 5.5A7 7 0 0 0 18.36 15"/></svg>
            </button>}
            <AccountMenu school={school} onAction={setAccountPage} onLogout={onLogout} />
          </div>
        </div>
      </header>

      <section className="page-title-section">
        <h1>{greeting}，欢迎回来</h1>
        {activeTab !== 'operations' && <p className="admin-subtitle">{school.name}管理后台</p>}
      </section>

      <section className={`tab-content-shell ${isContentLeaving ? 'leaving' : 'entering'}`}>
        {displayedTab === 'dashboard' ? (
          <DashboardPanel
            advertisements={advertisements}
            adStats={adStats}
            onOpenConsole={openConsoleModule}
          />
        ) : (
          <Suspense fallback={<div className="console-loading-card" aria-label="正在载入控制台模块"><span/><span/><span/><span/></div>}>
            <OperationsPanel
              activeModule={activeConsoleModule}
              onModuleChange={setActiveConsoleModule}
              advertisements={advertisements}
              requestedAdID={requestedAdID}
              onReviewDecision={handleReviewDecision}
            />
          </Suspense>
        )}
      </section>

      {accountPage && <AccountDemoDialog page={accountPage} onClose={() => setAccountPage(null)} />}
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
