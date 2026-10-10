const paths = { profile:'profile', directory:'directory', students:'students', semesters:'semesters', announcements:'announcements', advertisements:'advertisements', timetables:'timetables', calendar:'calendar', dashboard:'dashboard' }
export class ApiError extends Error {
  constructor(status, message, details) { super(message); this.status=status; this.details=details }
}
export function serverDate(value) {
  return typeof value==='string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? value.replace(' ','T')+'+08:00' : value
}
export function normalize(value) {
  if(Array.isArray(value))return value.map(normalize)
  if(value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k, /(?:ID|^version$|^weekNo$|^type$|^isDemo$)$/.test(k)&&v!==null&&!Array.isArray(v)&&typeof v!=='object'&&/^\d+$/.test(String(v))?Number(v):normalize(v)]))
  return serverDate(value)
}
export function createSchoolClient({base='',token=()=>null,fetcher=fetch,onUnauthorized=()=>{}}={}) {
  const root=base.replace(/\/$/,'')
  let savedToken=null
  async function request(resource,method='GET',input={},options={}) {
    const auth=['login','logout','session','password'].includes(resource)
    if(!auth&&!paths[resource])throw new Error('未知接口资源。')
    let url=`${root}/api/${auth?'auth/school':'school'}/${paths[resource]||resource}.php`
    const headers={Accept:'application/json'},credential=savedToken||token()
    if(credential&&resource!=='login')headers.Authorization=`Bearer ${credential}`
    let body
    if(method==='GET') { const query=new URLSearchParams(Object.entries(input).filter(([,v])=>v!==undefined&&v!==null)); if(query.size)url+='?'+query }
    else if(input.file instanceof Blob) {
      body=new FormData()
      for(const [key,value] of Object.entries(input))if(value!==undefined&&value!==null&&key!=='logoData')body.append(key,key==='file'?value:typeof value==='object'?JSON.stringify(value):String(value))
    } else {headers['Content-Type']='application/json';body=JSON.stringify(input)}
    let response
    try {response=await fetcher(url,{method,headers,body,signal:options.signal,cache:'no-store',credentials:'omit'})}
    catch(error){if(error.name==='AbortError')throw error;throw new ApiError(0,'无法连接服务器，请检查网络后重试。')}
    let payload
    try {payload=await response.json()}catch{throw new ApiError(response.status,'服务器返回了无法识别的内容，请检查接口配置。')}
    if(!response.ok||payload.code!==200) {
      if(response.status===401&&resource!=='login'){savedToken=null;onUnauthorized()}
      const message=response.status===409?'记录已被更新。已重新读取，请核对后再提交。':response.status===401?'账号或密码不正确，或登录已过期。':response.status===429?'尝试过于频繁，请在 15 分钟后重试。':payload.message||'操作失败。'
      throw new ApiError(response.status,message,payload.data)
    }
    return {...payload,data:normalize(payload.data)}
  }
  async function list(resource,input={},options={}) {
    const items=[];let page=1,total=Infinity
    while(items.length<total){const {data}=await request(resource,'GET',{...input,page,limit:100},options);if(!Array.isArray(data.items)||!Number.isFinite(Number(data.total)))throw new ApiError(0,'分页响应不符合接口约定。');items.push(...data.items);total=Number(data.total);if(!data.items.length)break;page++}
    return items
  }
  async function original(path,options={}) {
    // Server history returns its original uploaded path; only allow documented public ICS directories.
    if(!/^uploads\/(?:course_tables|school_calendars)\/[a-zA-Z0-9_-]+\.ics$/.test(path||''))throw new Error('原文件地址不可用。')
    const response=await fetcher(`${root}/${path}`,{signal:options.signal,cache:'no-store',credentials:'omit'})
    if(!response.ok)throw new ApiError(response.status,'无法读取原始 ICS 文件。')
    return response.text()
  }
  return {request,list,original,setToken:value=>{savedToken=value}}
}
export async function loadSchoolState(client,signal) {
  const options={signal}
  const [dashboard,directory,semesters,announcements,advertisements]=await Promise.all([
    client.request('dashboard','GET',{},options).then(r=>r.data),client.request('directory','GET',{},options).then(r=>r.data),client.list('semesters',{},options),client.list('announcements',{},options),client.list('advertisements',{},options),
  ])
  const schedules=await Promise.all(semesters.map(async term=>{
    const [tables,calendarVersions]=await Promise.all([client.list('timetables',{semesterID:term.semesterID},options),client.list('calendar',{semesterID:term.semesterID,action:'history'},options)])
    const details=await Promise.all(tables.map(t=>Promise.all([client.request('timetables','GET',{id:t.tableID},options).then(r=>r.data),client.list('timetables',{id:t.tableID,action:'history'},options)])))
    return {tables:details.map(d=>d[0]),versions:details.flatMap(d=>d[1]),calendarVersions}
  }))
  return {profile:dashboard.school,directory,semesters,announcements,advertisements,dashboard,timetables:schedules.flatMap(s=>s.tables),timetableVersions:schedules.flatMap(s=>s.versions),calendarVersions:schedules.flatMap(s=>s.calendarVersions),fileContents:{},logs:[],requests:[]}
}
export function dashboardStats(data) {
  const source=data.adStats,active=source.activeAds||[]
  const today=data.date
  const dailyMetrics=Array.from({length:7},(_,i)=>{const date=new Date(Date.parse(today+'T12:00:00Z')-(6-i)*86400000).toISOString().slice(0,10);const count=action=>Number(source.reviewTrend.find(r=>r.date===date&&r.action===action)?.count||0);return {date,approved:count('approve'),rejected:count('reject')}})
  return {...source,pendingCount:Number(source.pendingCount),averageWaitingHours:Math.round(Number(source.averageWaitingHours)*10)/10,approvalRate:source.approvalRate===null?null:Number(source.approvalRate),processedThisWeek:Number(source.processedThisWeek),quoteTotal:Number(source.quoteTotal),activeAdsCount:active.reduce((n,a)=>n+Number(a.count),0),activeLargeAds:Number(active.find(a=>a.type==='L')?.count||0),activeSmallAds:Number(active.find(a=>a.type==='S')?.count||0),rejectionReasons:source.rejectionReasons.map(r=>({...r,count:Number(r.count)})),dailyMetrics}
}
