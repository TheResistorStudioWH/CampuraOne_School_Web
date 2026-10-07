import { useMemo, useState } from 'react'
import { useSchoolDemo } from '../demo/DemoContext.jsx'
import HoverQuickControl from './HoverQuickControl.jsx'

const options=[['all','全部'],['pending','待审批'],['approved','已批准'],['rejected','已驳回'],['withdrawn','已撤下']]
const labels=Object.fromEntries(options)
const priority={pending:0,rejected:1,approved:2,withdrawn:3}
const actionLabels={approve:'批准投放',reject:'驳回',edit_reason:'修改驳回原因',undo_rejection:'撤销驳回',withdraw:'撤下广告',resubmit:'重新送审'}
const allowedActions={pending:['reject','approve'],approved:['withdraw'],rejected:['edit_reason','undo_rejection'],withdrawn:['resubmit']}
const formatDate=value=>value?new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value)):'长期'

export default function AdApprovalPanel({advertisements,initialAdID=null,onReviewDecision,statusFilter,onStatusFilterChange,showToast}) {
  const {state}=useSchoolDemo()
  const [query,setQuery]=useState(''),[sortBy,setSortBy]=useState('status'),[direction,setDirection]=useState('primary')
  const [selectedID,setSelectedID]=useState(initialAdID),[editor,setEditor]=useState(null),[reason,setReason]=useState('')
  const counts=Object.fromEntries(options.map(([id])=>[id,id==='all'?advertisements.length:advertisements.filter(a=>a.status===id).length]))
  const rows=useMemo(()=>advertisements.filter(a=>(statusFilter==='all'||a.status===statusFilter)&&[a.shopName,a.orderNumber,a.adID,a.packageName].join(' ').toLowerCase().includes(query.trim().toLowerCase())).sort((a,b)=>{
    const cmp=sortBy==='shopName'?a.shopName.localeCompare(b.shopName,'zh-CN'):sortBy==='submittedAt'?Date.parse(b.submittedAt)-Date.parse(a.submittedAt):sortBy==='adSize'?a.type.localeCompare(b.type):priority[a.status]-priority[b.status]
    return (direction==='primary'?1:-1)*(cmp||a.adID-b.adID)
  }),[advertisements,statusFilter,query,sortBy,direction])
  const selected=rows.find(a=>a.adID===selectedID)||rows[0]
  function select(id){setSelectedID(id);setEditor(null);setReason('')}
  function changeFilter(id){onStatusFilterChange(id);select(null)}
  function commit(action) {
    if(!selected)return
    try {
      onReviewDecision(selected.adID,action,reason.trim())
      showToast(`已${{approve:'批准投放',reject:'驳回',withdraw:'撤下',resubmit:'重新送审',edit_reason:'更新原因',undo_rejection:'撤销驳回'}[action]} · AD-${selected.adID}`)
      if(action!=='edit_reason')setSelectedID(rows.find(a=>a.adID!==selected.adID)?.adID||null)
      setEditor(null);setReason('')
    }catch(error){showToast(error.message,'warning')}
  }
  function act(action) {
    if(['reject','withdraw','edit_reason'].includes(action)){setEditor(action);setReason(action==='edit_reason'?selected.reason:'')}
    else commit(action)
  }
  const history=state.logs.filter(l=>l.resource==='advertisement'&&l.resourceID===selected?.adID)
  return <section className="approval-module" aria-labelledby="ad-approval-heading">
    <header className="module-heading-row"><div><p className="eyebrow">商户投放 · 演示</p><h2 id="ad-approval-heading">广告审批</h2><p>查看素材、核对投放，完成审核。</p></div><div className="approval-summary-pill"><strong>{counts.pending}</strong><span>条待处理</span></div></header>
    <div className="approval-toolbar">
      <div className="approval-filter-group" role="group" aria-label="审批状态筛选" data-active-status={statusFilter} style={{'--filter-total':options.length,'--filter-index':options.findIndex(([id])=>id===statusFilter)}}>
        <span className="approval-filter-indicator" aria-hidden="true" />
        {options.map(([id,label])=><div className={`filter-option-cell ${statusFilter===id?'active':''}`} key={id}>
          <button type="button" aria-pressed={statusFilter===id} className={statusFilter===id?'active':''} onClick={()=>changeFilter(id)}>{label}<span className={`filter-count ${id}`}>{counts[id]}</span></button>
          {id===statusFilter&&selected&&id!=='all'&&<HoverQuickControl kind="status" label={`${label}快捷操作`}>{allowedActions[id].map(action=><button key={action} type="button" data-close-quick onClick={()=>act(action)}>{actionLabels[action]}</button>)}</HoverQuickControl>}
        </div>)}
      </div>
      <label className="approval-search"><span className="approval-search-prefix" aria-hidden="true"><span className="search-prefix-icon" /></span><input type="search" aria-label="搜索广告" value={query} onChange={e=>{setQuery(e.target.value);select(null)}} placeholder="搜索商户、广告或报价单号" /></label>
    </div>
    <div className="approval-workspace">
      <section className="approval-list-panel" aria-label="广告审批列表">
        <div className="approval-list-caption"><strong>{rows.length} 条申请</strong><div className="approval-sort-controls">
          <select aria-label="排序依据" value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="status">审批状态</option><option value="shopName">商户名称</option><option value="submittedAt">提交时间</option><option value="adSize">广告尺寸</option></select>
          <select aria-label="排序方向" value={direction} onChange={e=>setDirection(e.target.value)}><option value="primary">正序</option><option value="secondary">倒序</option></select>
        </div></div>
        <div className="approval-list-scroll">{rows.map(a=><button key={a.adID} type="button" className={`approval-list-item ${selected?.adID===a.adID?'selected':''}`} onClick={()=>select(a.adID)}>
          <span className="shop-category-tile" aria-hidden="true">{a.shopName.slice(0,1)}</span><span className="approval-list-copy"><strong>{a.shopName}</strong><span>{a.type==='L'?'首页横幅':'方形卡片'} · {formatDate(a.startTime).split(' ')[0]}</span><small>AD-{a.adID} · {formatDate(a.submittedAt)}</small></span><span className={`review-status ${a.status}`}>{labels[a.status]}</span>
        </button>)}{!rows.length&&<div className="approval-empty-state"><strong>没有符合条件的广告</strong><p>试试切换状态或清空搜索。</p></div>}</div>
      </section>
      <section className="approval-detail-panel" aria-live="polite">
        {selected?<>
          <div className="review-detail-heading"><div><p className="eyebrow">AD-{selected.adID}</p><h3>{selected.shopName}</h3></div><span className={`review-status ${selected.status}`}>{labels[selected.status]}</span></div>
          <figure className={`ad-creative-preview ${selected.type==='L'?'large':'small'}`} aria-label="演示广告素材"><div className="creative-copy"><strong>{selected.packageName}</strong><small>DEMO · 素材占位</small></div></figure>
          <dl className="review-facts">
            <div><dt>投放位置</dt><dd>{selected.type==='L'?'首页横幅 · 3:1':'方形卡片 · 1:1'}</dd></div>
            <div><dt>投放周期</dt><dd>{formatDate(selected.startTime)} — {formatDate(selected.endTime)}</dd></div>
            <div><dt>报价</dt><dd className="detail-price">{selected.amount===null?'未报价':`¥${Number(selected.amount).toLocaleString()}`}<small>付款尚未接入</small></dd></div>
          </dl>
          {selected.reason&&<div className={`review-history ${selected.status}`}><span>{selected.status==='withdrawn'?'撤下原因':'驳回原因'}</span><strong>{selected.reason}</strong></div>}
          <details className="review-secondary-details"><summary>申请信息与操作记录</summary><dl><div><dt>报价单</dt><dd>{selected.orderNumber||'未关联'}</dd></div><div><dt>首次提交</dt><dd>{formatDate(selected.submittedAt)}</dd></div><div><dt>促销引用</dt><dd>SALE-{selected.saleID}</dd></div><div><dt>素材地址</dt><dd className="creative-source">{selected.img}</dd></div></dl><div className="review-audit-list">{history.map(l=><p key={l.logID}><span>{actionLabels[l.action]||l.action}</span><time>{formatDate(l.createdAt)}</time></p>)}{!history.length&&<p>尚无演示操作记录</p>}</div></details>
          <div className="review-decision-bar">
            {editor?<div className="review-reason-form"><label>{editor==='withdraw'?'撤下原因（必填）':editor==='edit_reason'?'驳回原因':'驳回原因（选填）'}<textarea aria-label="审核原因" rows={2} maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)} placeholder="填写可供商户改进或核对的原因" /></label><div className="approval-actions"><button className="quiet-action" onClick={()=>setEditor(null)}>取消</button><button className="confirm-reject-action" disabled={editor==='withdraw'&&!reason.trim()} onClick={()=>commit(editor)}>{editor==='edit_reason'?'保存原因':actionLabels[editor]}</button></div></div>:<><span className="review-decision-hint">{selected.status==='pending'?'核对素材与时间后处理':selected.status==='withdrawn'?'重新送审后需再次审批':'操作将保留在演示记录中'}</span><div className="approval-actions">{allowedActions[selected.status].map(action=><button key={action} type="button" className={['approve','resubmit'].includes(action)?'primary-approve-action':'quiet-action'} onClick={()=>act(action)}>{actionLabels[action]}</button>)}</div></>}
          </div>
        </>:<div className="approval-detail-empty"><strong>暂无可审核内容</strong><p>选择一条申请查看素材和投放信息。</p></div>}
      </section>
    </div>
  </section>
}
