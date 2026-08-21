import { useMemo, useState } from 'react'

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已驳回' },
]

const statusLabels = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已驳回',
}

const statusSortPriority = {
  pending: 0,
  approved: 1,
  rejected: 2,
}

const sizeSortPriority = {
  L: 0,
  S: 1,
}

const sortDirectionOptions = {
  status: [
    { value: 'primary', label: '待审批优先' },
    { value: 'secondary', label: '已驳回优先' },
  ],
  shopName: [
    { value: 'primary', label: '拼音 A–Z' },
    { value: 'secondary', label: '拼音 Z–A' },
  ],
  submittedAt: [
    { value: 'primary', label: '最近优先' },
    { value: 'secondary', label: '更早优先' },
  ],
  adSize: [
    { value: 'primary', label: '先大后小' },
    { value: 'secondary', label: '先小后大' },
  ],
}

const chineseNameCollator = new Intl.Collator('zh-CN', {
  numeric: true,
  sensitivity: 'base',
})

const shopCategoryRules = [
  { keywords: ['文具', '便利'], label: '文具便利', icon: '✎', tone: 'stationery' },
  { keywords: ['咖啡', '茶', '饮品'], label: '餐饮饮品', icon: '☕', tone: 'beverage' },
  { keywords: ['图文', '打印', '印刷'], label: '图文印刷', icon: '▤', tone: 'printing' },
  { keywords: ['体育', '运动'], label: '体育用品', icon: '⚽︎', tone: 'sports' },
  { keywords: ['烘焙', '面包'], label: '烘焙餐饮', icon: '♨︎', tone: 'bakery' },
  { keywords: ['洗衣'], label: '洗衣服务', icon: '◎', tone: 'laundry' },
  { keywords: ['摄影', '照相'], label: '摄影服务', icon: '⌾', tone: 'photography' },
]

