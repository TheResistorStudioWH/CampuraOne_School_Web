import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
export default function MarkdownPreview({children}) {
  return <div className="markdown-preview-card demo-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{img:({alt})=><span>[图片：{alt||'未加载'}]</span>,a:({href,children})=><a href={href} target="_blank" rel="noreferrer">{children}</a>}}>{children}</ReactMarkdown></div>
}
