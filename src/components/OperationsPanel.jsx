import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import AdApprovalPanel from './AdApprovalPanel.jsx'
import NoticeDemoPanel from './NoticeDemoPanel.jsx'
import ScheduleDemoPanel from './ScheduleDemoPanel.jsx'
import HoverQuickControl from './HoverQuickControl.jsx'
import SlidingSelection from './SlidingSelection.jsx'

const consoleModules = [
  { id:'notice',icon:'notice',label:'通知发布',description:'发布、编辑与撤回',shortcuts:[['important','发布重要通知'],['short','发布短通知']] },
  { id:'ads',icon:'ads',label:'广告审批',description:'审核与撤下投放',shortcuts:[['pending','待审批'],['all','全部广告']] },
  { id:'timetable',icon:'timetable',label:'课表管理',description:'常规课表与整周覆盖',shortcuts:[['temporary','发布临时课表'],['history','版本与覆盖']] },
  { id:'calendar',icon:'calendar',label:'校历管理',description:'校历与临时安排',shortcuts:[['temporary','发布临时安排'],['history','版本记录']] },
]
export default function OperationsPanel({activeModule='notice',onModuleChange,advertisements=[],onReviewDecision,requestedAdID}) {
  const [toast,setToast]=useState(null)
  const [noticeShortcut,setNoticeShortcut]=useState('short')
  const [noticeKey,setNoticeKey]=useState(0)
  const [adStatusFilter,setAdStatusFilter]=useState('pending')
  const [scheduleModes,setScheduleModes]=useState({timetable:'base',calendar:'base'})
  const railRef=useRef(null),toastTimer=useRef(null)
  function showToast(message,type='success'){setToast({message,type});window.clearTimeout(toastTimer.current);toastTimer.current=window.setTimeout(()=>setToast(null),2600)}
  function shortcut(module,id){
    if(module==='notice'){setNoticeShortcut(id);setNoticeKey(k=>k+1)}
    else if(module==='ads')setAdStatusFilter(id)
    else setScheduleModes(m=>({...m,[module]:id}))
    onModuleChange(module)
  }
  return <>
    {toast&&createPortal(<div className={`top-toast ${toast.type}`} role="status"><span className="toast-dot" />{toast.message}</div>,document.body)}
    <section className="console-workbench">
      <aside className="console-module-rail" aria-label="控制台模块"><nav ref={railRef}>
        <SlidingSelection containerRef={railRef} activeKey={activeModule} />
        {consoleModules.map(module=><div key={module.id} className={`module-nav-item ${activeModule===module.id?'active':''}`}>
          <button className="module-nav-button" type="button" data-selection-key={module.id} aria-current={activeModule===module.id?'page':undefined} onClick={()=>onModuleChange(module.id)}>
            <span className="module-index" aria-hidden="true"><span className={`module-icon ${module.icon}`} /></span><span className="module-copy"><strong>{module.label}</strong><small>{module.description}</small></span>
            {module.id==='ads'&&<span className="module-badge">{advertisements.filter(a=>a.status==='pending').length}</span>}
          </button>
          <HoverQuickControl label={`${module.label}快捷操作`}>{module.shortcuts.map(([id,label])=><button key={id} type="button" data-close-quick onClick={()=>shortcut(module.id,id)}>{label}</button>)}</HoverQuickControl>
        </div>)}
      </nav><p>本地演示 · 数据仅保留在本次登录中。未连接服务器。</p></aside>
      <div className="console-module-stage">
        {activeModule==='notice'&&<NoticeDemoPanel key={noticeKey} initialType={noticeShortcut} showToast={showToast} />}
        {activeModule==='ads'&&<AdApprovalPanel key={requestedAdID||'ads'} initialAdID={requestedAdID} advertisements={advertisements} onReviewDecision={onReviewDecision} statusFilter={adStatusFilter} onStatusFilterChange={setAdStatusFilter} showToast={showToast} />}
        {['timetable','calendar'].includes(activeModule)&&<ScheduleDemoPanel key={activeModule} kind={activeModule} mode={scheduleModes[activeModule]} onModeChange={mode=>setScheduleModes(m=>({...m,[activeModule]:mode}))} showToast={showToast} />}
      </div>
    </section>
  </>
}
