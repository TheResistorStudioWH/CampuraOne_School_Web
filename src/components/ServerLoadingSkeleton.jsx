export default function ServerLoadingSkeleton({ compact = false, label = '正在读取学校资料' }) {
  if (compact) return <div className="server-skeleton compact" role="status" aria-label={label}><span/><span/><span/><span/></div>
  return <main className="server-loading-screen" role="status" aria-label={label}>
    <div className="server-skeleton-top"><span className="skeleton-orb"/><span className="skeleton-line short"/><span className="skeleton-avatar"/></div>
    <div className="server-skeleton-heading"><span className="skeleton-line title"/><span className="skeleton-line subtitle"/></div>
    <div className="server-skeleton-grid"><div className="skeleton-block hero"/><div className="skeleton-block"/><div className="skeleton-block wide"/><div className="skeleton-block"/></div>
  </main>
}
