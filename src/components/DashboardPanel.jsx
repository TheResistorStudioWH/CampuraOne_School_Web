import { useSchoolDemo } from '../demo/DemoContext.jsx'
import { noticeStatus, scopeLabel } from '../demo/schoolDemo.js'
import { parseIcs } from '../data/utils/parseIcs.js'
import plusIcon from '../assets/icons/plus.png'

const statusLabels = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已驳回',
    withdrawn: '已撤下',
}

function DashboardPanel({ advertisements, adStats, onOpenConsole }) {
    const { state, isDemo } = useSchoolDemo()
    const currentTerm = state.semesters.filter(t => t.startDate <= new Date().toISOString().slice(0,10)).sort((a,b)=>b.startDate.localeCompare(a.startDate))[0]
    const table = isDemo ? state.timetables.find(t => t.semesterID === currentTerm?.semesterID) : state.dashboard.timetable
    const timetableCourses = isDemo ? parseIcs(state.fileContents[`timetable:${table?.baseVersionID}`]).slice(0, 5) : (state.dashboard.timetable?.events||[]).map(e=>({id:e.uid,title:e.title,date:e.startTime.slice(0,10),weekday:'',timeText:`${e.startTime.slice(11,16)}–${e.endTime.slice(11,16)}`,teacher:e.location||'—'}))
    const calendarEvents = isDemo ? parseIcs(state.fileContents[`calendar:${currentTerm?.calendarVersionID}`]).slice(0,5).map(e=>({id:e.id,title:e.title,time:`${e.date} · ${e.timeText}`})) : state.dashboard.calendarEvents.map(e=>({id:e.uid,title:e.title,time:`${e.startTime.slice(0,10)} · ${e.startTime.slice(11,16)}–${e.endTime.slice(11,16)}`}))
    const currentFile = state.timetableVersions.find(v=>v.versionID===table?.baseVersionID)
    const adDailyMetrics = adStats.dailyMetrics
    const nextDashboardPlans = isDemo ? ['通知、审批与教学安排可演示', '修改保留在本次登录中', '刷新或退出后恢复示例数据'] : ['学校资料与教学安排来自服务器', '审批与通知操作保存到服务器', '付款、曝光和在线统计尚未接入']
    const currentOnlineStudents = adStats.currentOnlineStudents
    const recentNotices = (isDemo?state.announcements.slice(0, 5):state.dashboard.notices).map(n => ({ id:n.announceID, title:n.title, type:['日常','紧急','重要'][n.type], date:n.startTime?.slice(0,10)||'—', time:noticeStatus(n)==='revoked'?'已撤回':n.startTime?.slice(11,16)||'—' }))
    const pendingAdvertisements = advertisements.filter((item) => item.status === 'pending')
    const maxTrendValue = Math.max(
        ...adDailyMetrics.map((item) => item.approved + item.rejected),
        1,
    )
    const maxRejectionCount = Math.max(...adStats.rejectionReasons.map((item) => item.count), 1)

    function getNoticeTypeClass(type) {
        if (type === '紧急') return 'notice-type-badge urgent'
        if (type === '重要') return 'notice-type-badge important'
        if (type === '日常') return 'notice-type-badge daily'
        if (type === '系统') return 'notice-type-badge system'
        return 'notice-type-badge normal'
    }

    return (
        <>
            <section className="dashboard-grid">
                <article className="info-card hero-card">
                    <p className="eyebrow">今日信息</p>
                    <h2>{new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date())}</h2>
                    <p>{isDemo?'演示工作台':'学校工作台'} · 当前有 {adStats.pendingCount} 条广告等待审批</p>
                </article>

                <article className="info-card">
                    <p className="eyebrow">最近通知</p>
                    <h3>通知动态</h3>
                    <ul className="clean-list">
                        {recentNotices.map((notice) => (
                            <li key={notice.id} className="notice-feed-item">
                                <span className={getNoticeTypeClass(notice.type)}>{notice.type}</span>
                                <strong>{notice.title}</strong>
                                <small>{notice.date} · {notice.time}</small>
                            </li>
                        ))}
                    </ul>
                </article>

                <article className="info-card action-preview-card">
                    <div className="card-title-row">
                        <div>
                            <p className="eyebrow">校历</p>
                            <h3>近期校历</h3>
                        </div>
                        <button
                            type="button"
                            className="icon-action"
                            onClick={() => onOpenConsole('calendar')}
                            aria-label="打开校历管理"
                            title="打开校历管理"
                        >
                            <img src={plusIcon} alt="" aria-hidden="true" />
                        </button>
                    </div>
                    <ul className="clean-list">
                        {calendarEvents.map((event) => (
                            <li key={event.id}>
                                {event.title}
                                <small>{event.time}</small>
                            </li>
                        ))}
                    </ul>
                </article>

                <article className="info-card action-preview-card timetable-preview-card">
                    <div className="card-title-row">
                        <div>
                            <p className="eyebrow">课表预览</p>
                            <h3>{table ? `${table.classID} 班课表` : '尚无课表'}</h3>
                        </div>
                        <button
                            type="button"
                            className="icon-action"
                            onClick={() => onOpenConsole('timetable')}
                            aria-label="打开课表管理"
                            title="打开课表管理"
                        >
                            <img src={plusIcon} alt="" aria-hidden="true" />
                        </button>
                    </div>
                    <p>{table ? scopeLabel(table,state.directory) : '上传常规课表后显示预览'}</p>
                    <p>{isDemo?(currentFile ? `${currentFile.originalName} · 文件内容预览` : 'ICS 文件'):'当前生效课表 · 后续课程'}</p>
                    <div className="course-preview-table">
                        <div className="course-preview-head">
                            <span>课程</span>
                            <span>日期</span>
                            <span>时间</span>
                            <span>{isDemo?'教师':'地点'}</span>
                        </div>

                        {timetableCourses.map((course) => (
                            <div className="course-preview-row" key={course.id}>
                                <strong>{course.title}</strong>
                                <span>{course.date} · {course.weekday}</span>
                                <span>{course.timeText}</span>
                                <span>{course.teacher}</span>
                            </div>
                        ))}
                    </div>
                </article>

                <div className="side-insight-stack">
                    <article className="info-card compact-insight-card student-online-card">
                        <p className="eyebrow">学生端状态</p>
                        <div className="compact-insight-main">
                            <div>
                                <h3>当前在线人数</h3>
                                <p>实时在线统计尚未接入</p>
                            </div>
                            <strong>{currentOnlineStudents === null ? '—' : currentOnlineStudents.toLocaleString()}</strong>
                        </div>
                    </article>

                    <article className="info-card compact-insight-card next-plan-card">
                        <p className="eyebrow">工作台环境</p>
                        <h3>{isDemo?'本地演示':'已连接服务器'}</h3>
                        <ul className="mini-plan-list">
                            {nextDashboardPlans.map((plan) => (
                                <li key={plan}>{plan}</li>
                            ))}
                        </ul>
                    </article>
                </div>
            </section>

            <section className="dashboard-section-heading">
                <div>
                    <p className="eyebrow">商户投放</p>
                    <h2>广告运营概览</h2>
                    <p>{isDemo?'演示数据 · 审批结果仅在本次会话中保存':'服务器数据 · 审批结果同步保存'}</p>
                </div>
                <button type="button" className="section-link-button" onClick={() => onOpenConsole('ads')}>
                    查看全部
                    <span aria-hidden="true">→</span>
                </button>
            </section>

            <section className="ad-kpi-grid" aria-label="广告审批关键指标">
                <KpiCard label="待审数量" value={adStats.pendingCount} unit="条" tone="blue" note="需要学校管理员处理" />
                <KpiCard label="平均等待时间" value={adStats.averageWaitingHours} unit="小时" tone="violet" note="从首次提交起计算" />
                <KpiCard label="审批通过率" value={adStats.approvalRate} unit="%" tone="green" note="不包含仍待审广告" />
                <KpiCard label="本周处理量" value={adStats.processedThisWeek} unit="条" tone="orange" note="最近七天的审批操作次数" />
            </section>

            <section className="ad-analytics-grid">
                <article className="info-card ad-trend-card">
                    <div className="card-title-row">
                        <div>
                            <p className="eyebrow">审批统计</p>
                            <h3>七日审批趋势</h3>
                        </div>
                        <div className="trend-legend" aria-label="图例">
                            <span className="submitted">批准</span>
                            <span className="processed">驳回</span>
                            <span className="pending">合计</span>
                        </div>
                    </div>

                    <div className="trend-chart" role="img" aria-label="最近七天广告批准与驳回操作趋势">
                        {adDailyMetrics.map((metric) => {
                            const processed = metric.approved + metric.rejected

                            return (
                                <div className="trend-day" key={metric.date}>
                                    <div className="trend-bars">
                                        <span className="submitted" style={{ height: `${(metric.approved / maxTrendValue) * 100}%` }} title={`批准 ${metric.approved}`} />
                                        <span className="processed" style={{ height: `${(metric.rejected / maxTrendValue) * 100}%` }} title={`驳回 ${metric.rejected}`} />
                                        <span className="pending" style={{ height: `${(processed / maxTrendValue) * 100}%` }} title={`合计 ${processed}`} />
                                    </div>
                                    <small>{metric.date.slice(5).replace('-', '/')}</small>
                                </div>
                            )
                        })}
                    </div>
                </article>

                <article className="info-card pending-ad-card">
                    <div className="card-title-row">
                        <div>
                            <p className="eyebrow">待办</p>
                            <h3>待审批广告</h3>
                        </div>
                        <span className="queue-count">{pendingAdvertisements.length}</span>
                    </div>

                    <div className="pending-ad-list">
                        {pendingAdvertisements.slice(0, 3).map((item) => (
                            <button
                                type="button"
                                className="pending-ad-item"
                                key={item.adID}
                                onClick={() => onOpenConsole('ads', item.adID)}
                                aria-label={`查看${item.mainShop?.shopName}的广告申请`}
                            >
                                <span className="pending-ad-heading">
                                    <strong>{item.mainShop?.shopName}</strong>
                                    <span className="pending-ad-chevron" aria-hidden="true">›</span>
                                </span>
                                <span className="pending-ad-promotion">{item.saleEvent?.saleRule}</span>
                                <span className="pending-ad-metadata">
                                    <span className="ad-meta placement" title={item.type === 'L' ? '首页横幅' : '方形卡片'} aria-label={item.type === 'L' ? '首页横幅' : '方形卡片'}>
                                        <AdMetadataIcon kind={item.type === 'L' ? 'banner' : 'square'} />
                                    </span>
                                    <span className="ad-meta price" title={`报价 ¥${item.order?.price}`} aria-label={`报价 ${item.order?.price} 元`}>
                                        <AdMetadataIcon kind="price" /><span>{item.order?.price}</span>
                                    </span>
                                    <span className="ad-meta waiting" title={`已等待 ${formatRelativeWaiting(item.review?.submittedAt)}`} aria-label={`已等待 ${formatRelativeWaiting(item.review?.submittedAt)}`}>
                                        <AdMetadataIcon kind="clock" /><span>{formatRelativeWaiting(item.review?.submittedAt)}</span>
                                    </span>
                                    <span className="ad-meta period" title="投放日期" aria-label={`投放 ${formatShortDate(item.startTime)}至${formatShortDate(item.endTime)}`}>
                                        <AdMetadataIcon kind="calendar" /><span>{formatShortDate(item.startTime)}–{formatShortDate(item.endTime)}</span>
                                    </span>
                                </span>
                            </button>
                        ))}
                        {pendingAdvertisements.length === 0 && <p className="pending-ad-empty">所有申请已处理</p>}
                    </div>
                </article>

                <article className="info-card rejection-card">
                    <p className="eyebrow">审批反馈</p>
                    <h3>驳回原因分布</h3>
                    <div className="rejection-reason-list">
                        {adStats.rejectionReasons.map((item) => (
                            <div key={item.reason}>
                                <div>
                                    <span>{item.reason}</span>
                                    <strong>{item.count}</strong>
                                </div>
                                <span className="reason-track">
                                    <span style={{ width: `${(item.count / maxRejectionCount) * 100}%` }} />
                                </span>
                            </div>
                        ))}
                    </div>
                </article>
            </section>

            <section className="ad-commercial-grid">
                <article className="info-card revenue-card ad-revenue-card">
                    <p className="eyebrow">广告报价总额</p>
                    <h2>¥{adStats.quoteTotal.toLocaleString()}</h2>
                    <p>共 {advertisements.length} 笔{isDemo?'演示':''}报价 · 付款与到账尚未接入。</p>
                </article>

                <article className="info-card commercial-stat-card">
                    <p className="eyebrow">当前投放</p>
                    <h3>{adStats.activeAdsCount} 个广告位生效</h3>
                    <div>
                        <span>L 横幅 <strong>{adStats.activeLargeAds}</strong></span>
                        <span>S 方形 <strong>{adStats.activeSmallAds}</strong></span>
                    </div>
                </article>

                <article className="info-card commercial-stat-card">
                    <p className="eyebrow">投放数据</p>
                    <h3>尚未接入</h3>
                    <div><span>曝光 <strong>—</strong></span><span>点击 <strong>—</strong></span><span>到账 <strong>—</strong></span></div>
                </article>
            </section>

            <section className="info-card table-card advertisement-order-table">
                <div className="section-title">
                    <div>
                        <p className="eyebrow">订单记录</p>
                        <h3>商户投放与报价</h3>
                    </div>
                    <span className="table-record-count">{advertisements.length} 条{isDemo?'模拟':''}记录</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>商户</th>
                            <th>报价方案</th>
                            <th>报价单</th>
                            <th>报价</th>
                            <th>投放周期</th>
                            <th>广告位</th>
                            <th>审批状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        {advertisements.map((advertisement) => (
                            <tr key={advertisement.adID}>
                                <td>{advertisement.mainShop?.shopName}</td>
                                <td className="table-long-copy" title={advertisement.saleEvent?.saleRule}>{advertisement.saleEvent?.saleRule}</td>
                                <td>{advertisement.order?.orderID}</td>
                                <td>¥{advertisement.order?.price}</td>
                                <td>{formatDate(advertisement.startTime)} — {formatDate(advertisement.endTime)}</td>
                                <td>{advertisement.type === 'L' ? 'L · 横幅' : 'S · 方形'}</td>
                                <td>
                                    <span className={`review-status ${advertisement.status}`}>
                                        {statusLabels[advertisement.status]}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </>
    )
}

function AdMetadataIcon({ kind }) {
    const paths = {
        banner: <><rect x="2" y="6" width="20" height="12" rx="3" /><path d="M6 10h8M6 14h4" /></>,
        square: <><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M8 9h8M8 13h5" /></>,
        price: <><path d="m7 4 5 7 5-7M7 12h10M7 16h10M12 11v9" /></>,
        clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
        calendar: <><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h6" /></>,
    }
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>
}

function KpiCard({ label, value, unit, tone, note }) {
    return (
        <article className={`info-card ad-kpi-card ${tone}`}>
            <span>{label}</span>
            <strong>{value ?? '—'}<small>{unit}</small></strong>
            <p>{note}</p>
        </article>
    )
}

function formatDate(value) {
    if (!value) return '长期'

    return new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date(value))
}

function formatShortDate(value) {
    return value ? new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric' }).format(new Date(value)) : '长期'
}

function formatRelativeWaiting(value) {
    if (!value) return '刚刚'

    const hours = Math.max(
        0,
        Math.round((Date.now() - new Date(value).getTime()) / 3_600_000),
    )

    return hours < 24 ? `${hours} 小时` : `${Math.floor(hours / 24)} 天`
}

export default DashboardPanel
