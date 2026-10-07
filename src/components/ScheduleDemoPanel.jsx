import { useRef, useState } from 'react'
import SlidingSelection from './SlidingSelection.jsx'
import { useSchoolDemo } from '../demo/DemoContext.jsx'
import { appendCalendarEvent, demoDirectory, downloadICS, scopeKey, scopeLabel } from '../demo/schoolDemo.js'

export default function ScheduleDemoPanel({ kind, mode, onModeChange, showToast }) {
  const { state, execute } = useSchoolDemo()
  const segmentsRef = useRef(null)
  const [semesterID, setSemesterID] = useState(1)
  const [classScope, setClassScope] = useState(scopeKey(demoDirectory.classes[0]))
  const [file, setFile] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [busy, setBusy] = useState(false)
  const term = state.semesters.find(t => t.semesterID === semesterID)
  const scope = demoDirectory.classes.find(c => scopeKey(c) === classScope)
  const isTable = kind === 'timetable'
  const table = state.timetables.find(t => t.semesterID === semesterID && scopeKey(t) === classScope)
  const versions = isTable ? state.timetableVersions.filter(v => v.tableID === table?.tableID) : state.calendarVersions.filter(v => v.semesterID === semesterID)
  const activeVersionID = isTable ? table?.baseVersionID : term?.calendarVersionID
  const weekCount = term ? Math.min(54, Math.floor((Date.parse(term.endDate) - Date.parse(term.firstMonday)) / (7 * 86400000)) + 1) : 0
  const modeOptions = isTable ? [['base', '常规课表'], ['temporary', '临时课表'], ['history', '版本与覆盖']] : [['base', '校历文件'], ['temporary', '临时安排'], ['history', '版本记录']]
  function run(input) {
    try { execute(isTable ? 'timetables' : 'calendar', 'POST', { semesterID, version: isTable ? table?.version || 0 : term.version, ...(isTable ? table ? { id: table.tableID } : scope : {}), ...input }); showToast('已在本次演示中保存。'); return true }
    catch (error) { showToast(error.message, 'warning'); return false }
  }
  async function publish(e) {
    e.preventDefault(); setBusy(true)
    try {
      if (!file) throw new Error('请先选择 ICS 文件。')
      const text = await file.text()
      if (run({ action: isTable ? mode === 'temporary' ? 'upload_temporary' : 'upload_base' : 'upload', ...(isTable && mode === 'temporary' ? { weeks } : {}), file: { name: file.name, size: file.size, text } })) setFile(null)
    } catch (error) { showToast(error.message, 'warning') }
    finally { setBusy(false) }
  }
  function publishArrangement(e) {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget))
    try {
      if (!activeVersionID) throw new Error('请先上传本学期校历，再添加临时安排。')
      if (f.start.slice(0,10) < term.startDate || f.end.slice(0,10) > term.endDate) throw new Error('安排需在所选学期内。')
      const text = appendCalendarEvent(state.fileContents[`calendar:${activeVersionID}`], f)
      if (run({ action: 'upload', file: { name: '含临时安排的校历.ics', size: new Blob([text]).size, text } })) e.currentTarget.reset()
    } catch (error) { showToast(error.message, 'warning') }
  }
  function download(version) {
    const text = state.fileContents[`${isTable ? 'timetable' : 'calendar'}:${version.versionID}`]
    downloadICS(text, version.originalName)
  }
  return <article className="info-card schedule-demo-panel">
    <div className="operation-card-head"><div><p className="eyebrow">教学安排 · 演示</p><h2>{isTable ? '课表管理' : '校历管理'}</h2></div></div>
    <div ref={segmentsRef} className="demo-segments" role="group" aria-label={isTable ? '课表操作' : '校历操作'}><SlidingSelection containerRef={segmentsRef} activeKey={mode} />{modeOptions.map(([id,label]) => <button key={id} data-selection-key={id} type="button" className={mode === id ? 'active' : ''} onClick={() => { onModeChange(id); setFile(null) }}>{label}</button>)}</div>
    <div className="form-grid schedule-scope">
      <label>学期<select value={semesterID} onChange={e => { setSemesterID(Number(e.target.value)); setWeeks([]); setFile(null) }}>{state.semesters.map(t => <option key={t.semesterID} value={t.semesterID}>{t.schoolYear} · {t.season === 'autumn' ? '秋季' : '春季'}</option>)}</select></label>
      {isTable && <label>班级<select value={classScope} onChange={e => { setClassScope(e.target.value); setWeeks([]); setFile(null) }}>{demoDirectory.classes.map(s => <option key={scopeKey(s)} value={scopeKey(s)}>{scopeLabel(s)}</option>)}</select></label>}
    </div>
    {mode === 'temporary' && isTable && <div className="demo-callout">上传一个星期的 ICS，替换所选教学周的整周课表。空课表表示该周无课；新覆盖会保留旧版本。{!table && ' 请先发布常规课表。'}</div>}
    {isTable && (mode === 'temporary' || mode === 'history') && <fieldset className="week-picker"><legend>{mode === 'history' ? '选择要撤销的临时覆盖周' : '应用到教学周'}</legend>{Array.from({length:weekCount},(_,i) => i+1).map(w => <label key={w} className={table?.overrides.some(o => o.weekNo === w) ? 'overridden' : ''}><input type="checkbox" checked={weeks.includes(w)} onChange={e => setWeeks(e.target.checked ? [...weeks,w] : weeks.filter(v=>v!==w))} /><span>第 {w} 周</span></label>)}</fieldset>}
    {(mode === 'base' || (mode === 'temporary' && isTable)) && <form onSubmit={publish}>
      <label className="drop-upload-zone demo-upload" onDragOver={e=>e.preventDefault()} onDrop={e => { e.preventDefault(); setFile(e.dataTransfer.files[0]) }}>
        <div className="drop-zone-copy"><span>ICS · 最大 2 MiB</span><strong>{file ? file.name : '拖入文件，或点击选择'}</strong><small>{isTable ? '按所选学期与完整班级保存' : '替换当前校历，旧版本保留'}</small></div>
        <input key={`${kind}-${mode}-${file?.name || 'empty'}`} type="file" accept=".ics" aria-label="选择 ICS 文件" onChange={e=>setFile(e.target.files[0])} />
      </label>
      <button type="submit" className="primary-action" disabled={busy || (isTable && mode === 'temporary' && !table)}>{busy ? '正在读取…' : mode === 'temporary' ? '发布临时课表' : isTable ? '发布常规课表' : '发布校历'}</button>
    </form>}
    {mode === 'temporary' && !isTable && <form className="form-grid" onSubmit={publishArrangement}>
      <p className="full-row demo-callout">临时安排会合并到当前校历，保存为完整的新版本，可从版本记录恢复。</p>
      <label className="full-row">安排名称<input name="title" required maxLength={200} placeholder="例如：教学楼临时检修" /></label>
      <label>开始时间<input name="start" required type="datetime-local" /></label><label>结束时间<input name="end" required type="datetime-local" /></label>
      <label className="full-row">地点<input name="location" placeholder="选填" /></label>
      <button className="primary-action" type="submit" disabled={!activeVersionID}>发布临时安排</button>
    </form>}
    {mode === 'history' && <>
      {isTable && <button type="button" className="quiet-action" disabled={!weeks.length || !table} onClick={() => { if (run({ action:'cancel_temporary', weeks })) setWeeks([]) }}>撤销所选周覆盖</button>}
      <div className="demo-record-list">{versions.map(v => <div key={v.versionID}><div><strong>{v.originalName}</strong><small>{v.kind === 'temporary' ? '临时覆盖' : '常规版本'} · {new Date(v.createdAt).toLocaleDateString('zh-CN')} {activeVersionID === v.versionID ? isTable ? '· 当前常规版本' : '· 当前校历' : ''}</small></div><div className="demo-row-actions"><button type="button" onClick={()=>download(v)}>下载原文件</button>{v.kind !== 'temporary' && <button type="button" disabled={activeVersionID === v.versionID} onClick={()=>run({ action:isTable?'restore_base':'restore', versionID:v.versionID })}>恢复此版本</button>}</div></div>)}{!versions.length && <p>尚无版本记录。</p>}</div>
    </>}
    <details className="demo-term-editor"><summary>学期设置</summary><SemesterEditor showToast={showToast} /></details>
  </article>
}
function SemesterEditor({showToast}) {
  const {state,execute} = useSchoolDemo()
  const [editID,setEditID] = useState('new')
  const term = state.semesters.find(t=>t.semesterID===Number(editID))
  function save(e) {
    e.preventDefault(); const f=Object.fromEntries(new FormData(e.currentTarget))
    try { execute('semesters',term?'PATCH':'POST',{...f,...(term?{id:term.semesterID,version:term.version}:{})}); showToast('学期已在演示中保存。') } catch(error) {showToast(error.message,'warning')}
  }
  return <><label className="demo-select-label">编辑学期<select value={editID} onChange={e=>setEditID(e.target.value)}><option value="new">新增学期</option>{state.semesters.map(t=><option key={t.semesterID} value={t.semesterID}>{t.schoolYear} · {t.season==='autumn'?'秋季':'春季'}</option>)}</select></label>
    <form key={editID} className="form-grid" onSubmit={save}>
      <label>学年<input name="schoolYear" required defaultValue={term?.schoolYear} placeholder="2027-2028" /></label><label>学期<select name="season" defaultValue={term?.season||'autumn'}><option value="autumn">秋季</option><option value="spring">春季</option></select></label>
      <label>开始日期<input name="startDate" type="date" required defaultValue={term?.startDate} /></label><label>结束日期<input name="endDate" type="date" required defaultValue={term?.endDate} /></label><label>首个教学周周一<input name="firstMonday" type="date" required defaultValue={term?.firstMonday} /></label><button type="submit" className="primary-action">保存学期</button>
    </form></>
}
