import { useState } from 'react'
import eyeHiddenIcon from '../assets/icons/eyes.right.png'
import eyeVisibleIcon from '../assets/icons/eyes.left.png'

function Login({ onLogin, live = false, sessionFeedback }) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const [busy, setBusy] = useState(false)
  async function submit(e) {
    e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true);setFeedback(null)
    try { await onLogin({loginName:f.get('loginName'),password:f.get('password'),rememberMe:f.get('rememberMe')==='on'}) } catch(error) {setFeedback(error.message)} finally {setBusy(false)}
  }
  function showForgotPasswordFeedback() {
    setFeedback('请联系平台管理员处理账号找回。')

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
              <span>校园事务工作台</span>
            </div>
            <span className="login-version-pill">School Manager</span>
          </div>

          <div className="login-visual-field" aria-hidden="true">
            <span className="visual-node node-notice">通知待办</span>
            <span className="visual-node node-map">校园地图</span>
            <span className="visual-node node-calendar">教学安排</span>
            <span className="visual-line line-a" />
            <span className="visual-line line-b" />
          </div>

          <div className="login-hero-copy">
            <p className="eyebrow">Campura One</p>
              <h1>校园事务，<br />从这里开始。</h1>
            <p>
              发布通知、安排教学、审核广告。学校日常事务，集中管理。
            </p>
          </div>

          <div className="login-meta-grid" aria-label="平台能力预览">
            <span>Notice</span>
            <span>Timetable</span>
            <span>Calendar</span>
            <span>Commerce</span>
          </div>
        </div>

        <form className="login-card campura-login-card" onSubmit={submit}>
          <div className="login-card-head">
            <p className="eyebrow">School Admin Console</p>
            <h2>欢迎回来</h2>
            <p className="login-desc">登录后继续管理学校信息与校园服务内容。</p>
          </div>

          <div className="login-context-card">
            <span>当前入口</span>
            <strong>{live ? '学校管理员' : '测试学校 · 演示'}</strong>
          </div>

          <label>
            账号
            <input name="loginName" required autoComplete="username" type="text" placeholder="请输入管理员账号" defaultValue={live ? '' : 'admin'} />
          </label>

          <label>
            密码
            <div className="password-field-wrap">
              <input
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="请输入密码"
                name="password" required autoComplete="current-password" defaultValue={live ? '' : '123456'}
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
              <input name="rememberMe" type="checkbox" defaultChecked />
              记住登录状态
            </label>
            <button type="button" className="text-action" onClick={showForgotPasswordFeedback}>忘记密码？</button>
          </div>

          <button type="submit" disabled={busy} className="login-submit-button">{busy ? '正在登录…' : '登录控制台'}</button>

          <p className="login-tip">{live ? '账号由平台开通，请使用学校管理员账号登录。' : '当前为本地演示，修改仅在本次会话中保留。'}</p>
        </form>
      </section>

      {(feedback || sessionFeedback) && (
        <div className="top-toast warning" role="status" aria-live="polite">
          <span className="toast-dot" />
          <span>{feedback || sessionFeedback}</span>
        </div>
      )}
    </main>
  )
}

export default Login
