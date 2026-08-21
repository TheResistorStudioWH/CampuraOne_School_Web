import { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { createPortal } from 'react-dom'
import { departmentTargets } from '../data/mockData.js'
import AdApprovalPanel from './AdApprovalPanel.jsx'

const consoleModules = [
    {
        id: 'notice',
        icon: 'notice',
        label: '通知发布',
        description: '短通知与重要通知',
        shortcuts: [
            { id: 'important', label: '发布重要通知' },
            { id: 'short', label: '发布短通知' },
        ],
    },
    {
        id: 'ads',
        icon: 'ads',
        label: '广告审批',
        description: '商户广告投放审核',
        shortcuts: [
            { id: 'pending', label: '待审批' },
            { id: 'all', label: '全部' },
        ],
    },
    { id: 'timetable', icon: 'timetable', label: '课表管理', description: '上传班级课表' },
    { id: 'calendar', icon: 'calendar', label: '校历管理', description: '维护学年校历' },
]

function OperationsPanel({
    activeModule = 'notice',
    onModuleChange,
    advertisements = [],
    onReviewDecision,
}) {
    const [toast, setToast] = useState(null)
    const [noticeType, setNoticeType] = useState('short')
    const [noticePublishMode, setNoticePublishMode] = useState('now')
    const [noticeStartTime, setNoticeStartTime] = useState('')
    const [noticeEndTime, setNoticeEndTime] = useState('')
    const [noticeTargetMode, setNoticeTargetMode] = useState('all')
    const [noticeDepartment, setNoticeDepartment] = useState('all')
    const [noticeClassName, setNoticeClassName] = useState('all')
    const [noticeStudentId, setNoticeStudentId] = useState('')
    const [noticeContent, setNoticeContent] = useState('')
    const [pendingNoticeShortcut, setPendingNoticeShortcut] = useState(null)
    const [adStatusFilter, setAdStatusFilter] = useState('pending')
    const isImportantNotice = noticeType === 'important'
    const isScheduledNotice = noticePublishMode === 'scheduled'
    const isDepartmentTarget = noticeTargetMode === 'department'
    const isStudentTarget = noticeTargetMode === 'student'
    const shouldShowClassSelector = isDepartmentTarget && noticeDepartment !== 'all'
    const [dragTarget, setDragTarget] = useState(null)
    // const selectedDepartment = departmentTargets.find((department) => department.id === noticeDepartment)

    useEffect(() => {
        if (activeModule !== 'notice' || !pendingNoticeShortcut) {
            return undefined
        }

        const focusTimer = window.setTimeout(() => {
            const scrollTarget = pendingNoticeShortcut === 'important'
                ? document.querySelector('.docx-upload-line')
                : document.querySelector('textarea[name="noticeContent"]')
            const noticeTypeSelect = document.querySelector('select[name="noticeType"]')

            scrollTarget?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            noticeTypeSelect?.focus({ preventScroll: true })
            setPendingNoticeShortcut(null)
        }, 60)

        return () => window.clearTimeout(focusTimer)
    }, [activeModule, pendingNoticeShortcut])
    
    function showToast(message, type = 'success') {
        setToast({ message, type, isLeaving: false })

        window.clearTimeout(showToast.leaveTimer)
        window.clearTimeout(showToast.removeTimer)

        showToast.leaveTimer = window.setTimeout(() => {
            setToast((currentToast) => (
                currentToast ? { ...currentToast, isLeaving: true } : currentToast
            ))
        }, 2200)

        showToast.removeTimer = window.setTimeout(() => {
            setToast(null)
        }, 2600)
    }

    function handleDragOver(event, targetName) {
        event.preventDefault()
        setDragTarget(targetName)
    }

    function handleDragLeave(event, targetName) {
        const nextElement = event.relatedTarget

        if (nextElement && event.currentTarget.contains(nextElement)) {
            return
        }

        setDragTarget((currentTarget) => (
            currentTarget === targetName ? null : currentTarget
        ))
    }

    function getFirstDroppedFile(event) {
        event.preventDefault()
        setDragTarget(null)
        return event.dataTransfer.files?.[0]
    }

    function resetNoticeForm(formElement) {
        formElement.reset()
        setNoticeType('short')
        setNoticePublishMode('now')
        setNoticeStartTime('')
        setNoticeEndTime('')
        setNoticeTargetMode('all')
        setNoticeDepartment('all')
        setNoticeClassName('all')
        setNoticeStudentId('')
        setNoticeContent('')
    }

    function handlePublishNotice(event) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const title = formData.get('noticeTitle')?.trim()
        const content = formData.get('noticeContent')?.trim()
        const publishMode = formData.get('noticePublishMode') || 'now'
        const startTime = publishMode === 'scheduled'
            ? formData.get('noticeStartTime')
            : new Date().toISOString()
        const endTime = formData.get('noticeEndTime')
        const targetMode = formData.get('noticeTargetMode') || 'all'
        const department = formData.get('noticeDepartment') || 'all'
        const className = formData.get('noticeClassName') || 'all'
        const studentId = formData.get('noticeStudentId')?.trim()

        if (!title) {
            showToast('请先填写通知标题。', 'warning')
            return
        }

        if (!content) {
            showToast('请先填写通知内容。', 'warning')
            return
        }

        if (publishMode === 'scheduled' && !formData.get('noticeStartTime')) {
            showToast('请选择定时发布时间。', 'warning')
            return
        }

        if (!endTime) {
            showToast('请选择通知结束时间。', 'warning')
            return
        }

        if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
            showToast('结束时间需要晚于开始时间。', 'warning')
            return
        }

        if (targetMode === 'department' && !department) {
            showToast('请选择要发布到的院系。', 'warning')
            return
        }

        if (targetMode === 'student' && !studentId) {
            showToast('请输入要发布到的学生学号。', 'warning')
            return
        }

        const noticeName = isImportantNotice ? '重要通知' : '短通知'
        const publishText = publishMode === 'scheduled' ? '定时发布' : '立即发布'
        const departmentTextMap = Object.fromEntries(
            departmentTargets.map((departmentItem) => [departmentItem.id, departmentItem.name])
        )
        let targetText = '全校'

        if (targetMode === 'department') {
            const classText = className === 'all' ? '全部班级' : className

            targetText = department === 'all'
                ? '全部院系'
                : `${departmentTextMap[department] || '全部院系'} · ${classText}`
        }

        if (targetMode === 'student') {
            targetText = `指定学生 · ${studentId}`
        }

        showToast(`模拟发布成功：${noticeName} · ${publishText} · ${targetText} · ${title}`)
        resetNoticeForm(event.currentTarget)
    }

    function submitTimetableFile(file, formElement = null) {
        if (!file || !file.name) {
            showToast('请先选择一个 .ics 课表文件。', 'warning')
            return
        }

        if (!file.name.toLowerCase().endsWith('.ics')) {
            showToast('请选择 .ics 格式的课表文件。', 'warning')
            return
        }

        showToast(`模拟上传成功：${file.name}`)

        if (formElement) {
            formElement.reset()
        }
    }

    function handleUploadTimetable(event) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        submitTimetableFile(formData.get('timetableFile'), event.currentTarget)
    }

    function handleDropTimetable(event) {
        const file = getFirstDroppedFile(event)
        submitTimetableFile(file)
    }

    function submitCalendarFile(file, schoolYear = '未填写学年', formElement = null) {
        if (!file || !file.name) {
            showToast('请先选择一个 .ics 校历文件。', 'warning')
            return
        }

        if (!file.name.toLowerCase().endsWith('.ics')) {
            showToast('请选择 .ics 格式的校历文件。', 'warning')
            return
        }

        showToast(`模拟上传成功：${schoolYear} 校历 · ${file.name}`)

        if (formElement) {
            formElement.reset()
        }
    }

    function handleUploadCalendar(event) {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const schoolYear = formData.get('schoolYear')?.trim()

        if (!schoolYear) {
            showToast('请先填写学年。', 'warning')
            return
        }

        submitCalendarFile(formData.get('calendarFile'), schoolYear, event.currentTarget)
    }

    function handleDropCalendar(event) {
        const formElement = event.currentTarget.closest('form')
        const formData = formElement ? new FormData(formElement) : null
        const schoolYear = formData?.get('schoolYear')?.trim() || '未填写学年'
        const file = getFirstDroppedFile(event)

        submitCalendarFile(file, schoolYear)
    }

    async function convertDocxFileToMarkdown(file, inputElement = null) {
        if (!file) {
            return
        }

        if (!file.name.toLowerCase().endsWith('.docx')) {
            showToast('请选择 .docx 格式的文件。', 'warning')
            if (inputElement) {
                inputElement.value = ''
            }
            return
        }

        try {
            const [{ default: mammoth }, { default: TurndownService }] = await Promise.all([
                import('mammoth/mammoth.browser'),
                import('turndown'),
            ])
            const arrayBuffer = await file.arrayBuffer()
            const result = await mammoth.convertToHtml({ arrayBuffer })
            const turndownService = new TurndownService({
                headingStyle: 'atx',
                bulletListMarker: '-',
                codeBlockStyle: 'fenced',
            })
            const markdownText = turndownService.turndown(result.value).trim()

            setNoticeContent(markdownText)

            if (result.messages.length > 0) {
                showToast('DOCX 已转换为 Markdown，但部分格式可能需要手动检查。', 'warning')
                return
            }

            showToast(`DOCX 已转换为 Markdown：${file.name}`)
        } catch (error) {
            console.error(error)
            showToast('DOCX 转换失败，请检查文件格式。', 'warning')
        }
    }

    function handleDocxToMarkdown(event) {
        convertDocxFileToMarkdown(event.target.files?.[0], event.target)
    }

    function handleDropDocx(event) {
        const file = getFirstDroppedFile(event)
        convertDocxFileToMarkdown(file)
    }

    function handleModuleShortcut(moduleID, shortcutID) {
        if (moduleID === 'notice') {
            setNoticeType(shortcutID)
            setPendingNoticeShortcut(shortcutID)
            onModuleChange?.('notice')
            return
        }

        if (moduleID === 'ads') {
            setAdStatusFilter(shortcutID)
            onModuleChange?.('ads')
        }
    }

    return (
        <>
            {toast && createPortal(
                <div className={`top-toast ${toast.type} ${toast.isLeaving ? 'leaving' : ''}`} role="status" aria-live="polite">
                    <span className="toast-dot" />
                    <span>{toast.message}</span>
                </div>,
                document.body
            )}

            <section className="console-workbench">
                <aside className="console-module-rail" aria-label="控制台模块">
                    <nav>
                        {consoleModules.map((module) => (
                            <div
                                key={module.id}
                                className={`module-nav-item ${activeModule === module.id ? 'active' : ''}`}
                            >
                                <button
                                    type="button"
                                    className="module-nav-button"
                                    aria-current={activeModule === module.id ? 'page' : undefined}
                                    onClick={() => onModuleChange?.(module.id)}
                                >
                                    <span className="module-index" aria-hidden="true">
                                        <span className={`module-icon ${module.icon}`} />
                                    </span>
                                    <span className="module-copy">
                                        <strong>{module.label}</strong>
                                        <small>{module.description}</small>
                                    </span>
                                    {module.id === 'ads' && (
                                        <span className="module-badge">
                                            {advertisements.filter((item) => item.status === 'pending').length}
                                        </span>
                                    )}
                                </button>

                                <ModuleQuickControl
                                    module={module}
                                    onShortcut={handleModuleShortcut}
                                />
                            </div>
                        ))}
                    </nav>

                    <p>本页数据仅用于界面演示，刷新或退出后审批状态会复位。</p>
                </aside>

                <div className="console-module-stage">
                {activeModule === 'notice' && (
            <section className="operations-grid compact-operations-grid">
                <article className="info-card operation-card notice-operation-card">
                    <div className="operation-card-head">
                        <div>
                            <p className="eyebrow">Notice Center</p>
                            <h3>发布通知</h3>
                        </div>
                        <span className="operation-chip">
                            {isImportantNotice ? '重要通知' : '短通知'}
                        </span>
                    </div>

                    <form onSubmit={handlePublishNotice}>
                        <div className="notice-schedule-layout notice-schedule-layout-three">
                            <section className="notice-form-column notice-kind-column">
                                <p className="notice-form-column-title">通知类型</p>

                                <label>
                                    通知类型
                                    <select
                                        name="noticeType"
                                        value={noticeType}
                                        onChange={(event) => setNoticeType(event.target.value)}
                                    >
                                        <option value="short">短通知</option>
                                        <option value="important">重要通知</option>
                                    </select>
                                </label>

                                {!isImportantNotice && (
                                    <label>
                                        短通知分类
                                        <select name="noticeCategory" defaultValue="daily">
                                            <option value="daily">日常</option>
                                            <option value="urgent">紧急</option>
                                        </select>
                                    </label>
                                )}
                            </section>

                            <section className="notice-form-column notice-time-column">
                                <p className="notice-form-column-title">发布时间</p>

                                <label>
                                    开始时间
                                    <select
                                        name="noticePublishMode"
                                        value={noticePublishMode}
                                        onChange={(event) => setNoticePublishMode(event.target.value)}
                                    >
                                        <option value="now">立即发布</option>
                                        <option value="scheduled">定时发布</option>
                                    </select>
                                </label>

                                {isScheduledNotice && (
                                    <label>
                                        定时发布时间
                                        <input
                                            name="noticeStartTime"
                                            type="datetime-local"
                                            value={noticeStartTime}
                                            onChange={(event) => setNoticeStartTime(event.target.value)}
                                        />
                                    </label>
                                )}

                                <label>
                                    结束时间
                                    <input
                                        name="noticeEndTime"
                                        type="datetime-local"
                                        value={noticeEndTime}
                                        onChange={(event) => setNoticeEndTime(event.target.value)}
                                    />
                                </label>
                            </section>

                            <section className="notice-form-column notice-target-column">
                                <p className="notice-form-column-title">发布给</p>

                                <div className="notice-target-mode-row" role="radiogroup" aria-label="通知发布范围">
                                    <label className="notice-check-line">
                                        <input
                                            name="noticeTargetMode"
                                            type="radio"
                                            value="all"
                                            checked={noticeTargetMode === 'all'}
                                            onChange={(event) => setNoticeTargetMode(event.target.value)}
                                        />
                                        <span>发布给全校</span>
                                    </label>

                                    <label className="notice-check-line">
                                        <input
                                            name="noticeTargetMode"
                                            type="radio"
                                            value="department"
                                            checked={noticeTargetMode === 'department'}
                                            onChange={(event) => setNoticeTargetMode(event.target.value)}
                                        />
                                        <span>分配发布</span>
                                    </label>

                                    <label className="notice-check-line">
                                        <input
                                            name="noticeTargetMode"
                                            type="radio"
                                            value="student"
                                            checked={noticeTargetMode === 'student'}
                                            onChange={(event) => setNoticeTargetMode(event.target.value)}
                                        />
                                        <span>发布给指定学生个人</span>
                                    </label>
                                </div>

                                {isDepartmentTarget && (
                                    <>
                                        <label>
                                            选择院系
                                            <select
                                                name="noticeDepartment"
                                                value={noticeDepartment}
                                                onChange={(event) => {
                                                    const nextDepartment = event.target.value
                                                    setNoticeDepartment(nextDepartment)
                                                    setNoticeClassName(nextDepartment === 'all' ? 'all' : '')
                                                }}
                                            >
                                                <option value="all">全部院系</option>
                                                {departmentTargets.map((departmentItem) => (
                                                    <option key={departmentItem.id} value={departmentItem.id}>
                                                        {departmentItem.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>

                                        {shouldShowClassSelector && (
                                            <label>
                                                输入班级
                                                <input
                                                    name="noticeClassName"
                                                    type="text"
                                                    placeholder="留空表示全部班级; 1班则输入1即可"
                                                    value={noticeClassName === 'all' ? '' : noticeClassName}
                                                    onChange={(event) => setNoticeClassName(event.target.value)}
                                                />
                                            </label>
                                        )}
                                    </>
                                )}

                                {isStudentTarget && (
                                    <label>
                                        学生学号
                                        <input
                                            name="noticeStudentId"
                                            type="text"
                                            placeholder="例如：20262401001"
                                            value={noticeStudentId}
                                            onChange={(event) => setNoticeStudentId(event.target.value)}
                                        />
                                    </label>
                                )}
                            </section>
                        </div>

                        <div className="form-grid notice-editor-grid">
                            <label className="full-row">
                                通知标题
                                <input name="noticeTitle" placeholder={isImportantNotice ? '例如：关于开展安全教育专项检查的通知' : '例如：今晚操场临时维护'} />
                            </label>

                            {isImportantNotice && (
                                <label
                                    className={`full-row docx-upload-line drop-upload-zone ${dragTarget === 'docx' ? 'dragging' : ''}`}
                                    onDragOver={(event) => handleDragOver(event, 'docx')}
                                    onDragLeave={(event) => handleDragLeave(event, 'docx')}
                                    onDrop={handleDropDocx}
                                >
                                    <div className="drop-illustration" aria-hidden="true">
                                        <span className="drop-file-card main-card">.docx</span>
                                        <span className="drop-file-card side-card left-card">MD</span>
                                        <span className="drop-file-card side-card right-card">#</span>
                                    </div>

                                    <div className="drop-zone-copy">
                                        <span>DOCX 转 Markdown</span>
                                        <strong>拖拽 DOCX 到这里开始转换</strong>
                                        <small>适合教育局通知、学校正式通知等 Word 文档。</small>
                                    </div>

                                    <div className="drop-zone-actions">
                                        <span>或</span>
                                        <strong>点击选择文件</strong>
                                        <kbd>DOCX</kbd>
                                    </div>

                                    <input name="noticeDocx" type="file" accept=".docx" onChange={handleDocxToMarkdown} />
                                </label>
                            )}

                            {!isImportantNotice && (
                                <label className="full-row">
                                    短通知内容
                                    <textarea
                                        name="noticeContent"
                                        placeholder="请输入短通知正文，建议控制在 80 字以内。"
                                        rows="4"
                                        value={noticeContent}
                                        onChange={(event) => setNoticeContent(event.target.value)}
                                    />
                                </label>
                            )}
                        </div>

                        {isImportantNotice && (
                            <section className="important-notice-workbench">
                                <label className="markdown-editor-card">
                                    <span>Markdown 正文</span>
                                    <textarea
                                        name="noticeContent"
                                        placeholder="请输入 Markdown 正文，后续可由 DOCX 自动转换填入。"
                                        rows="14"
                                        value={noticeContent}
                                        onChange={(event) => setNoticeContent(event.target.value)}
                                    />
                                </label>

                                <section className="markdown-preview-card" aria-label="Markdown 预览">
                                    <div className="markdown-preview-head">
                                        <strong>Markdown 预览</strong>
                                        <span>Live Preview</span>
                                    </div>

                                    <div className="markdown-preview-body">
                                        {noticeContent.trim() ? (
                                            <ReactMarkdown>{noticeContent}</ReactMarkdown>
                                        ) : (
                                            <p className="empty-preview">在左侧输入 Markdown 后，这里会显示预览。</p>
                                        )}
                                    </div>
                                </section>
                            </section>
                        )}

                        <button type="submit" className="primary-action">
                            {isImportantNotice ? '模拟发布重要通知' : '模拟发布短通知'}
                        </button>
                    </form>
                </article>
            </section>
                )}

                {activeModule === 'ads' && (
                    <AdApprovalPanel
                        advertisements={advertisements}
                        onReviewDecision={onReviewDecision}
                        statusFilter={adStatusFilter}
                        onStatusFilterChange={setAdStatusFilter}
                        showToast={showToast}
                    />
                )}

                {activeModule === 'timetable' && (
                <section className="operations-grid single-operation-grid">
                <article className="info-card operation-card">
                    <p className="eyebrow">Timetable ICS</p>
                    <h3>上传课表</h3>
                    <form onSubmit={handleUploadTimetable}>
                        <div className="form-grid">
                            <label>
                                院系
                                <select name="department" defaultValue="software">
                                    <option value="software">信息工程学院</option>
                                    <option value="business">商学院</option>
                                </select>
                            </label>
                            <label>
                                班级
                                <select name="className" defaultValue="2401">
                                    <option value="2401">软件技术 2401</option>
                                    <option value="2402">软件技术 2402</option>
                                </select>
                            </label>
                            <label
                                className={`full-row drop-upload-zone ${dragTarget === 'timetable' ? 'dragging' : ''}`}
                                onDragOver={(event) => handleDragOver(event, 'timetable')}
                                onDragLeave={(event) => handleDragLeave(event, 'timetable')}
                                onDrop={handleDropTimetable}
                            >
                                <div className="drop-illustration" aria-hidden="true">
                                    <IcsFilePreviewCard className="main-card" showType />
                                    <IcsFilePreviewCard className="side-card left-card" />
                                    <IcsFilePreviewCard className="side-card right-card" />
                                </div>

                                <div className="drop-zone-copy">
                                    <span>课表文件</span>
                                    <strong>拖拽 .ics 课表到这里</strong>
                                    <small>支持 iCalendar 课表文件，原有院系与班级选择保持不变。</small>
                                </div>

                                <div className="drop-zone-actions">
                                    <span>或</span>
                                    <strong>点击选择文件</strong>
                                    <kbd>ICS</kbd>
                                </div>

                                <input name="timetableFile" type="file" accept=".ics" />
                            </label>
                        </div>
                        <button type="submit" className="primary-action">模拟上传课表</button>
                    </form>
                </article>
                </section>
                )}

                {activeModule === 'calendar' && (
                <section className="operations-grid single-operation-grid">
                <article className="info-card operation-card">
                    <p className="eyebrow">Calendar ICS</p>
                    <h3>上传校历</h3>
                    <form onSubmit={handleUploadCalendar}>
                        <div className="form-grid">
                            <label>
                                学年
                                <input name="schoolYear" placeholder="例如：2026-2027" />
                            </label>
                            <label>
                                学期
                                <select name="semester" defaultValue="spring">
                                    <option value="spring">春季学期</option>
                                    <option value="autumn">秋季学期</option>
                                </select>
                            </label>
                            <label
                                className={`full-row drop-upload-zone ${dragTarget === 'calendar' ? 'dragging' : ''}`}
                                onDragOver={(event) => handleDragOver(event, 'calendar')}
                                onDragLeave={(event) => handleDragLeave(event, 'calendar')}
                                onDrop={handleDropCalendar}
                            >
                                <div className="drop-illustration" aria-hidden="true">
                                    <IcsFilePreviewCard className="main-card" showType />
                                    <IcsFilePreviewCard className="side-card left-card" />
                                    <IcsFilePreviewCard className="side-card right-card" />
                                </div>

                                <div className="drop-zone-copy">
                                    <span>校历文件</span>
                                    <strong>拖拽 .ics 校历到这里</strong>
                                    <small>支持 iCalendar 校历文件，原有学年与学期设置保持不变。</small>
                                </div>

                                <div className="drop-zone-actions">
                                    <span>或</span>
                                    <strong>点击选择文件</strong>
                                    <kbd>ICS</kbd>
                                </div>

                                <input name="calendarFile" type="file" accept=".ics" />
                            </label>
                        </div>
                        <button type="submit" className="primary-action">模拟上传校历</button>
                    </form>
                </article>
                </section>
                )}
                </div>
            </section>
        </>
    )
}

function ModuleQuickControl({ module, onShortcut }) {
    const [isOpen, setIsOpen] = useState(false)
    const hasShortcuts = Boolean(module.shortcuts?.length)

    if (!hasShortcuts) {
        return (
            <span className="module-quick-control empty" aria-hidden="true">
                <span className="module-quick-trigger" />
            </span>
        )
    }

    return (
        <div className={`module-quick-control ${isOpen ? 'open' : ''}`}>
            <button
                type="button"
                className="module-quick-trigger"
                aria-label={`${module.label}快捷操作`}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((currentValue) => !currentValue)}
            />

            <div className="module-quick-menu" role="menu" aria-label={`${module.label}快捷操作`}>
                {module.shortcuts.map((shortcut) => (
                    <button
                        key={shortcut.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                            onShortcut(module.id, shortcut.id)
                            setIsOpen(false)
                        }}
                    >
                        {shortcut.label}
                    </button>
                ))}
            </div>
        </div>
    )
}

function IcsFilePreviewCard({ className, showType = false }) {
    return (
        <span className={`drop-file-card ics-file-card ${className}`}>
            {showType && <small>ICS</small>}
            <span className="file-preview-lines">
                <i />
                <i />
                <i />
            </span>
        </span>
    )
}

export default OperationsPanel
