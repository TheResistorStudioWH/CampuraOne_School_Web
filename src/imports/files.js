const MiB=1024*1024
export function validateFile(file,kind) {
  if(!file)throw new Error('请选择文件。')
  const extension=file.name.split('.').pop().toLowerCase()
  const rules={notice:{extensions:['docx','md','markdown','txt'],max:10*MiB},ics:{extensions:['ics'],max:2*MiB},logo:{extensions:['jpg','jpeg','png','webp'],max:5*MiB}}
  const rule=rules[kind]
  if(extension==='doc'&&kind==='notice')throw new Error('旧版 .doc 无法在浏览器可靠转换。请在 Word 中另存为 .docx 后导入；不要只修改扩展名。')
  if(!rule.extensions.includes(extension))throw new Error(`请选择 ${rule.extensions.join(' / ')} 文件。`)
  if(!file.size)throw new Error('文件为空，请重新选择。')
  if(file.size>rule.max)throw new Error(`文件超过 ${rule.max/MiB} MiB 限制。`)
  return extension
}
export function decodeText(bytes) {
  let text
  try {text=new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{throw new Error('文件编码不是 UTF-8，请以 UTF-8 格式重新保存。')}
  if(text.includes('\0'))throw new Error('文件包含二进制内容，无法作为文本读取。')
  return text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n')
}
export function inspectDocx(bytes) {
  const data=new Uint8Array(bytes),view=new DataView(bytes)
  if(view.byteLength<22||view.getUint32(0,true)!==0x04034b50)throw new Error('文件不是有效的 DOCX 文档。')
  let end=-1
  for(let i=data.length-22;i>=Math.max(0,data.length-65557);i--)if(view.getUint32(i,true)===0x06054b50){end=i;break}
  if(end<0)throw new Error('DOCX 文件损坏，无法读取。')
  const count=view.getUint16(end+10,true),offset=view.getUint32(end+16,true)
  if(count>3000||offset>=data.length)throw new Error('DOCX 结构过于复杂。')
  let pos=offset,total=0,document=false
  for(let i=0;i<count;i++){
    if(pos+46>data.length||view.getUint32(pos,true)!==0x02014b50)throw new Error('DOCX 目录损坏。')
    total+=view.getUint32(pos+24,true)
    if(total>40*MiB)throw new Error('DOCX 解压后超过 40 MiB，请简化文档或删除大图片。')
    if(view.getUint16(pos+8,true)&1)throw new Error('不支持加密文档，请先取消文件加密。')
    const length=view.getUint16(pos+28,true)
    const name=new TextDecoder().decode(data.slice(pos+46,pos+46+length))
    if(name==='word/document.xml')document=true
    pos+=46+length+view.getUint16(pos+30,true)+view.getUint16(pos+32,true)
  }
  if(!document)throw new Error('文件没有 Word 正文，无法转换。')
}
export function inspectICS(text) {
  const lines=text.replace(/\n[ \t]/g,'').trim().split('\n')
  if(lines[0]!=='BEGIN:VCALENDAR'||lines.at(-1)!=='END:VCALENDAR')throw new Error('文件需包含完整的 VCALENDAR。')
  const stack=[];let events=0
  for(const line of lines){if(line.startsWith('BEGIN:')){stack.push(line.slice(6));if(line==='BEGIN:VEVENT')events++}else if(line.startsWith('END:')&&stack.pop()!==line.slice(4))throw new Error('ICS 组件没有正确闭合。')}
  if(stack.length)throw new Error('ICS 组件没有正确闭合。')
  if(events>1000)throw new Error('最多导入 1000 个原始事件。')
  if(!lines.includes('VERSION:2.0'))throw new Error('ICS 需使用 VERSION:2.0。')
  return {events}
}
export function markdownTable(rows){
  if(!rows.length)return ''
  const width=Math.max(...rows.map(row=>row.length))
  const line=row=>'| '+Array.from({length:width},(_,i)=>(row[i]||'').replace(/\\\|/g,'|').replace(/\|/g,'\\|').replace(/\s*\n+\s*/g,' ').trim()).join(' | ')+' |'
  return [line(rows[0]),line(Array(width).fill('---')),...rows.slice(1).map(line)].join('\n')
}
export async function readImport(file,kind) {
  const extension=validateFile(file,kind)
  if(kind==='logo') {
    const bytes=await file.arrayBuffer(),u=new Uint8Array(bytes)
    const mime=u[0]===255&&u[1]===216?'image/jpeg':u[0]===137&&u[1]===80&&u[2]===78&&u[3]===71?'image/png':new TextDecoder().decode(u.slice(0,4))==='RIFF'&&new TextDecoder().decode(u.slice(8,12))==='WEBP'?'image/webp':null
    if(!mime)throw new Error('图片内容不是 JPEG、PNG 或 WebP。')
    const blob=new Blob([bytes],{type:mime}),url=URL.createObjectURL(blob)
    // Image fallback works on HTTP IP sites where createImageBitmap may be unavailable.
    try {const dimensions=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve({width:img.naturalWidth,height:img.naturalHeight});img.onerror=()=>reject(new Error('图片损坏，无法读取。'));img.src=url});if(dimensions.width>8192||dimensions.height>8192)throw new Error('图片长宽均不能超过 8192 像素。');const dataURL=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('图片读取失败。'));reader.readAsDataURL(blob)});return {file:new File([blob],file.name,{type:mime}),dataURL,summary:`${dimensions.width} × ${dimensions.height} · ${(file.size/1024).toFixed(0)} KB`,warnings:[]}}
    finally{URL.revokeObjectURL(url)}
  }
  const bytes=await file.arrayBuffer()
  if(kind==='ics'){const text=decodeText(bytes);const {events}=inspectICS(text);return {file,text,summary:`${events} 个原始事件 · ${(file.size/1024).toFixed(1)} KB`,warnings:['循环、时区、学期范围和临时整周覆盖由服务器进行最终校验。']}}
  let markdown,warnings=[]
  if(extension==='docx') {
    inspectDocx(bytes)
    const [{default:mammoth},{default:Turndown},gfm]=await Promise.all([import('mammoth'),import('turndown'),import('turndown-plugin-gfm')])
    let images=0
    const result=await mammoth.convertToHtml({arrayBuffer:bytes},{externalFileAccess:false,convertImage:mammoth.images.imgElement(()=>{images++;return Promise.resolve({src:'',alt:'[文档图片未导入]'})})})
    // Never mount Mammoth's unsanitized HTML. Only inert parsed nodes go to Markdown.
    const parsed=new DOMParser().parseFromString(result.value,'text/html')
    parsed.querySelectorAll('script,style,iframe,object,embed').forEach(n=>n.remove())
    parsed.querySelectorAll('a').forEach(a=>{if(!/^(https?:|mailto:|#)/i.test(a.getAttribute('href')||''))a.removeAttribute('href')})
    parsed.querySelectorAll('img').forEach(n=>n.replaceWith(parsed.createTextNode('[文档图片未导入]')))
    parsed.querySelectorAll('table').forEach(table=>{const row=table.rows[0];if(row&&!table.querySelector('th'))Array.from(row.cells).forEach(cell=>{const th=parsed.createElement('th');th.innerHTML=cell.innerHTML;cell.replaceWith(th)})})
    const converter=new Turndown({headingStyle:'atx',bulletListMarker:'-',codeBlockStyle:'fenced'});converter.use(gfm.gfm)
    converter.addRule('wordTables',{filter:'table',replacement:(_content,node)=>'\n\n'+markdownTable(Array.from(node.rows,row=>Array.from(row.cells,cell=>converter.turndown(cell.innerHTML))))+'\n\n'})
    markdown=converter.turndown(parsed.body)
    warnings=result.messages.map(m=>m.message)
    if(images)warnings.push(`${images} 张文档图片未导入，请补充文字说明。`)
    if(parsed.querySelector('td[colspan],td[rowspan],th[colspan],th[rowspan]'))warnings.push('合并单元格已简化，请检查表格。')
  }else markdown=decodeText(bytes)
  if(!markdown.trim())throw new Error('文档没有可导入的正文。')
  if(markdown.length>100000)throw new Error('转换后的正文超过 100000 字符，请缩短后导入。')
  return {file,markdown,summary:`${markdown.length.toLocaleString()} 字符 · ${extension==='docx'?'已转换为 Markdown':'文本已读取'}`,warnings:[...new Set(warnings)]}
}
