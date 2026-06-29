import { useState } from 'react'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [transitionPhase, setTransitionPhase] = useState('idle')
  const [transitionDirection, setTransitionDirection] = useState('to-dashboard')

  function switchPage(nextIsLoggedIn, direction) {
    if (transitionPhase !== 'idle') {
      return
    }

    setTransitionDirection(direction)
    setTransitionPhase('leaving')

    window.setTimeout(() => {
      setIsLoggedIn(nextIsLoggedIn)
      setTransitionPhase('entering')
    }, 220)

    window.setTimeout(() => {
      setTransitionPhase('idle')
    }, 560)
  }

  return (
    <div className={`app-transition-shell ${transitionDirection} ${transitionPhase}`}>
      {!isLoggedIn ? (
        <Login onLogin={() => switchPage(true, 'to-dashboard')} />
      ) : (
        <Dashboard onLogout={() => switchPage(false, 'to-login')} />
      )}
    </div>
  )
}

export default App