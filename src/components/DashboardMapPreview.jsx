import { useEffect, useState } from "react";
import { useSchoolDemo } from "../demo/DemoContext.jsx";
import CampusMiniMap from "./CampusMiniMap.jsx";

export default function DashboardMapPreview({ active, onOpenConsole }) {
  const { mapRequest, mapRefreshVersion } = useSchoolDemo();
  const [retry, setRetry] = useState(0);
  const [frameId, setFrameId] = useState("");
  const [preview, setPreview] = useState({ phase: "loading", revision: 0, document: null, error: "" });

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      setPreview((previous) => ({ ...previous, phase: "loading" }));
      try {
        const status = (await mapRequest("GET", { action: "status" })).data;
        const revision = Number(status.revision) || 0;
        if (cancelled) return;
        const document = revision
          ? (await mapRequest("GET", { action: "document", revision })).data
          : null;
        if (!cancelled) setPreview({ phase: "ready", revision, document, error: "" });
      } catch (error) {
        if (!cancelled) setPreview({ phase: "error", revision: 0, document: null, error: error.message });
      }
    });
    return () => { cancelled = true; };
  }, [active, mapRequest, mapRefreshVersion, retry]);

  const { phase, revision, document, error } = preview;
  const frames = document?.frames || [];
  const preferredFrame = frames.reduce((best, frame) => {
    const count = [document.features, document.nodes, document.edges]
      .reduce((total, collection) => total + collection.filter((item) => item.frameId === frame.id).length, 0);
    return count > best.count ? { id: frame.id, count } : best;
  }, { id: frames[0]?.id || "", count: -1 }).id;
  const selectedFrame = frames.find((frame) => frame.id === frameId)?.id || preferredFrame;
  const features = document?.features.filter((feature) => feature.frameId === selectedFrame) || [];
  const nodes = document?.nodes.filter((node) => node.frameId === selectedFrame) || [];
  const edges = document?.edges.filter((edge) => edge.frameId === selectedFrame) || [];

  return (
    <article className="info-card dashboard-map-card" aria-busy={phase === "loading"}>
      <div className="dashboard-map-heading">
        <div>
          <p className="eyebrow">校园空间</p>
          <h3>校园地图</h3>
        </div>
        {phase === "ready" && document && <span className="dashboard-map-version">主地图 v{revision}</span>}
      </div>
      {phase === "loading" && (
        <div className="dashboard-map-loading" role="status" aria-label="正在读取校园地图">
          <span className="skeleton-block" />
          <span className="skeleton-block" />
        </div>
      )}
      {phase === "error" && (
        <div className="dashboard-map-feedback" role="alert">
          <span>校园地图暂时无法读取：{error}</span>
          <button type="button" onClick={() => setRetry((value) => value + 1)}>重试</button>
        </div>
      )}
      {phase === "ready" && !document && (
        <button type="button" className="dashboard-map-empty" onClick={() => onOpenConsole("map")}>
          <span className="dashboard-map-empty-icon" aria-hidden="true">▧</span>
          <span>控制台中上传地图文件以预览校园地图</span>
          <span className="dashboard-map-arrow" aria-hidden="true">→</span>
        </button>
      )}
      {phase === "ready" && document && (
        <div className="dashboard-map-content">
          <div className="dashboard-map-visual">
            <CampusMiniMap features={features} nodes={nodes} edges={edges} wide />
          </div>
          <div className="dashboard-map-details">
            <strong>{document.title}</strong>
            {frames.length > 1 ? (
              <label>
                预览区域
                <select value={selectedFrame} onChange={(event) => setFrameId(event.target.value)}>
                  {frames.map((frame) => <option key={frame.id} value={frame.id}>{frame.name}</option>)}
                </select>
              </label>
            ) : <p>{frames[0]?.name || "尚无区域"}</p>}
            <div className="dashboard-map-counts">
              <span><strong>{features.length}</strong>地标</span>
              <span><strong>{edges.length}</strong>道路</span>
              <span><strong>{nodes.length}</strong>路点</span>
            </div>
            <button type="button" className="dashboard-map-open" onClick={() => onOpenConsole("map")}>
              在控制台查看 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
