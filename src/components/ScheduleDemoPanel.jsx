import { useRef, useState } from 'react'
import FileImport from './FileImport.jsx'
import SlidingSelection from './SlidingSelection.jsx'
import { useSchoolDemo } from '../demo/DemoContext.jsx'
import { appendCalendarEvent, downloadICS, scopeKey, scopeLabel } from '../demo/schoolDemo.js'

export default function ScheduleDemoPanel({ kind, mode, onModeChange, showToast }) {
  const { state, execute, isDemo, original } = useSchoolDemo()
  const directory=state.directory
  const segmentsRef = useRef(null)
  const [semesterID, setSemesterID] = useState(state.semesters[0]?.semesterID||0)
  const [classScope, setClassScope] = useState(directory.classes[0]?scopeKey(directory.classes[0]):'')
  const [file, setFile] = useState(null)
  const [weeks, setWeeks] = useState([])
  const [busy, setBusy] = useState(false)
  const term = state.semesters.find(t => t.semesterID === semesterID)
  const scope = directory.classes.find(c => scopeKey(c) === classScope)
  const isTable = kind === 'timetable'
  const table = state.timetables.find(t => t.semesterID === semesterID && scopeKey(t) === classScope)
  const versions = isTable ? state.timetableVersions.filter(v => v.tableID === table?.tableID) : state.calendarVersions.filter(v => v.semesterID === semesterID)
  const activeVersionID = isTable ? table?.baseVersionID : term?.calendarVersionID
  const weekCount = term ? Math.min(54, Math.floor((Date.parse(term.endDate) - Date.parse(term.firstMonday)) / (7 * 86400000)) + 1) : 0
  const modeOptions = isTable ? [['base', '常规课表'], ['temporary', '临时课表'], ['history', '版本与覆盖']] : [['base', '校历文件'], ['temporary', '临时安排'], ['history', '版本记录']]
  async function run(input) {
    try { await execute(isTable ? 'timetables' : 'calendar', 'POST', { semesterID, version: isTable ? table?.version || 0 : term?.version, ...(isTable ? table ? { id: table.tableID } : scope : {}), ...input }); showToast('已保存。'); return true }
    catch (error) { showToast(error.message, 'warning'); return false }
  }
  async function publish(e) {
    e.preventDefault(); setBusy(true)
    try {
      if (!file) throw new Error('请先选择 ICS 文件。')
      const text = file.text
      if (await run({ action: isTable ? mode === 'temporary' ? 'upload_temporary' : 'upload_base' : 'upload', ...(isTable && mode === 'temporary' ? { weeks } : {}), file: isDemo ? { name:file.file.name,size:file.file.size,text } : file.file })) setFile(null)
    } catch (error) { showToast(error.message, 'warning') }
    finally { setBusy(false) }
  }
  async function publishArrangement(e) {
    e.preventDefault(); const form=e.currentTarget; const f = Object.fromEntries(new FormData(form))
    if (busy) return
    setBusy(true)
    try {
      if (!activeVersionID) throw new Error('请先上传本学期校历，再添加临时安排。')
      if (f.start.slice(0,10) < term.startDate || f.end.slice(0,10) > term.endDate) throw new Error('安排需在所选学期内。')
      const source=versions.find(v=>v.versionID===activeVersionID)
      const text = appendCalendarEvent(await original('calendar',source), f)
      if (await run({ action: 'upload', file: isDemo ? { name:'含临时安排的校历.ics',size:new Blob([text]).size,text } : new File([text],'含临时安排的校历.ics',{type:'text/calendar'}) })) form.reset()
    } catch (error) { showToast(error.message, 'warning') }
    finally { setBusy(false) }
  }
  async function download(version) {try{downloadICS(await original(isTable?'timetable':'calendar',version),version.originalName)}catch(e){showToast(e.message,'warning')}}
  const activeVersion = versions.find(v=>v.versionID===activeVersionID)
  const overrideCount = table?.overrides.length || 0
  return <article className={`info-card schedule-demo-panel ${isTable ? 'schedule-timetable' : 'schedule-calendar'}`}>
    <div className="operation-card-head schedule-heading"><h2>{isTable ? '课表管理' : '校历管理'}</h2><span className={`schedule-status ${activeVersion ? 'is-ready' : ''}`}><i />{activeVersion ? isTable ? '课表已生效' : '校历已生效' : isTable ? '待发布课表' : '待发布校历'}</span></div>
    <div ref={segmentsRef} className="demo-segments" role="group" aria-label={isTable ? '课表操作' : '校历操作'}><SlidingSelection containerRef={segmentsRef} activeKey={mode} />{modeOptions.map(([id,label]) => <button key={id} data-selection-key={id} type="button" className={mode === id ? 'active' : ''} onClick={() => { onModeChange(id); setFile(null) }}>{label}</button>)}</div>
    <section className="schedule-scope-section" aria-labelledby={`${kind}-scope-title`}>
      <div className="schedule-section-label"><h3 id={`${kind}-scope-title`}>适用范围</h3><span>{isTable ? '按班级发布' : '全校生效'}</span></div>
      <div className="form-grid schedule-scope">
        <label>学期<select value={semesterID} onChange={e => { setSemesterID(Number(e.target.value)); setWeeks([]); setFile(null) }}>{state.semesters.map(t => <option key={t.semesterID} value={t.semesterID}>{t.schoolYear} · {t.season === 'autumn' ? '秋季' : '春季'}</option>)}</select></label>
        {isTable && <label>班级<select value={classScope} onChange={e => { setClassScope(e.target.value); setWeeks([]); setFile(null) }}>{directory.classes.map(s => <option key={scopeKey(s)} value={scopeKey(s)}>{scopeLabel(s,directory)}</option>)}</select></label>}
      </div>
      <div className="schedule-current-record">
        <span className="schedule-file-icon" aria-hidden="true"><ScheduleIcon name={isTable ? 'table' : 'calendar'} /></span>
        <div><span>{activeVersion ? isTable ? '当前常规课表' : '当前校历' : '尚无生效文件'}</span><strong>{activeVersion?.originalName || (isTable ? '为此班级上传常规课表' : '为本学期上传校历')}</strong></div>
        {isTable && <span className={`schedule-week-summary ${overrideCount ? 'has-overrides' : ''}`}>{overrideCount ? `${overrideCount} 周临时覆盖` : `${weekCount} 个教学周`}</span>}
      </div>
    </section>
    <div key={mode} className="schedule-mode-content">
      {mode === 'temporary' && isTable && <div className="demo-callout schedule-guidance"><ScheduleIcon name="info" /><p>上传一个星期的 ICS，替换所选教学周的整周课表。空课表表示该周无课；新覆盖会保留旧版本。{!table && ' 请先发布常规课表。'}</p></div>}
      {isTable && (mode === 'temporary' || mode === 'history') && <fieldset className="week-picker"><legend><span>{mode === 'history' ? '选择要撤销的临时覆盖周' : '应用到教学周'}</span><small>{weeks.length ? `已选择 ${weeks.length} 周` : '可选择多个教学周'}</small></legend><div className="week-picker-grid">{Array.from({length:weekCount},(_,i) => i+1).map(w => { const overridden = table?.overrides.some(o => o.weekNo === w); return <label key={w} className={`${overridden ? 'overridden' : ''} ${weeks.includes(w) ? 'selected' : ''}`}><input type="checkbox" checked={weeks.includes(w)} onChange={e => setWeeks(e.target.checked ? [...weeks,w] : weeks.filter(v=>v!==w))} /><span><small>第</small>{w}<small>周</small></span>{overridden && <i title="已有临时覆盖" />}</label>})}</div></fieldset>}
      {(mode === 'base' || (mode === 'temporary' && isTable)) && <form className="schedule-publish-form" onSubmit={publish}>
        <div className="schedule-section-label"><h3>{mode === 'temporary' ? '上传临时课表' : isTable ? '上传常规课表' : '上传校历文件'}</h3><span>ICS</span></div>
        <FileImport key={`${kind}-${mode}-${semesterID}-${classScope}`} kind="ics" label="选择 ICS 文件" onReady={setFile} onClear={()=>setFile(null)} disabled={busy} preview={result=><p className="demo-callout schedule-file-summary"><ScheduleIcon name="check" /><span>{isTable?'按所选学期与完整班级保存':'替换当前校历，旧版本保留'} · {result.summary}</span></p>} />
        <div className="schedule-form-footer"><p>{mode === 'temporary' ? weeks.length ? `将覆盖 ${weeks.length} 个教学周` : '请先选择要覆盖的教学周' : '发布会生成新版本，已有记录仍可恢复'}</p><button type="submit" className="primary-action" disabled={!term || !file || busy || (isTable && mode === 'temporary' && (!table || !weeks.length))}><ScheduleIcon name="upload" />{busy ? '正在读取…' : mode === 'temporary' ? '发布临时课表' : isTable ? '发布常规课表' : '发布校历'}</button></div>
      </form>}
      {mode === 'temporary' && !isTable && <form className="form-grid schedule-arrangement-form" onSubmit={publishArrangement}>
        <div className="schedule-section-label full-row"><h3>安排详情</h3><span>合并至当前校历</span></div>
        <p className="full-row demo-callout schedule-guidance"><ScheduleIcon name="info" /><span>临时安排会保存为完整的新版本，可从版本记录恢复。</span></p>
        <label className="full-row">安排名称<input name="title" required maxLength={200} placeholder="例如：教学楼临时检修" /></label>
        <label>开始时间<input name="start" required type="datetime-local" /></label><label>结束时间<input name="end" required type="datetime-local" /></label>
        <label className="full-row">地点<input name="location" placeholder="选填，例如：教学楼 A201" /></label>
        <div className="schedule-form-footer full-row"><p>{activeVersionID ? '仅新增此项安排，不影响其他校历内容' : '请先上传本学期校历'}</p><button className="primary-action" type="submit" disabled={busy || !activeVersionID}><ScheduleIcon name="plus" />发布临时安排</button></div>
      </form>}
      {mode === 'history' && <section className="schedule-history" aria-labelledby={`${kind}-history-title`}>
        <div className="schedule-section-label"><h3 id={`${kind}-history-title`}>{isTable ? '版本与整周覆盖' : '校历版本'}</h3><span>{versions.length} 个版本</span></div>
        {isTable && <div className="schedule-override-actions"><p>{overrideCount ? `当前有 ${overrideCount} 周使用临时课表` : '当前没有临时覆盖'}</p><button type="button" className="quiet-action" disabled={!weeks.length || !table} onClick={async () => { if (await run({ action:'cancel_temporary', weeks })) setWeeks([]) }}>撤销所选周覆盖{weeks.length ? `（${weeks.length}）` : ''}</button></div>}
        <div className="demo-record-list">{versions.map(v => <div className="schedule-version-row" key={v.versionID}><span className="schedule-version-icon"><ScheduleIcon name={v.kind === 'temporary' ? 'clock' : 'document'} /></span><div className="schedule-version-copy"><strong>{v.originalName}</strong><small>{v.kind === 'temporary' ? '临时覆盖' : '常规版本'} · {new Date(v.createdAt).toLocaleDateString('zh-CN')}</small></div>{activeVersionID === v.versionID && <span className="schedule-version-active">使用中</span>}<div className="demo-row-actions"><button type="button" onClick={()=>download(v)}><ScheduleIcon name="download" />下载</button>{v.kind !== 'temporary' && <button type="button" disabled={activeVersionID === v.versionID} onClick={()=>run({ action:isTable?'restore_base':'restore', versionID:v.versionID })}><ScheduleIcon name="restore" />{activeVersionID === v.versionID ? '当前版本' : '恢复此版本'}</button>}</div></div>)}{!versions.length && <div className="schedule-empty"><ScheduleIcon name="document" /><strong>尚无版本记录</strong><p>{isTable ? '发布常规课表后可在这里下载或恢复。' : '上传校历后可在这里下载或恢复。'}</p></div>}</div>
      </section>}
    </div>
    <details className="demo-term-editor"><summary><span><ScheduleIcon name="settings" />学期设置</span><ScheduleIcon name="chevron" /></summary><SemesterEditor showToast={showToast} /></details>
  </article>
}
function ScheduleIcon({name}) {
  const paths={table:<><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M9 9v11M15 9v11M8 2v4M16 2v4"/></>,calendar:<><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 9h18M7 13h3M14 13h3M7 17h3"/></>,info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.01"/></>,check:<path d="m5 12 4 4L19 6"/>,upload:<><path d="M12 16V3m-5 5 5-5 5 5"/><path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5"/></>,plus:<path d="M12 5v14M5 12h14"/>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,document:<><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>,download:<><path d="M12 3v13m-5-5 5 5 5-5"/><path d="M5 17v3h14v-3"/></>,restore:<><path d="M4 10a8 8 0 1 1 2 7M4 4v6h6"/></>,settings:<><path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/></>,chevron:<path d="m7 9 5 5 5-5"/>}
  return <svg className="schedule-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
function SemesterEditor({showToast}) {
  const {state,execute} = useSchoolDemo()
  const [editID,setEditID] = useState('new')
  const term = state.semesters.find(t=>t.semesterID===Number(editID))
  async function save(e) {
    e.preventDefault(); const f=Object.fromEntries(new FormData(e.currentTarget))
    try { await execute('semesters',term?'PATCH':'POST',{...f,...(term?{id:term.semesterID,version:term?.version}:{})}); showToast('学期已保存。') } catch(error) {showToast(error.message,'warning')}
  }
  return <><label className="demo-select-label">编辑学期<select value={editID} onChange={e=>setEditID(e.target.value)}><option value="new">新增学期</option>{state.semesters.map(t=><option key={t.semesterID} value={t.semesterID}>{t.schoolYear} · {t.season==='autumn'?'秋季':'春季'}</option>)}</select></label>
    <form key={editID} className="form-grid" onSubmit={save}>
      <label>学年<input name="schoolYear" required defaultValue={term?.schoolYear} placeholder="2027-2028" /></label><label>学期<select name="season" defaultValue={term?.season||'autumn'}><option value="autumn">秋季</option><option value="spring">春季</option></select></label>
      <label>开始日期<input name="startDate" type="date" required defaultValue={term?.startDate} /></label><label>结束日期<input name="endDate" type="date" required defaultValue={term?.endDate} /></label><label>首个教学周周一<input name="firstMonday" type="date" required defaultValue={term?.firstMonday} /></label><button type="submit" className="primary-action">保存学期</button>
    </form></>
}
