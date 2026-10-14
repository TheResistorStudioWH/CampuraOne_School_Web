import { useEffect, useRef, useState } from 'react'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { DemoProvider } from './demo/DemoContext.jsx'
import { createSchoolClient } from './api/schoolClient.js'
import ServerLoadingSkeleton from './components/ServerLoadingSkeleton.jsx'

const live=import.meta.env.VITE_APP_MODE==='live'
const sessionKey='campura-school-session'
function loadSession(){try{return JSON.parse(sessionStorage.getItem(sessionKey)||localStorage.getItem(sessionKey)||'null')}catch{return null}}
function clearSession(){sessionStorage.removeItem(sessionKey);localStorage.removeItem(sessionKey)}
export default function App(){
  const [saved]=useState(()=>live?loadSession():null)
  const [session,setSession]=useState(null),[restoring,setRestoring]=useState(Boolean(saved)),[feedback,setFeedback]=useState('')
  const [pageTransition,setPageTransition]=useState('')
  const transitionTimer=useRef(null),logoutInProgress=useRef(false)
  const [client]=useState(()=>createSchoolClient({base:import.meta.env.VITE_API_BASE||'',onUnauthorized:()=>{clearSession();setSession(null);setFeedback('登录已过期，请重新登录。')}}))
  useEffect(()=>{
    if(!live)return
    const controller=new AbortController()
    if(!saved)return
    client.setToken(saved.token)
    client.request('session','GET',{}, {signal:controller.signal}).then(({data})=>{const next={...saved,admin:{adminID:data.adminID,schoolID:data.schoolID,loginName:data.loginName},expiresAt:data.expiresAt};client.setToken(next.token);setSession(next)}).catch(e=>{if(e.name!=='AbortError'){client.setToken(null);if(e.status===401)clearSession();setFeedback(e.message)}}).finally(()=>{if(!controller.signal.aborted)setRestoring(false)})
    return ()=>controller.abort()
  },[client,saved])
  useEffect(()=>()=>window.clearTimeout(transitionTimer.current),[])
  async function login(input){
    if(!live){setPageTransition('entering-to-dashboard');setSession({admin:{loginName:'admin'}});transitionTimer.current=window.setTimeout(()=>setPageTransition(''),340);return}
    const {data}=await client.request('login','POST',input)
    clearSession();(input.rememberMe?localStorage:sessionStorage).setItem(sessionKey,JSON.stringify(data));client.setToken(data.token);setPageTransition('entering-to-dashboard');setSession(data);setFeedback('')
    transitionTimer.current=window.setTimeout(()=>setPageTransition(''),340)
  }
  async function logout(){
    if(logoutInProgress.current)return
    logoutInProgress.current=true
    if(live){try{await client.request('logout','POST')}catch(e){if(e.status!==401){setFeedback('退出请求未完成，请重试。');logoutInProgress.current=false;return}}}
    clearSession();client.setToken(null);setPageTransition('leaving-to-login')
    transitionTimer.current=window.setTimeout(()=>{
      setSession(null)
      setPageTransition('entering-to-login')
      transitionTimer.current=window.setTimeout(()=>{setPageTransition('');logoutInProgress.current=false},340)
    },220)
  }
  if(restoring)return <ServerLoadingSkeleton label="正在恢复登录" />
  return session?<div className={`app-transition-shell ${pageTransition==='leaving-to-login'?'leaving to-login':pageTransition==='entering-to-dashboard'?'entering to-dashboard':''}`}><DemoProvider client={live?client:null} session={session} onLogout={logout}><Dashboard onLogout={logout} />{feedback&&<p className="connection-banner" role="alert">{feedback}</p>}</DemoProvider></div>:<div className={`app-transition-shell ${pageTransition==='entering-to-login'?'entering to-login':''}`}><Login onLogin={login} live={live} sessionFeedback={feedback} /></div>
}
