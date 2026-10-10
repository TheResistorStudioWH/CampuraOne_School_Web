import test from 'node:test'
import assert from 'node:assert/strict'
import {validateFile,decodeText,inspectICS,inspectDocx,markdownTable} from '../src/imports/files.js'
test('file checks distinguish legacy doc, wrong extension, empty file and limits',()=>{
  assert.throws(()=>validateFile({name:'old.doc',size:10},'notice'),/另存为/)
  assert.throws(()=>validateFile({name:'bad.exe',size:10},'ics'),/请选择/)
  assert.throws(()=>validateFile({name:'empty.ics',size:0},'ics'),/为空/)
  assert.throws(()=>validateFile({name:'huge.ics',size:2097153},'ics'),/超过/)
  assert.equal(validateFile({name:'TABLE.ICS',size:100},'ics'),'ics')
})
test('UTF-8 BOM and line endings normalize, corrupt binary never imports',()=>{
  assert.equal(decodeText(new TextEncoder().encode('\uFEFF通知\r\n正文')),'通知\n正文')
  assert.throws(()=>decodeText(Uint8Array.from([255,254,3])),/UTF-8/)
  assert.throws(()=>decodeText(new TextEncoder().encode('a\0b')),/二进制/)
})
test('ICS checks balanced structure and supports deliberate empty weeks',()=>{
  assert.deepEqual(inspectICS('BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR'),{events:0})
  assert.throws(()=>inspectICS('BEGIN:VCALENDAR\nBEGIN:VEVENT\nEND:VCALENDAR'),/闭合/)
  assert.throws(()=>inspectICS('BEGIN:VCALENDAR\nEND:VCALENDAR'),/VERSION/)
})
test('renamed files and corrupt DOCX archives are rejected before conversion',()=>{
  assert.throws(()=>inspectDocx(new TextEncoder().encode('not docx').buffer),/有效/)
  const bytes=new Uint8Array(24);new DataView(bytes.buffer).setUint32(0,0x04034b50,true);assert.throws(()=>inspectDocx(bytes.buffer),/损坏/)
})

test('Word paragraphs inside table cells produce valid GFM rows',()=>{
  assert.equal(markdownTable([['项目\n\n','时间'],['临时\n安排','周一 | 周二']]),'| 项目 | 时间 |\n| --- | --- |\n| 临时 安排 | 周一 \\| 周二 |')
})
