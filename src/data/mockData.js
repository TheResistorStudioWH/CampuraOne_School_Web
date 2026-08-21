export const schoolInfo = {
  name: '测试学校',
  logoText: '校',
  adminName: '管理员',
}

export const notices = [
  { id: 1, type: '紧急', title: '教学楼 A 区今日下午临时停电', date: '2026-05-28', time: '14:20' },
  { id: 2, type: '日常', title: '图书馆开放时间调整', date: '2026-05-27', time: '09:30' },
  { id: 3, type: '重要', title: '期末考试安排说明', date: '2026-05-25', time: '16:45' },
  { id: 4, type: '系统', title: '校园地图商户信息已同步更新', date: '2026-05-24', time: '11:10' },
  { id: 5, type: '日常', title: '本周社团活动场地预约开放', date: '2026-05-23', time: '18:00' },
]

export const calendarEvents = [
  { id: 1, title: '春季学期第 13 教学周', time: '2026-05-25 ~ 2026-05-31' },
  { id: 2, title: '期末复习周', time: '2026-06-22 ~ 2026-06-28' },
  { id: 3, title: '暑假开始', time: '2026-07-06' },
]

export const dashboardStats = {
  currentOnlineStudents: 1023,
  nextDashboardPlans: [
    '删除与撤销通知 课表 校历',
    '接入学校端真实 API',
    '增加操作日志与权限分级',
  ],
}

export const timetable = {
  name: '软件技术 2401 班课表',
  department: '信息工程学院',
  className: '软件技术 2401',
  uploadDate: '2026-05-21',
  fileType: 'ICS 文件',
  sourceFileName: '2班课程表_单周重复.ics',
  icsText: `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ChatGPT//Campus Course Schedule//ZH-CN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:课程表
X-WR-TIMEZONE:Asia/Shanghai
BEGIN:VEVENT
UID:bfc8cf53-f397-53e0-89ed-aabdcea5e153@chatgpt.local
DTSTAMP:20260520T144302Z
SUMMARY:大学英语2（崔永琦）
DESCRIPTION:课程：大学英语2\\n教师：崔永琦
DTSTART;TZID=Asia/Shanghai:20260525T083000
DTEND;TZID=Asia/Shanghai:20260525T100500
RRULE:FREQ=WEEKLY;INTERVAL=2;WKST=MO
END:VEVENT
BEGIN:VEVENT
UID:dc01a0cb-2978-52de-b0f1-e87a570cd069@chatgpt.local
DTSTAMP:20260520T144302Z
SUMMARY:HTML5 响应式网页设计（黄菊）
DESCRIPTION:课程：HTML5 响应式网页设计\\n教师：黄菊
DTSTART;TZID=Asia/Shanghai:20260525T140000
DTEND;TZID=Asia/Shanghai:20260525T153500
RRULE:FREQ=WEEKLY;INTERVAL=2;WKST=MO
END:VEVENT
BEGIN:VEVENT
UID:d9d46c68-6646-54df-8344-4ce4920aab3c@chatgpt.local
DTSTAMP:20260520T144302Z
SUMMARY:卓越项目1（黄菊）
DESCRIPTION:课程：卓越项目1\\n教师：黄菊
DTSTART;TZID=Asia/Shanghai:20260526T083000
DTEND;TZID=Asia/Shanghai:20260526T100500
RRULE:FREQ=WEEKLY;INTERVAL=2;WKST=MO
END:VEVENT
BEGIN:VEVENT
UID:b35a938c-2b6c-5dc0-8506-d13c85bb3a1f@chatgpt.local
DTSTAMP:20260520T144302Z
SUMMARY:程序员实战之路（贾永红）
DESCRIPTION:课程：程序员实战之路\\n教师：贾永红
DTSTART;TZID=Asia/Shanghai:20260528T102000
DTEND;TZID=Asia/Shanghai:20260528T115500
RRULE:FREQ=WEEKLY;INTERVAL=2;WKST=MO
END:VEVENT
BEGIN:VEVENT
UID:58b5d0f5-055c-5409-a215-888f726cc519@chatgpt.local
DTSTAMP:20260520T144302Z
SUMMARY:C# 可视化程序设计（黄菊）
DESCRIPTION:课程：C# 可视化程序设计\\n教师：黄菊
DTSTART;TZID=Asia/Shanghai:20260528T140000
DTEND;TZID=Asia/Shanghai:20260528T153500
RRULE:FREQ=WEEKLY;INTERVAL=2;WKST=MO
END:VEVENT
BEGIN:VEVENT
UID:0a36a140-5171-51af-993b-b03d5ff7c1be@chatgpt.local
DTSTAMP:20260520T144302Z
SUMMARY:计算机应用基础（黄菊）
DESCRIPTION:课程：计算机应用基础\\n教师：黄菊
DTSTART;TZID=Asia/Shanghai:20260529T102000
DTEND;TZID=Asia/Shanghai:20260529T115500
RRULE:FREQ=WEEKLY;INTERVAL=2;WKST=MO
END:VEVENT
END:VCALENDAR`,
  backupIcsFiles: [
    {
      name: '2班课程表_双周重复.ics',
      description: '双周重复课程表示例，后续可以用于切换单双周预览。',
    },
  ],
}

export const ads = [
  {
    id: 1,
    merchant: '校园咖啡店',
    promotion: '第二杯半价',
    price: 300,
    startDate: '2026-05-20',
    endDate: '2026-06-20',
    duration: '31 天',
    adType: '首页顶部横幅',
    enabled: true,
    remaining: '剩余 23 天',
  },
  {
    id: 2,
    merchant: '文具便利店',
    promotion: '考试周文具套装优惠',
    price: 180,
    startDate: '2026-05-25',
    endDate: '2026-06-10',
    duration: '16 天',
    adType: 'Dashboard 小卡片',
    enabled: true,
    remaining: '剩余 13 天',
  },
  {
    id: 3,
    merchant: '奶茶小站',
    promotion: '新品试饮活动',
    price: 120,
    startDate: '2026-05-10',
    endDate: '2026-05-24',
    duration: '14 天',
    adType: '促销页推荐位',
    enabled: false,
    remaining: '已结束',
  },
]


export const departmentTargets = [
  {
    id: 'software',
    name: '信息工程学院',
    classes: [
      { id: 'software-2401', name: '软件技术 2401' },
      { id: 'software-2402', name: '软件技术 2402' },
    ],
  },
  {
    id: 'business',
    name: '商学院',
    classes: [
      { id: 'business-2401', name: '电子商务 2401' },
      { id: 'business-2402', name: '市场营销 2401' },
    ],
  },
]
