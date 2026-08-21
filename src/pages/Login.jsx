import { useState } from 'react'
import eyeHiddenIcon from '../assets/icons/eyes.right.png'
import eyeVisibleIcon from '../assets/icons/eyes.left.png'

function Login({ onLogin }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [feedback, setFeedback] = useState(null)

  function showForgotPasswordFeedback() {
    setFeedback('密码找回在当前演示版中暂未开放。')

    window.clearTimeout(showForgotPasswordFeedback.timer)
    showForgotPasswordFeedback.timer = window.setTimeout(() => {
      setFeedback(null)
    }, 2600)
  }

  return (
    <main className="login-page campura-login-page">
      <section className="login-stage">
        <div className="login-brand-panel">
          <div className="brand-orb-wrap" aria-hidden="true">
            <div className="brand-orb main-orb" />
            <div className="brand-orb sub-orb" />
          </div>

          <div className="login-panel-topline">
            <div className="login-logo-space">
              <div className="login-logo-placeholder">Campura</div>
              <span>Logo Area</span>
            </div>
            <span className="login-version-pill">School Manager</span>
          </div>

          <div className="login-visual-field" aria-hidden="true">
            <span className="visual-node node-notice">Notice</span>
            <span className="visual-node node-map">Map</span>
            <span className="visual-node node-calendar">Calendar</span>
            <span className="visual-line line-a" />
            <span className="visual-line line-b" />
          </div>

          <div className="login-hero-copy">
            <p className="eyebrow">Campura One</p>
              <h1>把校园运行，整理成清晰的一页。</h1>
            <p>
              一个给学校端使用的轻量控制台：发布通知、维护校历课表、管理商户广告，并把校园服务的状态收束到同一个入口。
            </p>
          </div>

          <div className="login-meta-grid" aria-label="平台能力预览">
            <span>Notice</span>
            <span>Timetable</span>
            <span>Calendar</span>
            <span>Commerce</span>
          </div>
        </div>

        <section className="login-card campura-login-card">
          <div className="login-card-head">
            <p className="eyebrow">School Admin Console</p>
            <h2>欢迎回来</h2>
            <p className="login-desc">登录后继续管理学校信息与校园服务内容。</p>
          </div>

          <div className="login-context-card">
            <span>当前入口</span>
            <strong>测试学校 · 管理员</strong>
          </div>

          <label>
            账号
            <input type="text" placeholder="请输入管理员账号" defaultValue="admin" />
          </label>

          <label>
            密码
            <div className="password-field-wrap">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="请输入密码"
                defaultValue="123456"
              />
              <button
                type="button"
                className="password-eye-button"
                onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
                title={isPasswordVisible ? '隐藏密码' : '显示密码'}
              >
                <img
                  src={isPasswordVisible ? eyeVisibleIcon : eyeHiddenIcon}
                  alt=""
                  aria-hidden="true"
                />
              </button>
            </div>
          </label>

          <div className="login-options-row">
            <label className="remember-login">
              <input type="checkbox" defaultChecked />
              记住登录状态
            </label>
            <button type="button" className="text-action" onClick={showForgotPasswordFeedback}>忘记密码？</button>
          </div>

          <button type="button" className="login-submit-button" onClick={onLogin}>登录控制台</button>

          <p className="login-tip">当前为 UI 演示版，暂未连接服务器数据库。</p>
        </section>
      </section>

      {feedback && (
        <div className="top-toast warning" role="status" aria-live="polite">
          <span className="toast-dot" />
          <span>{feedback}</span>
        </div>
      )}
    </main>
  )
}

export default Login
