import { notices, timetable } from '../data/mockData.js'
import { buildAdvertisementViewModels, adDailyMetrics } from '../data/adMockData.js'

// API-shaped fixtures and commands. UI-only file contents/history live separately.
// No fetch, credentials, network writes or persistence are used in this demo.
export const demoDirectory = {
  compounds: [{ compoundID: 1, compoundName: '主校区' }, { compoundID: 2, compoundName: '北校区' }],
  departments: [{ departmentID: 11, compoundID: 1, departmentName: '信息工程学院' }, { departmentID: 12, compoundID: 2, departmentName: '商学院' }],
  classes: [{ compoundID: 1, departmentID: 11, classID: 2401 }, { compoundID: 1, departmentID: 11, classID: 2402 }, { compoundID: 2, departmentID: 12, classID: 2401 }],
}
export const demoStudents = [{ studentID: 101, studentNumber: '0000101', studentName: '演示学生甲', compoundID: 1, departmentID: 11, classID: 2401 }, { studentID: 102, studentNumber: '0000102', studentName: '演示学生乙', compoundID: 2, departmentID: 12, classID: 2401 }]
export const emptyTarget = () => ({ allSchool: true, compoundIDs: [], departmentIDs: [], classScopes: [], studentIDs: [] })
export const shanghaiISO = value => value ? `${value}:00+08:00`.replace(/:00:00\+/, ':00+') : new Date().toISOString()
export const scopeKey = s => `${s.compoundID}/${s.departmentID}/${s.classID}`
export function scopeLabel(s, directory = demoDirectory) {
  return `${directory.compounds.find(c => c.compoundID === s.compoundID)?.compoundName} · ${directory.departments.find(d => d.departmentID === s.departmentID)?.departmentName} · ${s.classID} 班`
}
const calendarText = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Campura//Demo//ZH\r\nBEGIN:VEVENT\r\nUID:demo-opening\r\nSUMMARY:秋季开学\r\nDTSTART;TZID=Asia/Shanghai:20260907T090000\r\nDTEND;TZID=Asia/Shanghai:20260907T100000\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n'
export function createDemoState() {
  const shift = Date.now() - Date.parse('2026-08-19T12:00:00+08:00')
  const shifted = value => value ? new Date(Date.parse(value) + shift).toISOString() : null
  const advertisements = buildAdvertisementViewModels().map(a => ({ adID: a.adID, schoolID: 1, shopID: a.mainShop.shopID, shopName: a.mainShop.shopName, saleID: a.saleID, type: a.type, img: a.img, startTime: shifted(a.startTime), endTime: shifted(a.endTime), status: a.status, reason: a.review.reason, submittedAt: shifted(a.review.submittedAt), reviewedAt: shifted(a.review.reviewedAt), version: 1, isDemo: 1, orderNumber: a.order.orderID, packageName: a.order.packageName, amount: String(a.order.price), currency: 'CNY', paymentStatus: 'not_integrated' }))
  return {
    profile: { schoolID: 1, schoolName: '测试学校', schoolAddress: ['湖北省', '武汉市', '演示校区'], schoolLogo: null, version: 1 },
    semesters: [{ semesterID: 1, schoolID: 1, schoolYear: '2026-2027', season: 'autumn', startDate: '2026-09-01', endDate: '2027-01-31', firstMonday: '2026-09-07', version: 1, calendarVersionID: 1 }],
    announcements: notices.filter(n => n.type !== '系统').map(n => ({ announceID: n.id, schoolID: 1, title: n.title, content: `${n.title}。本条为演示通知。`, type: n.type === '紧急' ? 1 : n.type === '重要' ? 2 : 0, target: emptyTarget(), startTime: '2026-09-01T09:00:00+08:00', endTime: '2027-01-31T23:59:00+08:00', revokedAt: null, version: 1 })),
    advertisements,
    timetables: [{ tableID: 1, schoolID: 1, semesterID: 1, compoundID: 1, departmentID: 11, classID: 2401, baseVersionID: 1, version: 1, overrides: [] }],
    timetableVersions: [{ versionID: 1, tableID: 1, kind: 'base', originalName: '演示常规课表.ics', createdAt: '2026-09-01T09:00:00+08:00' }],
    calendarVersions: [{ versionID: 1, semesterID: 1, originalName: '秋季校历.ics', createdAt: '2026-09-01T09:00:00+08:00' }],
    fileContents: { 'timetable:1': timetable.icsText, 'calendar:1': calendarText },
    logs: adDailyMetrics.flatMap((m, i) => ['approve', 'reject'].flatMap(action => Array.from({ length: m[action === 'approve' ? 'approved' : 'rejected'] }, (_, j) => ({ logID: i * 10 + j + (action === 'reject' ? 5 : 0), resource: 'advertisement', resourceID: 1004, action, createdAt: shifted(`${m.date}T09:00:00+08:00`) })))),
    requests: [],
  }
}
const fail = message => { throw new Error(message) }
const nextID = (items, key) => Math.max(0, ...items.map(i => i[key])) + 1
const checkVersion = (item, input) => { if (!item || item.version !== Number(input.version)) fail('内容已更新，请重新选择后再操作。') }
const validDate = value => value && Number.isFinite(Date.parse(value))
export function validateTerm(input, semesters, id = 0) {
  const match = /^(\d{4})-(\d{4})$/.exec(input.schoolYear)
  if (!match || Number(match[2]) !== Number(match[1]) + 1) fail('学年需为连续两年，如 2026-2027。')
  if (!['spring', 'autumn'].includes(input.season)) fail('请选择春季或秋季学期。')
  if (![input.startDate, input.endDate, input.firstMonday].every(validDate)) fail('请填写完整学期日期。')
  const start = Date.parse(input.startDate), end = Date.parse(input.endDate), first = Date.parse(input.firstMonday)
  if (input.startDate < '1900-01-01' || input.endDate >= '2100-01-01' || end < start || end - start > 370 * 86400000 || new Date(`${input.firstMonday}T12:00:00Z`).getUTCDay() !== 1 || first > end || first < start - 6 * 86400000) fail('首个教学周需从周一开始，日期须落在合法学期范围。')
  if (semesters.some(t => t.semesterID !== id && t.startDate <= input.endDate && t.endDate >= input.startDate)) fail('学期日期与已有学期重叠。')
}
export function validateNotice(input) {
  if (!input.title?.trim() || input.title.length > 200 || !input.content?.trim() || input.content.length > 100000) fail('请填写标题和正文，并检查长度。')
  if (![0, 1, 2].includes(input.type)) fail('请选择通知类型。')
  if (!['now', 'scheduled'].includes(input.publishMode)) fail('请选择发布时间。')
  if (input.publishMode === 'scheduled' && !validDate(input.startTime)) fail('定时发布需要开始时间。')
  if (!validDate(input.endTime) || Date.parse(input.endTime) <= Date.parse(input.startTime || new Date().toISOString())) fail('结束时间需晚于开始时间。')
  const t = input.target
  if (!t || typeof t.allSchool !== 'boolean') fail('请选择发布范围。')
  const count = ['compoundIDs', 'departmentIDs', 'classScopes', 'studentIDs'].reduce((sum, key) => sum + (t[key]?.length || 0), 0)
  if ((t.allSchool && count) || (!t.allSchool && !count)) fail('请选择至少一个接收范围，全校不能与其他范围混用。')
  if (t.classScopes?.some(s => !demoDirectory.classes.some(c => scopeKey(c) === scopeKey(s)))) fail('请选择完整的校区、院系、班级。')
  if (t.studentIDs?.some(id => !demoStudents.some(s => s.studentID === id))) fail('请选择查询到的学生，学号不能直接作为学生 ID。')
}
export function noticeStatus(n) {
  return n.revokedAt ? 'revoked' : Date.parse(n.startTime) > Date.now() ? 'scheduled' : Date.parse(n.endTime) < Date.now() ? 'expired' : 'active'
}
export function runDemoCommand(current, resource, method, input) {
  const state = structuredClone(current), now = new Date().toISOString()
  let data, before = null, id = input.id, action = input.action || (method === 'PATCH' ? 'update' : 'create')
  if (resource === 'profile') {
    checkVersion(state.profile, input); before = { ...state.profile }; id = state.profile.schoolID
    if (action === 'upload_logo') state.profile.schoolLogo = input.logoData
    else {
      if (!input.schoolName?.trim() || input.schoolName.length > 100 || !input.schoolAddress?.length || input.schoolAddress.length > 10 || input.schoolAddress.some(a => typeof a !== 'string' || a.length > 200)) fail('请填写学校名称与分段地址。')
      state.profile.schoolName = input.schoolName; state.profile.schoolAddress = input.schoolAddress
    }
    state.profile.version++; data = state.profile
  } else if (resource === 'semesters') {
    const old = state.semesters.find(t => t.semesterID === id)
    if (method === 'PATCH') checkVersion(old, input)
    validateTerm(input, state.semesters, id); before = old || null
    data = { ...old, schoolID: 1, semesterID: id || nextID(state.semesters, 'semesterID'), schoolYear: input.schoolYear, season: input.season, startDate: input.startDate, endDate: input.endDate, firstMonday: input.firstMonday, version: (old?.version || 0) + 1, calendarVersionID: old?.calendarVersionID || null }
    state.semesters = [...state.semesters.filter(t => t.semesterID !== data.semesterID), data]; id = data.semesterID
    if (old && ['startDate','endDate','firstMonday'].some(k=>old[k]!==data[k])) {
      for (const table of state.timetables.filter(t=>t.semesterID===id)) {
        if (table.overrides.some(o=>Date.parse(data.firstMonday)+(o.weekNo-1)*7*86400000>Date.parse(data.endDate))) fail('更改后的学期无法容纳现有临时覆盖周。')
        table.version++
      }
    }
  } else if (resource === 'announcements') {
    const old = state.announcements.find(n => n.announceID === id)
    if (action !== 'create') checkVersion(old, input)
    before = old || null
    if (action === 'revoke') {
      if (old.revokedAt) fail('该通知已经撤回。')
      data = { ...old, revokedAt: now, version: old.version + 1 }
    } else {
      if (old?.revokedAt) fail('撤回的通知不能编辑。')
      validateNotice(input)
      data = { ...old, announceID: id || nextID(state.announcements, 'announceID'), schoolID: 1, title: input.title, content: input.content, type: input.type, target: input.target, startTime: input.publishMode === 'now' ? (old && Date.parse(old.startTime) <= Date.now() ? old.startTime : now) : input.startTime, endTime: input.endTime, revokedAt: null, version: (old?.version || 0) + 1, updatedAt: now }
    }
    state.announcements = [data, ...state.announcements.filter(n => n.announceID !== data.announceID)]; id = data.announceID
  } else if (resource === 'advertisements') {
    const old = state.advertisements.find(a => a.adID === id); checkVersion(old, input); before = old
    const allowed = { approve: 'pending', reject: 'pending', edit_reason: 'rejected', undo_rejection: 'rejected', withdraw: 'approved', resubmit: 'withdrawn' }
    if (allowed[action] !== old.status) fail('当前状态无法执行该操作。')
    if (action === 'withdraw' && !input.reason?.trim()) fail('撤下广告必须填写原因。')
    if ((input.reason?.length || 0) > 2000) fail('原因最多 2000 字。')
    const status = { approve: 'approved', reject: 'rejected', edit_reason: 'rejected', withdraw: 'withdrawn', undo_rejection: 'pending', resubmit: 'pending' }[action]
    data = { ...old, status, reason: ['approved', 'pending'].includes(status) ? '' : input.reason || '', version: old.version + 1, reviewedAt: status === 'pending' ? null : now }
    state.advertisements = state.advertisements.map(a => a.adID === id ? data : a)
  } else if (resource === 'timetables' || resource === 'calendar') {
    const term = state.semesters.find(t => t.semesterID === Number(input.semesterID)); if (!term) fail('请选择学期。')
    const isTable = resource === 'timetables'
    let table = state.timetables.find(t => isTable && (id ? t.tableID === id : t.semesterID === term.semesterID && scopeKey(t) === scopeKey(input)))
    if (isTable) {
      if (table) { checkVersion(table, input); if (table.semesterID !== term.semesterID) fail('课表与学期不匹配。') }
      else {
        if (action !== 'upload_base' || Number(input.version) !== 0) fail('请先发布常规课表。')
        if (!demoDirectory.classes.some(c => scopeKey(c) === scopeKey(input))) fail('请选择完整班级。')
        table = { tableID: nextID(state.timetables, 'tableID'), schoolID: 1, semesterID: term.semesterID, compoundID: input.compoundID, departmentID: input.departmentID, classID: input.classID, version: 0, baseVersionID: null, overrides: [] }; state.timetables.push(table)
      }
      before = structuredClone(table); id = table.tableID
    } else { checkVersion(term, input); before = structuredClone(term); id = term.semesterID }
    const versions = isTable ? state.timetableVersions : state.calendarVersions
    const validateWeeks = () => {
      if (!input.weeks?.length || input.weeks.some(w => !Number.isInteger(w) || w < 1 || w > 54 || Date.parse(term.firstMonday) + (w - 1) * 7 * 86400000 > Date.parse(term.endDate))) fail('请选择学期内的教学周。')
    }
    if (action === 'cancel_temporary') {
      validateWeeks(); table.overrides = table.overrides.filter(o => !input.weeks.includes(o.weekNo))
    } else if (action === 'restore_base' || action === 'restore') {
      const v = versions.find(v => v.versionID === input.versionID && (isTable ? v.tableID === id && v.kind === 'base' : v.semesterID === id)); if (!v) fail('找不到可恢复的版本。')
      if (isTable) table.baseVersionID = v.versionID; else term.calendarVersionID = v.versionID
    } else {
      if (!(isTable ? ['upload_base', 'upload_temporary'] : ['upload']).includes(action)) fail('不支持该操作。')
      if (!input.file?.name?.toLowerCase().endsWith('.ics') || input.file.size > 2 * 1024 * 1024 || !/BEGIN:VCALENDAR/.test(input.file.text) || !/END:VCALENDAR/.test(input.file.text)) fail('请选择有效 ICS 文件，最大 2 MiB。')
      validateDemoICS(input.file.text, action === 'upload_temporary')
      if (action === 'upload_temporary') validateWeeks()
      const versionID = nextID(versions, 'versionID')
      const version = { versionID, ...(isTable ? { tableID: id, kind: action === 'upload_base' ? 'base' : 'temporary' } : { semesterID: id }), originalName: input.file.name, createdAt: now }
      versions.unshift(version); state.fileContents[`${isTable ? 'timetable' : 'calendar'}:${versionID}`] = input.file.text
      if (isTable) {
        if (action === 'upload_base') table.baseVersionID = versionID
        else { table.overrides = table.overrides.filter(o => !input.weeks.includes(o.weekNo)); table.overrides.push(...input.weeks.map(weekNo => ({ weekNo, versionID }))) }
      } else term.calendarVersionID = versionID
    }
    if (isTable) { table.version++; data = table } else { term.version++; data = { semester: term, calendar: versions.find(v => v.versionID === term.calendarVersionID) } }
  } else fail('未知演示资源。')
  state.logs.unshift({ logID: nextID(state.logs, 'logID'), schoolID: 1, resource: ({announcements:'announcement',advertisements:'advertisement',timetables:'timetable',semesters:'semester',profile:'school'})[resource] || resource, resourceID: id, action, beforeJSON: JSON.stringify(before), afterJSON: JSON.stringify(data), createdAt: now })
  // File text is local demo state; the inspectable request shows real multipart fields.
  const request = { method, endpoint: `/api/school/${resource}.php`, input: { ...input } }
  if (request.input.file) request.input.file = request.input.file.name
  delete request.input.logoData
  state.requests.unshift(request)
  return { state, response: { code: 200, message: 'success', data } }
}
// Lightweight demo validation. Server remains the authority for full Sabre recurrence compilation.
export function validateDemoICS(text, temporary = false) {
  const normalized = text.replace(/\r\n/g,'\n').replace(/\n[ \t]/g,'')
  const blocks = normalized.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) || []
  if (blocks.length > 1000) fail('ICS 最多包含 1000 个原始事件。')
  if (/FREQ=(?:HOURLY|MINUTELY|SECONDLY)|BY(?:SECOND|MINUTE|HOUR)=|RDATE;[^\n]*VALUE=PERIOD/.test(normalized)) fail('此 ICS 含服务端不支持的循环规则。')
  let monday = null
  for (const block of blocks) {
    const get = name => block.match(new RegExp(`^${name}(?:;[^:]*)?:(.*)$`,'m'))?.[1]?.trim()
    const at=get('DTSTART'), end=get('DTEND')
    if (!get('UID') || !get('SUMMARY') || !at || !/^\d{8}(?:T\d{6}Z?)?$/.test(at)) fail('事件需有 UID、标题与有效开始时间。')
    if (at.includes('T') && !end && !get('DURATION')) fail('定时事件需有结束时间或时长。')
    if (temporary) {
      const parsed=Date.parse(`${at.slice(0,4)}-${at.slice(4,6)}-${at.slice(6,8)}T12:00:00Z`)
      const week=parsed-((new Date(parsed).getUTCDay()+6)%7)*86400000
      if (monday!==null&&week!==monday) fail('临时 ICS 只能描述一个源星期。')
      monday=week
      if (end) {
        const endDay=Date.parse(`${end.slice(0,4)}-${end.slice(4,6)}-${end.slice(6,8)}T00:00:00Z`)
        const endClock=end.includes('T')?Number(end.slice(9,11))*3600000+Number(end.slice(11,13))*60000+Number(end.slice(13,15))*1000:0
        if (endDay+endClock>week+7*86400000) fail('临时事件不能跨越源星期边界。')
      }
    }
  }
}

