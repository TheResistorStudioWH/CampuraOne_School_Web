import {
    calendarEvents,
    dashboardStats,
    notices,
    timetable,
} from '../data/mockData.js'
import { adDailyMetrics } from '../data/adMockData.js'
import { parseIcs } from '../data/utils/parseIcs.js'
import plusIcon from '../assets/icons/plus.png'

const statusLabels = {
    pending: '待审批',
    approved: '已批准',
    rejected: '已驳回',
}

function DashboardPanel({ advertisements, adStats, onOpenConsole }) {
    const timetableCourses = parseIcs(timetable.icsText).slice(0, 5)
    const { currentOnlineStudents, nextDashboardPlans } = dashboardStats
    const pendingAdvertisements = advertisements.filter((item) => item.status === 'pending')
    const maxTrendValue = Math.max(
        ...adDailyMetrics.map((item) => Math.max(item.submitted, item.approved + item.rejected, item.pending)),
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
                    <h2>2026 年 8 月 19 日</h2>
                    <p>秋季开学准备周 · 当前有 {adStats.pendingCount} 条广告等待审批</p>
                </article>

                <article className="info-card">
                    <p className="eyebrow">最近通知</p>
                    <h3>通知动态</h3>
                    <ul className="clean-list">
                        {notices.map((notice) => (
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
                            <p className="eyebrow">随机课表</p>
                            <h3>{timetable.name}</h3>
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
                    <p>{timetable.department} · {timetable.className}</p>
                    <p>{timetable.uploadDate} 上传 · {timetable.fileType}</p>
                    <div className="course-preview-table">
                        <div className="course-preview-head">
                            <span>课程</span>
                            <span>日期</span>
                            <span>时间</span>
                            <span>教师</span>
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
                                <p>学生端当前活跃访问人数</p>
                            </div>
                            <strong>{currentOnlineStudents.toLocaleString()}</strong>
                        </div>
                    </article>

                    <article className="info-card compact-insight-card next-plan-card">
                        <p className="eyebrow">下次规划更新</p>
                        <h3>仪表盘 V1.1</h3>
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
                    <p className="eyebrow">Advertisement Operations</p>
                    <h2>广告运营概览</h2>
                    <p>以下均为关系化虚构数据，审批结果仅在当前登录会话中同步。</p>
                </div>
                <button type="button" className="section-link-button" onClick={() => onOpenConsole('ads')}>
                    进入广告审批
                    <span aria-hidden="true">→</span>
                </button>
            </section>

            <section className="ad-kpi-grid" aria-label="广告审批关键指标">
                <KpiCard label="待审数量" value={adStats.pendingCount} unit="条" tone="blue" note="需要学校管理员处理" />
                <KpiCard label="平均等待时间" value={adStats.averageWaitingHours} unit="小时" tone="violet" note="按当前待审记录计算" />
                <KpiCard label="审批通过率" value={adStats.approvalRate} unit="%" tone="green" note="不包含仍待审广告" />
                <KpiCard label="本周处理量" value={adStats.processedThisWeek} unit="条" tone="orange" note="批准与驳回合计" />
            </section>

            <section className="ad-analytics-grid">
                <article className="info-card ad-trend-card">
                    <div className="card-title-row">
                        <div>
                            <p className="eyebrow">7 Day Trend</p>
                            <h3>七日审批趋势</h3>
                        </div>
                        <div className="trend-legend" aria-label="图例">
                            <span className="submitted">提交</span>
                            <span className="processed">已处理</span>
                            <span className="pending">待审</span>
                        </div>
                    </div>

                    <div className="trend-chart" role="img" aria-label="最近七天广告提交、处理和待审趋势">
                        {adDailyMetrics.map((metric) => {
                            const processed = metric.approved + metric.rejected

                            return (
                                <div className="trend-day" key={metric.date}>
                                    <div className="trend-bars">
                                        <span className="submitted" style={{ height: `${(metric.submitted / maxTrendValue) * 100}%` }} title={`提交 ${metric.submitted}`} />
                                        <span className="processed" style={{ height: `${(processed / maxTrendValue) * 100}%` }} title={`已处理 ${processed}`} />
                                        <span className="pending" style={{ height: `${(metric.pending / maxTrendValue) * 100}%` }} title={`待审 ${metric.pending}`} />
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
                            <p className="eyebrow">Review Queue</p>
                            <h3>待审摘要</h3>
                        </div>
                        <span className="queue-count">{pendingAdvertisements.length}</span>
                    </div>

                    <div className="pending-ad-list">
                        {pendingAdvertisements.slice(0, 3).map((item) => (
                            <button type="button" key={item.adID} onClick={() => onOpenConsole('ads')}>
                                <span className={`mini-ad-type ${item.type === 'L' ? 'large' : 'small'}`}>{item.type}</span>
                                <span>
                                    <strong>{item.mainShop?.shopName}</strong>
                                    <small>{item.saleEvent?.saleRule}</small>
                                </span>
                                <time>{formatRelativeWaiting(item.review?.submittedAt)}</time>
                            </button>
                        ))}
                    </div>
                </article>

                <article className="info-card rejection-card">
                    <p className="eyebrow">Rejected Reasons</p>
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
                    <p className="eyebrow">广告订单金额</p>
                    <h2>¥{adStats.totalRevenue.toLocaleString()}</h2>
                    <p>共 {advertisements.length} 笔虚构广告订单，不代表真实结算收入。</p>
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
                    <p className="eyebrow">七日触达</p>
                    <h3>{adStats.impressions.toLocaleString()} 次曝光</h3>
                    <div>
                        <span>点击 <strong>{adStats.clicks.toLocaleString()}</strong></span>
                        <span>点击率 <strong>{((adStats.clicks / adStats.impressions) * 100).toFixed(1)}%</strong></span>
                    </div>
                </article>
            </section>

            <section className="info-card table-card advertisement-order-table">
                <div className="section-title">
                    <div>
                        <p className="eyebrow">Advertisement Orders</p>
                        <h3>商户广告位购买信息</h3>
                    </div>
                    <span className="table-record-count">{advertisements.length} 条模拟记录</span>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>商户</th>
                            <th>促销事件</th>
                            <th>订单</th>
                            <th>价格</th>
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

function KpiCard({ label, value, unit, tone, note }) {
    return (
        <article className={`info-card ad-kpi-card ${tone}`}>
            <span>{label}</span>
            <strong>{value}<small>{unit}</small></strong>
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

function formatRelativeWaiting(value) {
    if (!value) return '刚刚'

    const hours = Math.max(
        0,
        Math.round((new Date('2026-08-19T12:00:00+08:00').getTime() - new Date(value).getTime()) / 3_600_000),
    )

    return hours < 24 ? `${hours} 小时` : `${Math.floor(hours / 24)} 天`
}

export default DashboardPanel
