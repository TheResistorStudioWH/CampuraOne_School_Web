import { useEffect, useState } from 'react'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import { DemoProvider } from './demo/DemoContext.jsx'
import { createSchoolClient } from './api/schoolClient.js'

const live=import.meta.env.VITE_APP_MODE==='live'
const sessionKey='campura-school-session'
function loadSession(){try{return JSON.parse(sessionStorage.getItem(sessionKey)||localStorage.getItem(sessionKey)||'null')}catch{return null}}
function clearSession(){sessionStorage.removeItem(sessionKey);localStorage.removeItem(sessionKey)}
export default function App(){
  const [saved]=useState(()=>live?loadSession():null)
  const [session,setSession]=useState(null),[restoring,setRestoring]=useState(Boolean(saved)),[feedback,setFeedback]=useState('')
  const [client]=useState(()=>createSchoolClient({base:import.meta.env.VITE_API_BASE||'',onUnauthorized:()=>{clearSession();setSession(null);setFeedback('登录已过期，请重新登录。')}}))
  useEffect(()=>{
    if(!live)return
    const controller=new AbortController()
    if(!saved)return
    client.setToken(saved.token)
    client.request('session','GET',{}, {signal:controller.signal}).then(({data})=>{const next={...saved,admin:{adminID:data.adminID,schoolID:data.schoolID,loginName:data.loginName},expiresAt:data.expiresAt};client.setToken(next.token);setSession(next)}).catch(e=>{if(e.name!=='AbortError'){client.setToken(null);if(e.status===401)clearSession();setFeedback(e.message)}}).finally(()=>{if(!controller.signal.aborted)setRestoring(false)})
    return ()=>controller.abort()
  },[client,saved])
  async function login(input){
    if(!live){setSession({admin:{loginName:'admin'}});return}
    const {data}=await client.request('login','POST',input)
    clearSession();(input.rememberMe?localStorage:sessionStorage).setItem(sessionKey,JSON.stringify(data));client.setToken(data.token);setSession(data);setFeedback('')
  }
  async function logout(){
    if(live){try{await client.request('logout','POST')}catch(e){if(e.status!==401){setFeedback('退出请求未完成，请重试。');return}}}
    clearSession();client.setToken(null);setSession(null)
  }
  if(restoring)return <div className="connection-state" role="status">正在恢复登录…</div>
  return session?<DemoProvider client={live?client:null} session={session} onLogout={logout}><Dashboard onLogout={logout} />{feedback&&<p className="connection-banner" role="alert">{feedback}</p>}</DemoProvider>:<Login onLogin={login} live={live} sessionFeedback={feedback} />
}
