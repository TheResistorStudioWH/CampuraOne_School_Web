import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createDemoState, runDemoCommand, emptyTarget, appendCalendarEvent, dashboardAdStats, validateDemoICS } from '../src/demo/schoolDemo.js'
const command=(s,r,i,m='POST')=>runDemoCommand(s,r,m,i)
const future=new Date(Date.now()+86400000).toISOString()

test('advertisement DTOs use existing Server schema fields',()=>{
  const spec=JSON.parse(readFileSync('../../Server/docs/openapi-school.json','utf8'))
  const fields=Object.keys(spec.components.schemas.Advertisement.properties)
  for(const ad of createDemoState().advertisements)assert.ok(Object.keys(ad).every(k=>fields.includes(k)))
})
test('review lifecycle, mandatory withdrawal reason, stale versions and history',()=>{
  let s=createDemoState(),ad=s.advertisements[0]
  s=command(s,'advertisements',{id:ad.adID,version:1,action:'approve'}).state
  assert.throws(()=>command(s,'advertisements',{id:ad.adID,version:1,action:'withdraw',reason:'test'}),/更新/)
  assert.throws(()=>command(s,'advertisements',{id:ad.adID,version:2,action:'withdraw'}),/原因/)
  s=command(s,'advertisements',{id:ad.adID,version:2,action:'withdraw',reason:'活动结束'}).state
  assert.equal(s.advertisements[0].status,'withdrawn')
  s=command(s,'advertisements',{id:ad.adID,version:3,action:'resubmit'}).state
  assert.equal(s.advertisements[0].status,'pending');assert.equal(s.advertisements[0].reason,'')
  assert.equal(s.logs.filter(l=>l.resourceID===ad.adID).length,3)
})
test('notice scope, student IDs, edit/revoke and status guards',()=>{
  let s=createDemoState()
  const input={title:'演示通知',content:'正文',type:2,publishMode:'now',endTime:future,target:emptyTarget()}
  let result=command(s,'announcements',input);s=result.state;const n=result.response.data
  assert.equal(n.type,2)
  assert.throws(()=>command(s,'announcements',{...input,target:{...emptyTarget(),allSchool:false,classScopes:[{classID:2401}]}}),/完整/)
  assert.throws(()=>command(s,'announcements',{...input,target:{...emptyTarget(),allSchool:false,studentIDs:[999]}}),/学生/)
  s=command(s,'announcements',{id:n.announceID,version:1,action:'revoke'}).state
  assert.throws(()=>command(s,'announcements',{...input,id:n.announceID,version:2},'PATCH'),/撤回/)
})
test('temporary timetable replaces selected weeks, cancel and restore preserve other overrides',()=>{
  let s=createDemoState()
  const empty='BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR'
  const upload={id:1,semesterID:1,version:1,action:'upload_temporary',weeks:[3,5],file:{name:'empty.ics',size:empty.length,text:empty}}
  s=command(s,'timetables',upload).state
  const first=s.timetables[0].overrides[0].versionID
  s=command(s,'timetables',{...upload,version:2,weeks:[3]}).state
  assert.notEqual(s.timetables[0].overrides.find(o=>o.weekNo===3).versionID,first)
  assert.equal(s.timetables[0].overrides.find(o=>o.weekNo===5).versionID,first)
  s=command(s,'timetables',{id:1,semesterID:1,version:3,action:'restore_base',versionID:1}).state
  assert.equal(s.timetables[0].overrides.length,2)
  s=command(s,'timetables',{id:1,semesterID:1,version:4,action:'cancel_temporary',weeks:[3]}).state
  assert.deepEqual(s.timetables[0].overrides.map(o=>o.weekNo),[5])
})
test('calendar arrangement produces a full upload version and restore uses semester version',()=>{
  let s=createDemoState();const original=s.fileContents['calendar:1']
  const text=appendCalendarEvent(original,{title:'临时安排',start:'2026-10-09T09:00',end:'2026-10-09T10:00'})
  assert.ok(text.includes('UID:demo-opening'));assert.ok(text.includes('SUMMARY:临时安排'))
  s=command(s,'calendar',{semesterID:1,version:1,action:'upload',file:{name:'安排.ics',size:text.length,text}}).state
  assert.equal(s.semesters[0].calendarVersionID,2)
  s=command(s,'calendar',{semesterID:1,version:2,action:'restore',versionID:1}).state
  assert.equal(s.semesters[0].calendarVersionID,1);assert.equal(s.calendarVersions.length,2)
})
test('semester overlap and non-Monday validation',()=>{
  const s=createDemoState(),term={schoolYear:'2026-2027',season:'autumn',startDate:'2026-09-01',endDate:'2027-01-31',firstMonday:'2026-09-07'}
  assert.throws(()=>command(s,'semesters',term),/重叠/)
  assert.throws(()=>command(s,'semesters',{...term,firstMonday:'2026-09-08'}),/周一/)
})
test('metrics use operation counts, quote total and unavailable nulls',()=>{
  let s=createDemoState();const before=dashboardAdStats(s)
  s=command(s,'advertisements',{id:1001,version:1,action:'approve'}).state
  assert.equal(dashboardAdStats(s).processedThisWeek,before.processedThisWeek+1)
  assert.equal(before.totalRevenue,null);assert.equal(before.impressions,null);assert.equal(before.currentOnlineStudents,null)
  assert.equal(before.quoteTotal,3430)
})
test('temporary file rejects two source weeks',()=>{
  const event=date=>`BEGIN:VEVENT\nUID:${date}\nSUMMARY:test\nDTSTART:${date}T090000\nDTEND:${date}T100000\nEND:VEVENT`
  assert.throws(()=>validateDemoICS(`BEGIN:VCALENDAR\n${event('20261005')}\n${event('20261012')}\nEND:VCALENDAR`,true),/一个源星期/)
})