export function downloadICS(text, name) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url)
}
export function appendCalendarEvent(text, event) {
  if (!event.title?.trim() || !validDate(event.start) || !validDate(event.end) || Date.parse(event.end) <= Date.parse(event.start)) fail('请填写安排标题与有效起止时间。')
  const escape = s => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
  const stamp = s => s.replace(/[-:]/g, '') + '00'
  const entry = `BEGIN:VEVENT\r\nUID:${(globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`)}@campura.demo\r\nSUMMARY:${escape(event.title)}\r\nDTSTART;TZID=Asia/Shanghai:${stamp(event.start)}\r\nDTEND;TZID=Asia/Shanghai:${stamp(event.end)}\r\nLOCATION:${escape(event.location || '')}\r\nEND:VEVENT\r\n`
  return text.replace(/END:VCALENDAR\s*$/, `${entry}END:VCALENDAR\r\n`)
}

export function advertisementViewModels(rows) {
  return rows.map(a => ({...a,mainShop:{shopName:a.shopName},saleEvent:{saleRule:a.packageName},order:{orderID:a.orderNumber,price:a.amount===null?null:Number(a.amount),packageName:a.packageName},review:{...a}}))
}
export function dashboardAdStats(state) {
  const rows=state.advertisements, pending=rows.filter(a=>a.status==='pending'), approved=rows.filter(a=>a.status==='approved'), rejected=rows.filter(a=>a.status==='rejected')
  const day=value=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))
  const today=day(Date.now())
  const dailyMetrics=Array.from({length:7},(_,i)=>{
    const date=day(Date.parse(`${today}T12:00:00+08:00`)-(6-i)*86400000)
    const count=action=>state.logs.filter(l=>l.resource==='advertisement'&&l.action===action&&day(l.createdAt)===date).length
    return {date,approved:count('approve'),rejected:count('reject')}
  })
  const active=approved.filter(a=>Date.parse(a.startTime)<=Date.now()&&(!a.endTime||Date.parse(a.endTime)>=Date.now()))
  const reasons=rejected.reduce((map,a)=>({...map,[a.reason||'未填写原因']:(map[a.reason||'未填写原因']||0)+1}),{})
  return {pendingCount:pending.length,averageWaitingHours:pending.length?Math.round(pending.reduce((s,a)=>s+Math.max(0,(Date.now()-Date.parse(a.submittedAt))/3600000),0)/pending.length):0,approvalRate:approved.length+rejected.length?Math.round(100*approved.length/(approved.length+rejected.length)):null,processedThisWeek:dailyMetrics.reduce((s,d)=>s+d.approved+d.rejected,0),quoteTotal:rows.reduce((s,a)=>s+Number(a.amount||0),0),totalRevenue:null,impressions:null,clicks:null,currentOnlineStudents:null,activeAdsCount:active.length,activeLargeAds:active.filter(a=>a.type==='L').length,activeSmallAds:active.filter(a=>a.type==='S').length,rejectionReasons:Object.entries(reasons).map(([reason,count])=>({reason,count})),dailyMetrics}
}
