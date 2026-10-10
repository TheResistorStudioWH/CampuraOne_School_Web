import { useState } from 'react'
import FileImport from './FileImport.jsx'
import MarkdownPreview from './MarkdownPreview.jsx'
import { useSchoolDemo } from '../demo/DemoContext.jsx'
import { emptyTarget, noticeStatus, scopeKey, scopeLabel, shanghaiISO } from '../demo/schoolDemo.js'

const labels = { active:'已发布', scheduled:'待发布', expired:'已结束', revoked:'已撤回' }
export default function NoticeDemoPanel({ initialType = 'short', showToast }) {
  const {state,execute,isDemo,findStudents,history} = useSchoolDemo()
  const directory=state.directory
  const [students,setStudents]=useState([]),[queryBy,setQueryBy]=useState('studentNumber'),[searching,setSearching]=useState(false)
  const [imported,setImported]=useState(null)
  const [editID,setEditID]=useState(null)
  const [type,setType]=useState(initialType==='important'?2:0)
  const [content,setContent]=useState('')
  const [publishMode,setPublishMode]=useState('now')
  const [targetMode,setTargetMode]=useState('all')
  const [targetValue,setTargetValue]=useState('')
  const [studentQuery,setStudentQuery]=useState('')
  const [historyID,setHistoryID]=useState(null)
  const [filter,setFilter]=useState('all')
  const [formKey,setFormKey]=useState(0)
  const [preservedTarget,setPreservedTarget]=useState(null)
  const editing=state.announcements.find(n=>n.announceID===editID)
  async function search(){setSearching(true);try{setStudents(await findStudents(studentQuery,queryBy))}catch(e){showToast(e.message,'warning')}finally{setSearching(false)}}
  function reset() {setPreservedTarget(null);setImported(null);setStudents([]);setEditID(null);setContent('');setTargetMode('all');setTargetValue('');setPublishMode('now');setFormKey(v=>v+1)}
  function edit(n) {
    setEditID(n.announceID);setType(n.type);setContent(n.content);setPublishMode(noticeStatus(n)==='scheduled'?'scheduled':'now');setFormKey(v=>v+1)
    const t=n.target;setPreservedTarget(t)
    if(t.allSchool){setTargetMode('all');setTargetValue('')}
    else if(t.classScopes.length){setTargetMode('class');setTargetValue(scopeKey(t.classScopes[0]))}
    else if(t.departmentIDs.length){setTargetMode('department');setTargetValue(String(t.departmentIDs[0]))}
    else if(t.compoundIDs.length){setTargetMode('compound');setTargetValue(String(t.compoundIDs[0]))}
    else {setTargetMode('student');setTargetValue(String(t.studentIDs[0]));setStudentQuery('');setStudents(t.studentIDs.map(studentID=>({studentID,studentName:'已选学生',studentNumber:studentID})))}
  }
  async function submit(e) {
    e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));let target=emptyTarget()
    if(targetMode!=='all') {
      target.allSchool=false
      if(targetMode==='class') target.classScopes=directory.classes.filter(s=>scopeKey(s)===targetValue)
      else target[{compound:'compoundIDs',department:'departmentIDs',student:'studentIDs'}[targetMode]]=targetValue?[Number(targetValue)]:[]
    }
    if(preservedTarget)target=preservedTarget
    try { await execute('announcements',editing?'PATCH':'POST',{...(editing?{id:editID,version:editing.version}:{}),title:f.title,content,type,publishMode,startTime:publishMode==='scheduled'?shanghaiISO(f.startTime):undefined,endTime:shanghaiISO(f.endTime),target});showToast(editing?'通知已更新。':'通知已发布。');reset() } catch(error){showToast(error.message,'warning')}
  }
  async function revoke(n) {try{await execute('announcements','POST',{action:'revoke',id:n.announceID,version:n.version});if(editID===n.announceID)reset();showToast('通知已撤回，历史记录保留。')}catch(error){showToast(error.message,'warning')}}
  async function openHistory(id){if(historyID===id){setHistoryID(null);return}try{await history('announcements',id);setHistoryID(id)}catch(e){showToast(e.message,'warning')}}
  const localTime=value=>value?.replace(' ','T').slice(0,16)
  return <article className="info-card notice-operation-card">
    <div className="operation-card-head"><div><p className="eyebrow">校园通知{isDemo?' · 演示':''}</p><h2>{editing?'编辑通知':'发布通知'}</h2></div>{editing&&<button className="quiet-action" onClick={reset}>取消编辑</button>}</div>
    <form key={formKey} onSubmit={submit}>
      <div className="notice-schedule-layout notice-schedule-layout-three">
        <section className="notice-form-column"><p className="notice-form-column-title">通知类型</p><label>类型<select value={type} onChange={e=>setType(Number(e.target.value))}><option value={0}>日常短通知</option><option value={1}>紧急短通知</option><option value={2}>重要通知 · Markdown</option></select></label></section>
        <section className="notice-form-column"><p className="notice-form-column-title">发布时间</p><label>发布方式<select value={publishMode} onChange={e=>setPublishMode(e.target.value)}><option value="now">立即发布</option><option value="scheduled">定时发布</option></select></label>{publishMode==='scheduled'&&<label>开始时间<input name="startTime" required type="datetime-local" defaultValue={localTime(editing?.startTime)} /></label>}<label>结束时间<input name="endTime" required type="datetime-local" defaultValue={localTime(editing?.endTime)} /></label></section>
        <section className="notice-form-column"><p className="notice-form-column-title">发布给</p>{preservedTarget&&<p className="demo-callout">保留原通知的全部接收范围。重新选择范围后才会替换。</p>}<label>范围<select value={targetMode} onChange={e=>{setPreservedTarget(null);setTargetMode(e.target.value);setTargetValue('')}}><option value="all">全校</option><option value="compound">校区</option><option value="department">院系</option><option value="class">班级</option><option value="student">指定学生</option></select></label>
          {targetMode!=='all'&&targetMode!=='student'&&<label>选择接收范围<select required value={targetValue} onChange={e=>{setPreservedTarget(null);setTargetValue(e.target.value)}}><option value="">请选择</option>{targetMode==='class'?directory.classes.map(s=><option key={scopeKey(s)} value={scopeKey(s)}>{scopeLabel(s,directory)}</option>):(targetMode==='compound'?directory.compounds:directory.departments).map(s=><option key={s.compoundID+(s.departmentID||0)} value={targetMode==='compound'?s.compoundID:s.departmentID}>{s.compoundName||s.departmentName}</option>)}</select></label>}
          {targetMode==='student'&&<><label>查询方式<select value={queryBy} onChange={e=>{setQueryBy(e.target.value);setStudents([]);setTargetValue('')}}><option value="studentNumber">完整学号</option><option value="name">姓名</option></select></label><label>查找学生<input value={studentQuery} onChange={e=>{setStudentQuery(e.target.value);setTargetValue('');setStudents([])}} placeholder="输入查询内容" /></label><button type="button" className="quiet-action" disabled={searching||!studentQuery} onClick={search}>{searching?'正在查找…':'查找学生'}</button><label>选择学生<select required value={targetValue} onChange={e=>{setPreservedTarget(null);setTargetValue(e.target.value)}}><option value="">请选择查询结果</option>{students.map(s=><option key={s.studentID} value={s.studentID}>{s.studentName} · {s.studentNumber}</option>)}</select></label></>}
        </section>
      </div>
      <div className="form-grid"><label className="full-row">标题<input name="title" required maxLength={200} defaultValue={editing?.title} placeholder="填写通知标题" /></label>
        {type===2&&<div className="full-row"><FileImport kind="notice" label="导入 Word 或 Markdown" onReady={setImported} onClear={()=>setImported(null)} preview={result=><div className="import-preview"><MarkdownPreview>{result.markdown}</MarkdownPreview></div>} />{imported&&<div className="import-actions"><button type="button" className="quiet-action" onClick={()=>{setContent(imported.markdown);setImported(null)}}>替换正文</button><button type="button" className="quiet-action" onClick={()=>{setContent(value=>value+(value?'\n\n':'')+imported.markdown);setImported(null)}}>追加到正文</button></div>}</div>}
        <label className="full-row">{type===2?'Markdown 正文':'正文'}<textarea required value={content} onChange={e=>setContent(e.target.value)} rows={type===2?10:4} maxLength={100000} /></label>
      </div>
      {type===2&&<MarkdownPreview>{content}</MarkdownPreview>}
      <button className="primary-action" type="submit">{editing?'保存更改':'发布通知'}</button>
    </form>
    <section className="demo-history-section"><div className="section-title"><h3>通知记录</h3><select aria-label="通知状态" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">全部状态</option>{Object.entries(labels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div>
      <div className="demo-record-list">{state.announcements.filter(n=>filter==='all'||noticeStatus(n)===filter).map(n=><div key={n.announceID}><div><strong>{n.title}</strong><small>{labels[noticeStatus(n)]} · {['日常','紧急','重要'][n.type]} · 版本 {n.version}</small></div><div className="demo-row-actions"><button type="button" onClick={()=>openHistory(n.announceID)}>历史</button><button disabled={Boolean(n.revokedAt)} onClick={()=>edit(n)}>编辑</button><button disabled={Boolean(n.revokedAt)} onClick={()=>revoke(n)}>撤回</button></div></div>)}</div>
      {historyID&&<div className="demo-history-log">{state.logs.filter(l=>l.resource==='announcement'&&l.resourceID===historyID).map(l=><details key={l.logID}><summary>{l.action} · {new Date(l.createdAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}</summary><pre>{JSON.stringify(JSON.parse(l.afterJSON),null,2)}</pre></details>)}{!state.logs.some(l=>l.resource==='announcement'&&l.resourceID===historyID)&&<p>该记录尚无修改历史。</p>}</div>}
    </section>
  </article>
}
