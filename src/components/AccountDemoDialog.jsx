import { useEffect, useRef, useState } from 'react'
import { useSchoolDemo } from '../demo/DemoContext.jsx'
import { demoDirectory, demoStudents, scopeLabel } from '../demo/schoolDemo.js'

export default function AccountDemoDialog({ page, onClose }) {
  const {state,execute}=useSchoolDemo()
  const dialog=useRef(null)
  const [feedback,setFeedback]=useState('')
  const [query,setQuery]=useState('')
  useEffect(()=>{dialog.current.showModal()},[])
  function save(e){e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));try{execute('profile','PATCH',{version:state.profile.version,schoolName:f.schoolName,schoolAddress:f.schoolAddress.split('\n').map(s=>s.trim()).filter(Boolean)});setFeedback('学校资料已在演示中保存。')}catch(error){setFeedback(error.message)}}
  async function logo(file){
    if(!file)return
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setFeedback('Logo 支持 JPEG、PNG、WebP，最大 5 MB。');return}
    try { const bitmap=await createImageBitmap(file); const valid=bitmap.width<=8192&&bitmap.height<=8192; bitmap.close(); if(!valid){setFeedback('Logo 长宽均不能超过 8192 像素。');return} } catch {setFeedback('无法读取该图片。');return}
    const reader=new FileReader();reader.onload=()=>{try{execute('profile','POST',{action:'upload_logo',version:state.profile.version,logoData:reader.result,file:{name:file.name,size:file.size}});setFeedback('Logo 已在演示中更新。')}catch(error){setFeedback(error.message)}};reader.readAsDataURL(file)
  }
  const results=demoStudents.filter(s=>query&&(s.studentNumber===query||s.studentName.includes(query)))
  return <dialog ref={dialog} className="demo-dialog" onCancel={onClose} onClick={e=>{if(e.target===dialog.current)onClose()}}><div className="demo-dialog-inner">
    <div className="section-title"><h2>{page==='profile'?'学校资料':page==='directory'?'校区与学生':'账号设置'}</h2><button className="quiet-action" onClick={onClose} aria-label="关闭账号窗口">关闭</button></div>
    <p className="demo-callout">本地演示 · 修改仅在本次登录中保留。</p>
    {page==='profile'&&<><form className="form-grid" onSubmit={save}><label className="full-row">学校名称<input name="schoolName" defaultValue={state.profile.schoolName} maxLength={100} required /></label><label className="full-row">地址（每行一段）<textarea name="schoolAddress" defaultValue={state.profile.schoolAddress.join('\n')} required rows={3} /></label><button type="submit" className="primary-action">保存资料</button></form><label className="demo-select-label">学校 Logo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>logo(e.target.files[0])} /></label>{state.profile.schoolLogo&&<img className="demo-logo-preview" src={state.profile.schoolLogo} alt="学校 Logo 预览" />}</>}
    {page==='directory'&&<><h3>班级目录</h3><div className="demo-record-list">{demoDirectory.classes.map(s=><div key={`${s.compoundID}/${s.departmentID}/${s.classID}`}><strong>{scopeLabel(s)}</strong></div>)}</div><label className="demo-select-label">查找学生<input placeholder="完整学号或姓名" value={query} onChange={e=>setQuery(e.target.value)} /></label><div className="demo-record-list">{results.map(s=><div key={s.studentID}><div><strong>{s.studentName} · {s.studentNumber}</strong><small>{scopeLabel(s)}</small></div></div>)}{query&&!results.length&&<p>没有匹配的演示学生。</p>}</div></>}
    {page==='account'&&<><dl className="review-facts"><div><dt>登录账号</dt><dd>admin · 演示账号</dd></div><div><dt>会话</dt><dd>仅浏览器内存；退出后清空</dd></div></dl><p>正式账号由平台开通。当前未连接身份服务。</p><details><summary>修改密码流程演示</summary><form className="form-grid" onSubmit={e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));const length=new TextEncoder().encode(f.next).length;if(length<12||length>72||f.next!==f.confirm){setFeedback('新密码需为 12–72 字节，两次输入需一致。');return}e.currentTarget.reset();setFeedback('已演示改密完成；没有保存或修改任何密码。')}}><p className="full-row demo-callout">请使用虚构内容演示。正式改密会撤销该账号全部会话。</p><label className="full-row">当前密码<input required type="password" name="current" autoComplete="off" /></label><label className="full-row">新密码<input required type="password" name="next" autoComplete="off" /></label><label className="full-row">确认新密码<input required type="password" name="confirm" autoComplete="off" /></label><button className="primary-action" type="submit">演示修改</button></form></details></>}
    {feedback&&<p role="status">{feedback}</p>}
  </div></dialog>
}
