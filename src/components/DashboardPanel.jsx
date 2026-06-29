import {
  notices,
  calendarEvents,
  timetable,
  ads,
  dashboardStats,
} from '../data/mockData.js'
import { parseIcs } from '../data/utils/parseIcs.js'
import plusIcon from '../assets/icons/plus.png'

function DashboardPanel({ totalRevenue, enabledAdsCount, onOpenConsole }) {
    const timetableCourses = parseIcs(timetable.icsText).slice(0, 5)
    const { currentOnlineStudents, nextDashboardPlans } = dashboardStats

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
                    <h2>2026 年 5 月 28 日</h2>
                    <p>春季学期第 13 周 · 今日有 {notices.length} 条最近通知</p>
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
                            onClick={onOpenConsole}
                            aria-label="新建"
                            title="新建"
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
                            onClick={onOpenConsole}
                            aria-label="新建"
                            title="新建"
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

            <section className="ad-overview-grid">
                <article className="info-card revenue-card ad-revenue-card">
                    <p className="eyebrow">广告总收益</p>
                    <h2>¥{totalRevenue.toLocaleString()}</h2>
                    <p>当前启用广告位 {enabledAdsCount} 个，本月新增 ¥2,300。</p>
                </article>

                <article className="info-card placeholder-card ad-placeholder-card pending-feature-card">
                    <p className="eyebrow">V1.0 暂缓</p>
                    <h3>广告转化数据</h3>
                    <p>待开发</p>
                </article>

                <article className="info-card placeholder-card muted-placeholder ad-placeholder-card pending-feature-card">
                    <p className="eyebrow">V1.0 暂缓</p>
                    <h3>广告审核状态</h3>
                    <p>待开发</p>
                </article>
            </section>

            <section className="info-card table-card">
                <div className="section-title">
                    <div>
                        <p className="eyebrow">Advertisement Orders</p>
                        <h3>商户广告位购买信息</h3>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>商户</th>
                            <th>促销事件</th>
                            <th>价格</th>
                            <th>开始时间</th>
                            <th>结束时间</th>
                            <th>持续时间</th>
                            <th>广告位类型</th>
                            <th>状态</th>
                            <th>剩余时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {ads.map((ad) => (
                            <tr key={ad.id}>
                                <td>{ad.merchant}</td>
                                <td>{ad.promotion}</td>
                                <td>¥{ad.price}</td>
                                <td>{ad.startDate}</td>
                                <td>{ad.endDate}</td>
                                <td>{ad.duration}</td>
                                <td>{ad.adType}</td>
                                <td>
                                    <span className={ad.enabled ? 'status-on' : 'status-off'}>
                                        {ad.enabled ? '启用中' : '已停用'}
                                    </span>
                                </td>
                                <td>{ad.remaining}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
        </>
    )
}

export default DashboardPanel