function AdApprovalPanel({
  advertisements,
  onReviewDecision,
  statusFilter,
  onStatusFilterChange,
  showToast,
}) {
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState('status')
  const [sortDirection, setSortDirection] = useState('primary')
  const [selectedAdID, setSelectedAdID] = useState(null)
  const [isRejecting, setIsRejecting] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [isQuickReasonEditing, setIsQuickReasonEditing] = useState(false)
  const [quickRejectionReason, setQuickRejectionReason] = useState('')

  const statusCounts = useMemo(() => (
    advertisements.reduce((counts, item) => {
      counts.all += 1
      counts[item.status] += 1
      return counts
    }, { all: 0, pending: 0, approved: 0, rejected: 0 })
  ), [advertisements])

  const filteredAdvertisements = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const matchingAdvertisements = advertisements.filter((item) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const searchableText = [
        item.adID,
        item.saleID,
        item.mainShop?.shopName,
        item.saleEvent?.saleRule,
        item.order?.orderID,
      ].join(' ').toLowerCase()

      return matchesStatus && (!normalizedQuery || searchableText.includes(normalizedQuery))
    })

    return matchingAdvertisements.sort((leftItem, rightItem) => {
      let comparison = 0

      if (sortBy === 'status') {
        comparison = statusSortPriority[leftItem.status] - statusSortPriority[rightItem.status]
      }

      if (sortBy === 'shopName') {
        comparison = chineseNameCollator.compare(
          leftItem.mainShop?.shopName || '',
          rightItem.mainShop?.shopName || '',
        )
      }

      if (sortBy === 'submittedAt') {
        const leftTime = Date.parse(leftItem.review?.submittedAt || '')
        const rightTime = Date.parse(rightItem.review?.submittedAt || '')
        comparison = (Number.isNaN(rightTime) ? 0 : rightTime)
          - (Number.isNaN(leftTime) ? 0 : leftTime)
      }

      if (sortBy === 'adSize') {
        comparison = sizeSortPriority[leftItem.type] - sizeSortPriority[rightItem.type]
      }

      if (comparison === 0) {
        comparison = Number(leftItem.adID) - Number(rightItem.adID)
      }

      return sortDirection === 'primary' ? comparison : -comparison
    })
  }, [advertisements, query, sortBy, sortDirection, statusFilter])

  const selectedAdvertisement = filteredAdvertisements.find((item) => item.adID === selectedAdID)
    || filteredAdvertisements[0]
    || null

  function selectAdvertisement(adID) {
    setSelectedAdID(adID)
    setIsRejecting(false)
    setRejectionReason('')
    setIsQuickReasonEditing(false)
    setQuickRejectionReason('')
  }

  function changeStatusFilter(nextStatus) {
    onStatusFilterChange(nextStatus)
    setSelectedAdID(null)
    setIsRejecting(false)
    setRejectionReason('')
    setIsQuickReasonEditing(false)
    setQuickRejectionReason('')
  }

  function approveAdvertisement() {
    if (!selectedAdvertisement) return

    selectNextAdvertisement(selectedAdvertisement.adID)
    onReviewDecision(selectedAdvertisement.adID, 'approved', '')
    showToast(`已批准广告 AD-${selectedAdvertisement.adID}，仪表盘数据已同步。`)
  }

  function rejectAdvertisement() {
    if (!selectedAdvertisement) return

    selectNextAdvertisement(selectedAdvertisement.adID)
    onReviewDecision(selectedAdvertisement.adID, 'rejected', rejectionReason.trim())
    showToast(
      rejectionReason.trim()
        ? `已驳回广告 AD-${selectedAdvertisement.adID}，并记录驳回原因。`
        : `已驳回广告 AD-${selectedAdvertisement.adID}，未填写原因。`,
      'warning',
    )
    setIsRejecting(false)
    setRejectionReason('')
    setIsQuickReasonEditing(false)
    setQuickRejectionReason('')
  }

  function startQuickReasonEdit() {
    if (!selectedAdvertisement) {
      showToast('请先选择一条已驳回广告。', 'warning')
      return
    }

    setQuickRejectionReason(selectedAdvertisement.review?.reason || '')
    setIsQuickReasonEditing(true)
  }

  function saveQuickRejectionReason() {
    if (!selectedAdvertisement) {
      showToast('请先选择一条已驳回广告。', 'warning')
      return
    }

    onReviewDecision(selectedAdvertisement.adID, 'rejected', quickRejectionReason.trim())
    showToast(`已更新广告 AD-${selectedAdvertisement.adID} 的驳回原因。`)
    setIsQuickReasonEditing(false)
  }

  function undoRejection() {
    if (!selectedAdvertisement) {
      showToast('请先选择一条已驳回广告。', 'warning')
      return
    }

    const currentAdID = selectedAdvertisement.adID
    selectNextAdvertisement(currentAdID)
    onReviewDecision(currentAdID, 'pending', '')
    showToast(`已撤销广告 AD-${currentAdID} 的驳回，状态恢复为待审批。`)
  }

  function selectNextAdvertisement(currentAdID) {
    const nextAdvertisement = filteredAdvertisements.find((item) => item.adID !== currentAdID)
    setSelectedAdID(nextAdvertisement?.adID || null)
    setIsRejecting(false)
    setRejectionReason('')
  }

  return (
    <section className="approval-module" aria-labelledby="ad-approval-heading">
      <header className="module-heading-row">
        <div>
          <p className="eyebrow">Advertisement Review</p>
          <h2 id="ad-approval-heading">广告审批</h2>
          <p>核对投放时间、广告位类型、商户与促销事件后完成审批。</p>
        </div>
        <div className="approval-summary-pill">
          <strong>{statusCounts.pending}</strong>
          <span>条待处理</span>
        </div>
      </header>

      <div className="approval-toolbar">
        <div
          className="approval-filter-group"
          role="group"
          aria-label="审批状态筛选"
          data-active-status={statusFilter}
        >
          <span className="approval-filter-indicator" aria-hidden="true" />
          {statusOptions.map((option) => {
            const isActive = statusFilter === option.value

            return (
              <div key={option.value} className={`filter-option-cell ${isActive ? 'active' : ''}`}>
                <button
                  type="button"
                  className={isActive ? 'active' : ''}
                  aria-pressed={isActive}
                  onClick={() => changeStatusFilter(option.value)}
                >
                  {option.label}
                  <span className={`filter-count ${option.value}`}>{statusCounts[option.value]}</span>
                </button>

                {isActive && (
                  <StatusFilterQuickControl
                    key={`${option.value}-${selectedAdvertisement?.adID || 'none'}`}
                    status={option.value}
                    selectedAdvertisement={selectedAdvertisement}
                    isReasonEditing={isQuickReasonEditing}
                    reason={quickRejectionReason}
                    onReasonChange={setQuickRejectionReason}
                    onQuickApprove={approveAdvertisement}
                    onQuickReject={rejectAdvertisement}
                    onStartReasonEdit={startQuickReasonEdit}
                    onCancelReasonEdit={() => setIsQuickReasonEditing(false)}
                    onSaveReason={saveQuickRejectionReason}
                    onUndoReject={undoRejection}
                  />
                )}
              </div>
            )
          })}
        </div>

        <label className="approval-search">
          <span className="approval-search-prefix" aria-hidden="true">
            <span className="search-prefix-icon" />
          </span>
          <input
            type="search"
            aria-label="搜索广告"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSelectedAdID(null)
              setIsRejecting(false)
              setRejectionReason('')
              setIsQuickReasonEditing(false)
              setQuickRejectionReason('')
            }}
            placeholder="搜索商户、促销、广告或订单编号"
          />
        </label>
      </div>

      <div className="approval-workspace">
        <section className="approval-list-panel" aria-label="广告审批列表">
          <div className="approval-list-caption">
            <strong>{filteredAdvertisements.length} 条结果</strong>
            <div className="approval-sort-controls" role="group" aria-label="广告列表排序">
              <label>
                <span>依据</span>
                <select
                  aria-label="排序依据"
                  value={sortBy}
                  onChange={(event) => {
                    setSortBy(event.target.value)
                    setSortDirection('primary')
                    setSelectedAdID(null)
                  }}
                >
                  <option value="status">审批状态</option>
                  <option value="shopName">商户名称</option>
                  <option value="submittedAt">提交时间</option>
                  <option value="adSize">广告尺寸</option>
                </select>
              </label>

              <label>
                <span>方向</span>
                <select
                  aria-label="排序方向"
                  value={sortDirection}
                  onChange={(event) => {
                    setSortDirection(event.target.value)
                    setSelectedAdID(null)
                  }}
                >
                  {sortDirectionOptions[sortBy].map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="approval-list-scroll">
            {filteredAdvertisements.map((item) => (
              <button
                key={item.adID}
                type="button"
                className={`approval-list-item ${selectedAdvertisement?.adID === item.adID ? 'selected' : ''}`}
                onClick={() => selectAdvertisement(item.adID)}
              >
                <ShopCategoryIcon shopName={item.mainShop?.shopName} />
                <span className="approval-list-copy">
                  <strong>{item.mainShop?.shopName || '未知商户'}</strong>
                  <span>{item.saleEvent?.saleRule || '促销活动'}</span>
                  <small>AD-{item.adID} · 提交于 {formatDateTime(item.review?.submittedAt)}</small>
                </span>
                <span className="approval-list-badges">
                  <span className="ad-size-badge" aria-label={`${item.type} 型广告位`}>{item.type}</span>
                  <span className={`review-status ${item.status}`}>
                    {statusLabels[item.status]}
                  </span>
                </span>
              </button>
            ))}

            {filteredAdvertisements.length === 0 && (
              <div className="approval-empty-state">
                <strong>没有符合条件的广告</strong>
                <p>可以清空搜索词或切换审批状态。</p>
              </div>
            )}
          </div>
        </section>

        <section className="approval-detail-panel" aria-live="polite">
          {selectedAdvertisement ? (
            <AdvertisementDetail
              advertisement={selectedAdvertisement}
              isRejecting={isRejecting}
              rejectionReason={rejectionReason}
              onRejectionReasonChange={setRejectionReason}
              onApprove={approveAdvertisement}
              onStartReject={() => setIsRejecting(true)}
              onCancelReject={() => {
                setIsRejecting(false)
                setRejectionReason('')
              }}
              onConfirmReject={rejectAdvertisement}
            />
          ) : (
            <div className="approval-detail-empty">
              <strong>暂无可预览内容</strong>
              <p>列表中出现广告后，可在这里查看完整投放信息。</p>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

function StatusFilterQuickControl({
  status,
  selectedAdvertisement,
  isReasonEditing,
  reason,
  onReasonChange,
  onQuickApprove,
  onQuickReject,
  onStartReasonEdit,
  onCancelReasonEdit,
  onSaveReason,
  onUndoReject,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const hasActions = status === 'pending' || status === 'rejected'
  const hasSelection = Boolean(selectedAdvertisement)

  if (!hasActions) {
    return <span className="status-quick-control empty" aria-hidden="true" />
  }

  return (
    <div className={`status-quick-control ${isOpen || isReasonEditing ? 'open' : ''}`}>
      <button
        type="button"
        className="status-quick-trigger"
        aria-label={`${statusLabels[status]}快捷操作`}
        aria-expanded={isOpen || isReasonEditing}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
      />

      <div className="status-quick-menu" aria-label={`${statusLabels[status]}快捷操作`}>
        {!hasSelection && <small>请先选择一条广告</small>}

        {status === 'pending' && (
          <>
            <button type="button" disabled={!hasSelection} onClick={onQuickApprove}>快捷批准</button>
            <button type="button" disabled={!hasSelection} onClick={onQuickReject}>快捷驳回</button>
          </>
        )}

        {status === 'rejected' && !isReasonEditing && (
          <>
            <button type="button" disabled={!hasSelection} onClick={onStartReasonEdit}>补充驳回原因</button>
            <button type="button" disabled={!hasSelection} onClick={onUndoReject}>撤销驳回</button>
          </>
        )}

        {status === 'rejected' && isReasonEditing && (
          <div className="status-quick-reason-editor">
            <label>
              <span>驳回原因</span>
              <textarea
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="补充或修改驳回原因"
                rows="2"
              />
            </label>
            <div>
              <button type="button" onClick={onCancelReasonEdit}>取消</button>
              <button type="button" onClick={onSaveReason}>保存</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ShopCategoryIcon({ shopName = '' }) {
  const category = shopCategoryRules.find((rule) => (
    rule.keywords.some((keyword) => shopName.includes(keyword))
  )) || { label: '通用商店', icon: '⌂', tone: 'general' }

  return (
    <span
      className={`shop-category-tile ${category.tone}`}
      aria-label={`${category.label}商户`}
      title={category.label}
    >
      {category.icon}
    </span>
  )
}

function AdvertisementDetail({
  advertisement,
  isRejecting,
  rejectionReason,
  onRejectionReasonChange,
  onApprove,
  onStartReject,
  onCancelReject,
  onConfirmReject,
}) {
  const isPending = advertisement.status === 'pending'

  return (
    <>
      <div className={`ad-creative-preview ${advertisement.type === 'L' ? 'large' : 'small'}`}>
        <div className="creative-badge">{advertisement.type === 'L' ? 'L · 横幅广告' : 'S · 方形广告'}</div>
        <div className="creative-copy">
          <span>{advertisement.mainShop?.shopName}</span>
          <strong>{advertisement.saleEvent?.saleRule}</strong>
          <small>虚构素材预览</small>
        </div>
      </div>

      <div className="approval-detail-title">
        <div>
          <span className={`review-status ${advertisement.status}`}>
            {statusLabels[advertisement.status]}
          </span>
          <h3>{advertisement.saleEvent?.saleRule || '促销活动'}</h3>
          <p>{advertisement.mainShop?.shopName} · AD-{advertisement.adID}</p>
        </div>
        <strong className="detail-price">¥{advertisement.order?.price?.toLocaleString() || 0}</strong>
      </div>

      <dl className="approval-metadata-grid">
        <Metadata label="促销事件" value={`SALE-${advertisement.saleID}`} />
        <Metadata label="订单编号" value={advertisement.order?.orderID} />
        <Metadata label="广告位" value={advertisement.type === 'L' ? 'L · 横幅 3:1' : 'S · 方形 1:1'} />
        <Metadata label="购买方案" value={advertisement.order?.packageName} />
        <Metadata label="开始时间" value={formatDateTime(advertisement.startTime)} />
        <Metadata label="结束时间" value={formatDateTime(advertisement.endTime)} />
        <Metadata label="商户地址" value={advertisement.mainShop?.shopAddress?.join(' · ')} />
        <Metadata label="提交时间" value={formatDateTime(advertisement.review?.submittedAt)} />
      </dl>

      <div className="creative-url-row">
        <span>素材地址</span>
        <code>{advertisement.img}</code>
      </div>

      {advertisement.status === 'rejected' && (
        <div className="review-history rejected">
          <span>驳回原因</span>
          <strong>{advertisement.review?.reason || '未填写原因'}</strong>
        </div>
      )}

      {advertisement.status === 'approved' && (
        <div className="review-history approved">
          <span>审批记录</span>
          <strong>{formatDateTime(advertisement.review?.reviewedAt)} · {advertisement.review?.reviewer}</strong>
        </div>
      )}

      {isPending && !isRejecting && (
        <div className="approval-actions">
          <button type="button" className="secondary-danger-action" onClick={onStartReject}>驳回</button>
          <button type="button" className="primary-approve-action" onClick={onApprove}>批准投放</button>
        </div>
      )}

      {isPending && isRejecting && (
        <div className="rejection-editor">
          <label>
            驳回原因 <span>选填</span>
            <textarea
              value={rejectionReason}
              onChange={(event) => onRejectionReasonChange(event.target.value)}
              placeholder="例如：素材文字过密；留空也可以直接驳回。"
              rows="3"
            />
          </label>
          <div className="approval-actions">
            <button type="button" className="quiet-action" onClick={onCancelReject}>取消</button>
            <button type="button" className="confirm-reject-action" onClick={onConfirmReject}>确认驳回</button>
          </div>
        </div>
      )}
    </>
  )
}

function Metadata({ label, value }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )
}

function formatDateTime(value) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value))
}

export default AdApprovalPanel
