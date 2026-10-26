import { useCallback, useEffect, useRef, useState } from "react";
import { encodeCamap } from "@campura/camap";
import { useSchoolDemo } from "../demo/DemoContext.jsx";
import CampusMiniMap from "./CampusMiniMap.jsx";
export default function CampusMapPanel() {
  const { mapRequest, isDemo } = useSchoolDemo(),
    [status, setStatus] = useState(null),
    [draft, setDraft] = useState(null),
    [choices, setChoices] = useState({}),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [current, setCurrent] = useState(null),
    [frame, setFrame] = useState(""),
    [note, setNote] = useState(""),
    input = useRef(null);
  const refresh = useCallback(async () => {
    const s = (await mapRequest("GET", { action: "status" })).data;
    setStatus(s);
    if (s.revision)
      setCurrent((await mapRequest("GET", { action: "document" })).data);
  }, [mapRequest]);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) refresh().catch((e) => setMessage(e.message));
    });
    return () => {
      active = false;
    };
  }, [refresh]);
  async function run(fn) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file) {
    if (!file) return;
    await run(async () => {
      const d = (await mapRequest("POST", { action: "upload", file })).data;
      setDraft(d);
      setChoices(d.resolutions || {});
      setMessage("文件校验完成，已创建草稿。核对地图后可以发布。");
      await refresh();
    });
  }
  async function loadDraft(id) {
    const d = (await mapRequest("GET", { action: "draft", draftId: id })).data;
    setDraft(d);
    setChoices(d.resolutions || {});
  }
  async function resolve() {
    const d = (
      await mapRequest("POST", {
        action: "resolve",
        draftId: draft.draftId,
        expectedRevision: draft.currentRevision,
        resolutions: choices,
      })
    ).data;
    setDraft(d);
    setMessage("合并选择已保存。");
  }
  async function download(revision) {
    const d = (
        await mapRequest("GET", {
          action: "document",
          ...(revision ? { revision } : {}),
        })
      ).data,
      bytes = await encodeCamap(d),
      url = URL.createObjectURL(
        new Blob([bytes], { type: "application/vnd.campura.camap" }),
      ),
      a = window.document.createElement("a");
    a.href = url;
    a.download = `${d.title}-v${d.baseRevision || 0}.camap`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
  const document = draft?.document || current,
    activeFrame =
      document?.frames.find((f) => f.id === frame)?.id ||
      document?.frames[0]?.id,
    features =
      document?.features.filter((f) => f.frameId === activeFrame) || [];
  return (
    <section className="camap-panel">
      <div className="camap-heading">
        <div>
          <span className="camap-eyebrow">CAMPURA · MAP STUDIO</span>
          <h2>校园地图</h2>
          <p>在万卷图里绘制，在这里核对并发布。</p>
        </div>
        <div className="camap-top-actions">
          {status?.installerURL ? (
            <a
              href={status.installerURL}
              target="_blank"
              rel="noreferrer"
              className="quiet-action"
            >
              下载万卷图
            </a>
          ) : (
            <span className="camap-unavailable">安装包尚未提供</span>
          )}
          <button
            className="quiet-action"
            disabled={busy}
            onClick={() => run(refresh)}
          >
            刷新
          </button>
          <button
            className="primary-action"
            disabled={busy || !status?.revision}
            onClick={() => run(() => download())}
          >
            下载当前主地图
          </button>
        </div>
      </div>
      {isDemo && (
        <div className="camap-demo-banner">
          本地演示：使用真实 .camap
          文件解析和合并，版本保存在当前浏览器；没有上传到生产服务器。
        </div>
      )}
      {message && (
        <div className="camap-message" role="status">
          {message}
        </div>
      )}
      <div
        className="camap-upload"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!busy) void upload(e.dataTransfer.files[0]);
        }}
      >
        <div className="camap-file-icon">↥</div>
        <div>
          <h3>将校园的细节带进来</h3>
          <p>
            拖入万卷图导出的
            .camap，或选择文件。上传先生成草稿，发布后才更新主地图。
          </p>
          <small>支持新区域增量合并 · 单文件不超过 20 MiB</small>
        </div>
        <button
          className="primary-action"
          disabled={busy}
          onClick={() => input.current.click()}
        >
          {busy ? "正在处理…" : "选择 .camap 文件"}
        </button>
        <input
          ref={input}
          type="file"
          accept=".camap"
          hidden
          onChange={(e) => {
            void upload(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>
      <div className="camap-main-grid">
        <div className="camap-map-card">
          <div className="camap-card-title">
            <h3>{draft ? "待发布预览" : "当前主地图"}</h3>
            <select
              aria-label="预览区域"
              value={activeFrame || ""}
              onChange={(e) => setFrame(e.target.value)}
            >
              {document?.frames.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <CampusMiniMap
            features={features}
            nodes={document?.nodes.filter((node) => node.frameId === activeFrame)}
            edges={document?.edges.filter((edge) => edge.frameId === activeFrame)}
          />
          <div className="camap-map-stats">
            <span>
              <strong>{document?.features.length || 0}</strong>地标
            </span>
            <span>
              <strong>{document?.nodes.length || 0}</strong>路点
            </span>
            <span>
              <strong>{document?.edges.length || 0}</strong>道路
            </span>
            <span>
              <strong>v{status?.revision || 0}</strong>
              {status?.revision ? "已发布" : "尚未发布"}
            </span>
          </div>
        </div>
        <div className="camap-review-card">
          <div className="camap-card-title">
            <h3>{draft ? "检查与合并" : "地图发布流程"}</h3>
            {draft && (
              <button
                className="quiet-action"
                disabled={busy}
                onClick={() => run(() => loadDraft(draft.draftId))}
              >
                重读差异
              </button>
            )}
          </div>
          {!draft ? (
            <ol className="camap-steps">
              <li>
                <strong>在万卷图绘制</strong>
                <p>建筑、商户、门与楼梯，逐一赋予真实含义。</p>
              </li>
              <li>
                <strong>上传并检查差异</strong>
                <p>不同对象自动合并，有冲突的对象由你选择。</p>
              </li>
              <li>
                <strong>发布整校主地图</strong>
                <p>保留每个历史版本，随时恢复。</p>
              </li>
            </ol>
          ) : (
            <>
              <p className="camap-review-description">
                基于主地图 v{draft.currentRevision} 合并 ·{" "}
                {draft.conflicts.length} 个冲突 · {draft.duplicates.length}{" "}
                个疑似重复
              </p>
              {draft.conflicts.length > 0 && (
                <div className="camap-bulk">
                  <button
                    onClick={() =>
                      setChoices((c) => ({
                        ...c,
                        ...Object.fromEntries(
                          draft.conflicts.map((x) => [x.key, "server"]),
                        ),
                      }))
                    }
                  >
                    全部保留线上
                  </button>
                  <button
                    onClick={() =>
                      setChoices((c) => ({
                        ...c,
                        ...Object.fromEntries(
                          draft.conflicts.map((x) => [x.key, "incoming"]),
                        ),
                      }))
                    }
                  >
                    全部采用上传
                  </button>
                </div>
              )}
              {draft.conflicts.map((c) => (
                <div className="camap-conflict" key={c.key}>
                  <strong>{c.incoming?.name || c.server?.name || c.id}</strong>
                  <div className="camap-compare">
                    {[
                      ["server", "当前主地图", c.server],
                      ["incoming", "本次上传", c.incoming],
                    ].map(([value, label, entity]) => (
                      <label
                        key={value}
                        className={choices[c.key] === value ? "chosen" : ""}
                      >
                        <span>
                          <input
                            type="radio"
                            name={c.key}
                            checked={choices[c.key] === value}
                            onChange={() =>
                              setChoices((s) => ({ ...s, [c.key]: value }))
                            }
                          />
                          {label}
                        </span>
                        {entity ? (
                          <>
                            <CampusMiniMap
                              features={[entity]}
                              highlight={entity.id}
                              comparison={[c.server, c.incoming].filter(
                                Boolean,
                              )}
                            />
                            <pre>{JSON.stringify(entity, null, 2)}</pre>
                          </>
                        ) : (
                          <p>此对象已删除</p>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {draft.duplicates.map((d) => (
                <div className="camap-duplicate" key={d.key}>
                  <span>
                    疑似重复：
                    {draft.document.features.find((f) => f.id === d.incomingId)
                      ?.name || d.incomingId.slice(0, 8)}
                  </span>
                  <select
                    aria-label="疑似重复处理"
                    value={choices[d.key] || "keep"}
                    onChange={(e) =>
                      setChoices((c) => ({ ...c, [d.key]: e.target.value }))
                    }
                  >
                    <option value="keep">保留两个</option>
                    <option value="drop">忽略上传对象</option>
                  </select>
                </div>
              ))}
              {draft.errors.map((e, i) => (
                <p className="camap-error" key={i}>
                  {e}
                </p>
              ))}
              <label className="camap-note">
                发布说明
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="例如：补充图书馆出入口与楼梯"
                  maxLength={500}
                />
              </label>
              <div className="camap-publish-actions">
                <button
                  className="quiet-action"
                  disabled={busy}
                  onClick={() => run(resolve)}
                >
                  保存选择并检查
                </button>
                <button
                  className="primary-action"
                  disabled={
                    busy || draft.conflicts.some((c) => !choices[c.key])
                  }
                  onClick={() =>
                    run(async () => {
                      const r = await mapRequest("POST", {
                        action: "publish",
                        draftId: draft.draftId,
                        expectedRevision: draft.currentRevision,
                        resolutions: choices,
                        note,
                      });
                      setDraft(null);
                      setNote("");
                      setMessage(`已发布主地图 v${r.data.revision}。`);
                      await refresh();
                    })
                  }
                >
                  发布地图
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {status?.drafts.length > 0 && (
        <div className="camap-history">
          <h3>未发布草稿</h3>
          {status.drafts.map((d) => (
            <div key={d.draftID}>
              <span>{d.title}</span>
              <small>{d.createdAt}</small>
              <button
                disabled={busy}
                onClick={() => run(() => loadDraft(d.draftID))}
              >
                继续检查
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="camap-history">
        <h3>版本记录</h3>
        {!status?.versions.length && (
          <p>发布第一份地图后，版本将保存在这里。</p>
        )}
        {status?.versions.map((v) => (
          <div key={v.revision}>
            <strong>v{v.revision}</strong>
            <span>{v.note}</span>
            <small>{v.createdAt}</small>
            <button
              disabled={busy}
              onClick={() => run(() => download(v.revision))}
            >
              下载
            </button>
            <button
              disabled={busy || v.revision === status.revision}
              onClick={() => {
                if (
                  window.confirm(
                    `将版本 v${v.revision} 恢复为一个新版本？当前历史仍会保留。`,
                  )
                )
                  void run(async () => {
                    const r = await mapRequest("POST", {
                      action: "rollback",
                      revision: v.revision,
                      expectedRevision: status.revision,
                    });
                    setDraft(null);
                    setMessage(`已恢复为新版本 v${r.data.revision}。`);
                    await refresh();
                  });
              }}
            >
              恢复此版本
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
