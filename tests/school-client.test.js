import test from 'node:test'
import assert from 'node:assert/strict'
import {createSchoolClient,normalize,dashboardStats} from '../src/api/schoolClient.js'
const json=data=>new Response(JSON.stringify({code:200,message:'success',data}),{headers:{'Content-Type':'application/json'}})
test('client follows paginated API and normalizes numeric IDs and Shanghai timestamps',async()=>{
  const requests=[]
  const client=createSchoolClient({token:()=> 'sc_test',fetcher:async(url,options)=>{requests.push({url,options});const page=Number(new URL(url,'http://localhost').searchParams.get('page'));return json({total:101,items:page===1?Array.from({length:100},(_,i)=>({adID:String(i+1),version:'2',submittedAt:'2026-10-10 09:00:00'})):[{adID:'101',version:'2'}]})}})
  const items=await client.list('advertisements');assert.equal(items.length,101);assert.equal(items[0].adID,1);assert.equal(items[0].submittedAt,'2026-10-10T09:00:00+08:00');assert.equal(requests[1].options.headers.Authorization,'Bearer sc_test')
})
test('multipart preserves file and encodes week arrays; JSON keeps structured target',async()=>{
  const received=[];const client=createSchoolClient({fetcher:async(url,options)=>{received.push(options);return json({})}})
  const file=new File(['BEGIN:VCALENDAR'],'table.ics',{type:'text/calendar'})
  await client.request('timetables','POST',{file,weeks:[3,5],version:1,action:'upload_temporary'})
  assert.equal(received[0].headers['Content-Type'],undefined);assert.equal(received[0].body.get('weeks'),'[3,5]');assert.equal(received[0].body.get('file').name,'table.ics')
  await client.request('announcements','PATCH',{target:{allSchool:false,classScopes:[{compoundID:1,departmentID:2,classID:3}]}})
  assert.equal(JSON.parse(received[1].body).target.classScopes[0].classID,3)
})
test('401, conflict and non-JSON failures are not successful writes',async()=>{
  let expired=0;const client=createSchoolClient({onUnauthorized:()=>expired++,fetcher:async()=>new Response(JSON.stringify({code:401,message:'expired'}),{status:401})})
  await assert.rejects(client.request('profile'),e=>e.status===401);assert.equal(expired,1)
  const conflict=createSchoolClient({fetcher:async()=>new Response(JSON.stringify({code:409,data:{version:4}}),{status:409})})
  await assert.rejects(conflict.request('profile','PATCH',{}),e=>e.status===409&&e.details.version===4)
  await assert.rejects(createSchoolClient({fetcher:async()=>new Response('<html>oops</html>')}).request('profile'),/无法识别/)
})
test('raw original ICS is restricted to Server upload directories',async()=>{
  const urls=[];const client=createSchoolClient({fetcher:async url=>{urls.push(url);return new Response('BEGIN:VCALENDAR')}})
  assert.equal(await client.original('uploads/school_calendars/abc-123.ics'),'BEGIN:VCALENDAR')
  await assert.rejects(client.original('https://untrusted.test/token'));await assert.rejects(client.original('uploads/school_calendars/../../config/database.php'));assert.equal(urls.length,1)
})
test('dashboard uses authoritative API metrics and sparse seven day trend',()=>{
  const stats=dashboardStats({date:'2026-10-10',adStats:{pendingCount:'0',averageWaitingHours:'1.23',approvalRate:null,processedThisWeek:'2',quoteTotal:'100',activeAds:[{type:'S',count:'1'}],rejectionReasons:[],reviewTrend:[{date:'2026-10-09',action:'approve',count:'2'}],totalRevenue:null}})
  assert.equal(stats.activeAdsCount,1);assert.equal(stats.dailyMetrics.length,7);assert.equal(stats.dailyMetrics[5].approved,2);assert.equal(stats.totalRevenue,null);assert.equal(stats.approvalRate,null)
  assert.equal(normalize({studentNumber:'00001',schoolID:'2'}).studentNumber,'00001')
})
