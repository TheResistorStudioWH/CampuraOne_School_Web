import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { createDemoState, demoDirectory, demoStudents, runDemoCommand } from './schoolDemo.js'
import { loadSchoolState } from '../api/schoolClient.js'

const Context=createContext(null)
export function DemoProvider({children,client=null,session=null,onLogout}) {
  const [state,setState]=useState(()=>client?null:{...createDemoState(),directory:demoDirectory})
  const [error,setError]=useState(''),[busy,setBusy]=useState(false),[refreshing,setRefreshing]=useState(false)
  const latest=useRef(state),locked=useRef(false),generation=useRef(0)
  const isDemo=!client
  function commit(next){latest.current=next;setState(next)}
  async function refresh(signal) {
    const serial=++generation.current
    setRefreshing(true)
    try {const next=await loadSchoolState(client,signal);if(serial===generation.current&&!signal?.aborted){commit(next);setError('')}}
    catch(e){if(e.name!=='AbortError')setError(e.message);throw e}
    finally{if(serial===generation.current)setRefreshing(false)}
  }
  useEffect(()=>{
    if(!client)return
    const controller=new AbortController()
    Promise.resolve().then(()=>{if(!controller.signal.aborted)return refresh(controller.signal)}).catch(()=>{})
    return ()=>controller.abort()
    // The client is stable for one authenticated session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[client])
  async function execute(resource,method,input) {
    if(locked.current)throw new Error('上一项操作尚未完成，请稍后再试。')
    locked.current=true;setBusy(true)
    try {
      if(isDemo){const result=runDemoCommand(latest.current,resource,method,input);commit({...result.state,directory:demoDirectory});return result.response}
      let result
      try {result=await client.request(resource,method,input)}catch(e){if(e.status===409)await refresh().catch(()=>{});throw e}
      try {await refresh()}catch{setError('操作已保存，但最新数据读取失败。请刷新数据，不要重复提交。')}
      return result
    } finally{locked.current=false;setBusy(false)}
  }
  async function history(resource,id) {
    if(isDemo)return
    const logs=await client.list(resource,{id,action:'history'})
    commit({...latest.current,logs:[...latest.current.logs.filter(l=>!(l.resourceID===id&&l.resource===({advertisements:'advertisement',announcements:'announcement'})[resource])),...logs]})
  }
  async function findStudents(query,by='studentNumber',signal) {
    if(!query.trim())return []
    return isDemo?demoStudents.filter(s=>by==='studentNumber'?s.studentNumber===query:s.studentName.includes(query)):client.list('students',{[by]:query},{signal})
  }
  async function original(kind,version) {
    return isDemo?latest.current.fileContents[`${kind}:${version.versionID}`]:client.original(version.filePath)
  }
  async function changePassword(input){if(isDemo)return {data:{demo:true}};await client.request('password','POST',input);await onLogout()}
  const context={state,execute,changePassword,isDemo,busy,refreshing,session,history,findStudents,original,onLogout,refresh:()=>refresh().catch(()=>{})}
  if(!state)return <section className="connection-state" role="status"><h2>{error?'无法加载工作台':'正在读取学校资料…'}</h2>{error&&<><p>{error}</p><button className="primary-action" disabled={refreshing} onClick={context.refresh}>重新读取</button><button className="quiet-action" onClick={onLogout}>返回登录</button></>}</section>
  return <Context.Provider value={context}>{error&&<div className="connection-banner" role="alert">{error}<button disabled={busy||refreshing} onClick={context.refresh}>刷新数据</button></div>}<fieldset className="school-workspace-lock" disabled={busy||refreshing} aria-busy={busy||refreshing}>{children}</fieldset></Context.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export function useSchoolDemo(){return useContext(Context)}
