import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useSchoolDemo } from '../demo/DemoContext.jsx'
import { demoDirectory, demoStudents, emptyTarget, noticeStatus, scopeKey, scopeLabel, shanghaiISO } from '../demo/schoolDemo.js'

const labels = { active:'已发布', scheduled:'待发布', expired:'已结束', revoked:'已撤回' }
export default function NoticeDemoPanel({ initialType = 'short', showToast }) {
  const {state,execute} = useSchoolDemo()
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
  const editing=state.announcements.find(n=>n.announceID===editID)
  const students=demoStudents.filter(s=>studentQuery && (s.studentNumber===studentQuery || s.studentName.includes(studentQuery)))
  function reset() {setEditID(null);setContent('');setTargetMode('all');setTargetValue('');setPublishMode('now');setFormKey(v=>v+1)}
  function edit(n) {
    setEditID(n.announceID);setType(n.type);setContent(n.content);setPublishMode(noticeStatus(n)==='scheduled'?'scheduled':'now');setFormKey(v=>v+1)
    const t=n.target
    if(t.allSchool){setTargetMode('all');setTargetValue('')}
    else if(t.classScopes.length){setTargetMode('class');setTargetValue(scopeKey(t.classScopes[0]))}
    else if(t.departmentIDs.length){setTargetMode('department');setTargetValue(String(t.departmentIDs[0]))}
    else if(t.compoundIDs.length){setTargetMode('compound');setTargetValue(String(t.compoundIDs[0]))}
    else {setTargetMode('student');setTargetValue(String(t.studentIDs[0]));setStudentQuery(demoStudents.find(s=>s.studentID===t.studentIDs[0])?.studentNumber||'')}
  }
  function submit(e) {
    e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));const target=emptyTarget()
    if(targetMode!=='all') {
      target.allSchool=false
      if(targetMode==='class') target.classScopes=demoDirectory.classes.filter(s=>scopeKey(s)===targetValue)
      else target[{compound:'compoundIDs',department:'departmentIDs',student:'studentIDs'}[targetMode]]=targetValue?[Number(targetValue)]:[]
    }
    try { execute('announcements',editing?'PATCH':'POST',{...(editing?{id:editID,version:editing.version}:{}),title:f.title,content,type,publishMode,startTime:publishMode==='scheduled'?shanghaiISO(f.startTime):undefined,endTime:shanghaiISO(f.endTime),target});showToast(editing?'通知已更新。':'通知已在演示中发布。');reset() } catch(error){showToast(error.message,'warning')}
  }
  function revoke(n) {try{execute('announcements','POST',{action:'revoke',id:n.announceID,version:n.version});if(editID===n.announceID)reset();showToast('通知已撤回，历史记录保留。')}catch(error){showToast(error.message,'warning')}}
  async function importDocx(file) {
    if(!file?.name.toLowerCase().endsWith('.docx')){showToast('请选择 DOCX 文件。','warning');return}
    try {const [{default:mammoth},{default:Turndown}]=await Promise.all([import('mammoth/mammoth.browser'),import('turndown')]);const result=await mammoth.convertToHtml({arrayBuffer:await file.arrayBuffer()});setContent(new Turndown({headingStyle:'atx',bulletListMarker:'-'}).turndown(result.value));showToast('已转换，请检查正文格式。')}catch{showToast('转换失败，请检查文件。','warning')}
  }
  const localTime=value=>value?.slice(0,16)
  return <article className="info-card notice-operation-card">
    <div className="operation-card-head"><div><p className="eyebrow">校园通知 · 演示</p><h2>{editing?'编辑通知':'发布通知'}</h2></div>{editing&&<button className="quiet-action" onClick={reset}>取消编辑</button>}</div>
    <form key={formKey} onSubmit={submit}>
      <div className="notice-schedule-layout notice-schedule-layout-three">
        <section className="notice-form-column"><p className="notice-form-column-title">通知类型</p><label>类型<select value={type} onChange={e=>setType(Number(e.target.value))}><option value={0}>日常短通知</option><option value={1}>紧急短通知</option><option value={2}>重要通知 · Markdown</option></select></label></section>
        <section className="notice-form-column"><p className="notice-form-column-title">发布时间</p><label>发布方式<select value={publishMode} onChange={e=>setPublishMode(e.target.value)}><option value="now">立即发布</option><option value="scheduled">定时发布</option></select></label>{publishMode==='scheduled'&&<label>开始时间<input name="startTime" required type="datetime-local" defaultValue={localTime(editing?.startTime)} /></label>}<label>结束时间<input name="endTime" required type="datetime-local" defaultValue={localTime(editing?.endTime)} /></label></section>
        <section className="notice-form-column"><p className="notice-form-column-title">发布给</p><label>范围<select value={targetMode} onChange={e=>{setTargetMode(e.target.value);setTargetValue('')}}><option value="all">全校</option><option value="compound">校区</option><option value="department">院系</option><option value="class">班级</option><option value="student">指定学生</option></select></label>
          {targetMode!=='all'&&targetMode!=='student'&&<label>选择接收范围<select required value={targetValue} onChange={e=>setTargetValue(e.target.value)}><option value="">请选择</option>{targetMode==='class'?demoDirectory.classes.map(s=><option key={scopeKey(s)} value={scopeKey(s)}>{scopeLabel(s)}</option>):(targetMode==='compound'?demoDirectory.compounds:demoDirectory.departments).map(s=><option key={s.compoundID+(s.departmentID||0)} value={targetMode==='compound'?s.compoundID:s.departmentID}>{s.compoundName||s.departmentName}</option>)}</select></label>}
          {targetMode==='student'&&<><label>查找学生<input value={studentQuery} onChange={e=>{setStudentQuery(e.target.value);setTargetValue('')}} placeholder="完整学号或姓名" /></label><label>选择学生<select required value={targetValue} onChange={e=>setTargetValue(e.target.value)}><option value="">请选择查询结果</option>{students.map(s=><option key={s.studentID} value={s.studentID}>{s.studentName} · {s.studentNumber}</option>)}</select></label></>}
        </section>
      </div>
      <div className="form-grid"><label className="full-row">标题<input name="title" required maxLength={200} defaultValue={editing?.title} placeholder="填写通知标题" /></label>
        {type===2&&<label className="full-row docx-upload-line demo-docx">导入 Word<input type="file" accept=".docx" onChange={e=>importDocx(e.target.files[0])} /></label>}
        <label className="full-row">{type===2?'Markdown 正文':'正文'}<textarea required value={content} onChange={e=>setContent(e.target.value)} rows={type===2?10:4} maxLength={100000} /></label>
      </div>
      {type===2&&<div className="markdown-preview-card demo-markdown"><strong>正文预览</strong><ReactMarkdown>{content}</ReactMarkdown></div>}
      <button className="primary-action" type="submit">{editing?'保存更改':'发布通知'}</button>
    </form>
    <section className="demo-history-section"><div className="section-title"><h3>通知记录</h3><select aria-label="通知状态" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">全部状态</option>{Object.entries(labels).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></div>
      <div className="demo-record-list">{state.announcements.filter(n=>filter==='all'||noticeStatus(n)===filter).map(n=><div key={n.announceID}><div><strong>{n.title}</strong><small>{labels[noticeStatus(n)]} · {['日常','紧急','重要'][n.type]} · 版本 {n.version}</small></div><div className="demo-row-actions"><button type="button" onClick={()=>setHistoryID(historyID===n.announceID?null:n.announceID)}>历史</button><button disabled={Boolean(n.revokedAt)} onClick={()=>edit(n)}>编辑</button><button disabled={Boolean(n.revokedAt)} onClick={()=>revoke(n)}>撤回</button></div></div>)}</div>
      {historyID&&<div className="demo-history-log">{state.logs.filter(l=>l.resource==='announcement'&&l.resourceID===historyID).map(l=><details key={l.logID}><summary>{l.action} · {new Date(l.createdAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}</summary><pre>{JSON.stringify(JSON.parse(l.afterJSON),null,2)}</pre></details>)}{!state.logs.some(l=>l.resource==='announcement'&&l.resourceID===historyID)&&<p>该演示记录尚无修改历史。</p>}</div>}
    </section>
  </article>
}
