

export function parseIcs(icsText) {
  if (!icsText || typeof icsText !== 'string') {
    return []
  }

  const normalizedText = unfoldIcsLines(icsText)
  const eventBlocks = normalizedText.match(/BEGIN:VEVENT[\s\S]*?END:VEVENT/g) ?? []

  return eventBlocks
    .map((block, index) => parseEventBlock(block, index))
    .filter(Boolean)
    .sort((a, b) => a.startValue.localeCompare(b.startValue))
}

function parseEventBlock(block, index) {
  const summary = getIcsValue(block, 'SUMMARY')
  const description = getIcsValue(block, 'DESCRIPTION')
  const startValue = getIcsValue(block, 'DTSTART')
  const endValue = getIcsValue(block, 'DTEND')
  const location = getIcsValue(block, 'LOCATION') || '未填写'
  const repeatRule = getIcsValue(block, 'RRULE')

  if (!summary && !startValue) {
    return null
  }

  const parsedStart = formatIcsDateTime(startValue)
  const parsedEnd = formatIcsDateTime(endValue)
  const courseInfo = parseCourseInfo(summary, description)

  return {
    id: `${startValue || 'unknown'}-${index}`,
    title: courseInfo.title,
    teacher: courseInfo.teacher,
    date: parsedStart.date,
    weekday: parsedStart.weekday,
    startTime: parsedStart.time,
    endTime: parsedEnd.time,
    timeText: parsedEnd.time ? `${parsedStart.time} - ${parsedEnd.time}` : parsedStart.time,
    location,
    repeatText: formatRepeatRule(repeatRule),
    startValue: startValue || '',
  }
}

function unfoldIcsLines(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '')
}

function getIcsValue(block, fieldName) {
  const escapedName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = block.match(new RegExp(`^${escapedName}(?:;[^:]*)?:(.*)$`, 'm'))

  if (!match) {
    return ''
  }

  return decodeIcsText(match[1].trim())
}

function decodeIcsText(value) {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function parseCourseInfo(summary, description) {
  const fallbackTitle = summary || '未命名课程'
  const teacherFromSummary = fallbackTitle.match(/（(.+?)）/)?.[1]
  const titleFromSummary = fallbackTitle.replace(/（.+?）/g, '').trim()

  const courseFromDescription = description.match(/课程：([^\n]+)/)?.[1]?.trim()
  const teacherFromDescription = description.match(/教师：([^\n]+)/)?.[1]?.trim()

  return {
    title: courseFromDescription || titleFromSummary || fallbackTitle,
    teacher: teacherFromDescription || teacherFromSummary || '未填写',
  }
}

function formatIcsDateTime(value) {
  if (!value) {
    return {
      date: '未填写',
      weekday: '',
      time: '',
    }
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T?(\d{2})?(\d{2})?/) 

  if (!match) {
    return {
      date: value,
      weekday: '',
      time: '',
    }
  }

  const [, year, month, day, hour = '', minute = ''] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  return {
    date: `${month}-${day}`,
    weekday: getWeekdayText(date.getDay()),
    time: hour && minute ? `${hour}:${minute}` : '',
  }
}

function getWeekdayText(day) {
  return ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day] ?? ''
}

function formatRepeatRule(rule) {
  if (!rule) {
    return '单次'
  }

  if (rule.includes('FREQ=WEEKLY') && rule.includes('INTERVAL=2')) {
    return '隔周重复'
  }

  if (rule.includes('FREQ=WEEKLY')) {
    return '每周重复'
  }

  return '重复课程'
}