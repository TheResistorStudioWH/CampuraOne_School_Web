import { useEffect, useRef, useState } from 'react'
import { readImport } from '../imports/files.js'
export default function FileImport({kind,label,onReady,onClear,preview,disabled=false}) {
  const [status,setStatus]=useState('idle'),[result,setResult]=useState(null),[error,setError]=useState('')
  const generation=useRef(0),input=useRef(null)
  useEffect(()=>()=>{generation.current++},[])
  async function select(files) {
    const id=++generation.current
    setResult(null);setError('');onClear?.()
    if(files.length!==1){setStatus('error');setError('每次请选择一个文件。');return}
    setStatus('reading')
    try {const next=await readImport(files[0],kind);if(id!==generation.current)return;setResult(next);setStatus('ready');onReady(next)}
    catch(e){if(id===generation.current){setStatus('error');setError(e.message)}}
  }
  function clear(){generation.current++;setResult(null);setError('');setStatus('idle');input.current.value='';onClear?.()}
  const accept={notice:'.docx,.md,.markdown,.txt,.doc',ics:'.ics',logo:'.png,.jpg,.jpeg,.webp'}[kind]
  return <section className="file-import" aria-label={label}>
    <label className="drop-upload-zone demo-upload" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!disabled)select(e.dataTransfer.files)}}>
      <div className="drop-zone-copy"><span>{kind==='notice'?'DOCX / Markdown / TXT · 最大 10 MiB':kind==='ics'?'ICS · 最大 2 MiB':'JPEG / PNG / WebP · 最大 5 MiB'}</span><strong>{status==='reading'?'正在读取与检查…':result?.file.name||label}</strong><small>拖入单个文件，或点击选择</small></div>
      <input ref={input} type="file" disabled={disabled} accept={accept} aria-label={label} onChange={e=>{if(e.target.files.length)select(e.target.files);e.target.value=''}} />
    </label>
    <div aria-live="polite">{error&&<p className="import-error" role="alert">{error}</p>}{result&&<><p className="import-summary">{result.summary}<button type="button" className="quiet-action" onClick={clear}>移除文件</button></p>{result.warnings.length>0&&<ul className="import-warnings">{result.warnings.map((warning,i)=><li key={i}>{warning}</li>)}</ul>}{preview?.(result)}</>}</div>
  </section>
}
