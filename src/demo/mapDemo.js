import {
  decodeCamap,
  newDocument,
  mergeDocuments,
  validateDocument,
} from "@campura/camap";
const KEY = "campura-camap-demo-v1";
export function createMapDemo() {
  let state = { masterId: crypto.randomUUID(), versions: [], drafts: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.versions && saved?.drafts) state = saved;
  } catch {
    /* Fresh demo. */
  }
  const persist = () => localStorage.setItem(KEY, JSON.stringify(state));
  function comparison(draft, choices = draft.resolutions) {
    const incoming = draft.incoming,
      current = state.versions.at(-1)?.document || newDocument(),
      base =
        incoming.baseRevision === null
          ? null
          : state.versions.find((v) => v.revision === incoming.baseRevision)
              ?.document;
    if (incoming.masterId !== null && incoming.masterId !== state.masterId)
      throw Error(
        "此文件属于另一份主地图。请使用独立新工程，或从这里下载当前主地图编辑。",
      );
    if (incoming.baseRevision !== null && !base && incoming.baseRevision !== 0)
      throw Error("文件的基准版本不存在。");
    const result = mergeDocuments(base || null, current, incoming, choices);
    if (!state.versions.length) result.document.title = incoming.title;
    result.document.masterId = state.masterId;
    result.document.id = state.masterId;
    result.document.baseRevision = state.versions.length;
    return {
      ...result,
      errors: validateDocument(result.document).map((i) => i.message),
      currentRevision: state.versions.length,
      draftId: draft.draftId,
      resolutions: choices,
      status: draft.status,
    };
  }
  function publish(document, note) {
    const revision = state.versions.length + 1,
      d = structuredClone(document);
    d.masterId = state.masterId;
    d.id = state.masterId;
    d.baseRevision = revision;
    d.tombstones = [];
    state.versions.push({
      revision,
      note,
      createdAt: new Date().toISOString(),
      document: d,
    });
    persist();
    return { revision };
  }
  return async function request(method = "GET", input = {}) {
    const action = input.action || "status";
    let data;
    if (method === "GET" && action === "status")
      data = {
        masterId: state.masterId,
        revision: state.versions.length,
        versions: state.versions
          .map((v) => ({
            revision: v.revision,
            note: v.note,
            createdAt: v.createdAt,
          }))
          .reverse(),
        drafts: state.drafts
          .filter((d) => d.status === "draft")
          .map((d) => ({
            draftID: d.draftId,
            title: d.incoming.title,
            status: d.status,
            createdAt: d.createdAt,
          })),
        installerURL: import.meta.env.VITE_CAMAP_EDITOR_DOWNLOAD_URL || null,
      };
    else if (method === "GET" && action === "document")
      data =
        state.versions.find(
          (v) => v.revision === (input.revision ?? state.versions.length),
        )?.document || newDocument();
    else if (method === "GET" && action === "draft") {
      const draft = state.drafts.find((d) => d.draftId === input.draftId);
      if (!draft) throw Error("草稿不存在");
      data = comparison(draft);
    } else if (method === "POST" && action === "upload") {
      if (
        !input.file?.name.toLowerCase().endsWith(".camap") ||
        input.file.size > 20 * 1024 * 1024
      )
        throw Error("请选择不超过 20 MiB 的 .camap 文件");
      const incoming = await decodeCamap(
          new Uint8Array(await input.file.arrayBuffer()),
        ),
        draft = {
          draftId: crypto.randomUUID(),
          incoming,
          resolutions: {},
          status: "draft",
          createdAt: new Date().toISOString(),
        };
      data = comparison(draft);
      state.drafts.push(draft);
      persist();
    } else if (method === "POST" && ["resolve", "publish"].includes(action)) {
      const draft = state.drafts.find((d) => d.draftId === input.draftId);
      if (!draft) throw Error("草稿不存在");
      if (draft.status === "published")
        return {
          data: { revision: draft.publishedRevision, alreadyPublished: true },
        };
      if (input.expectedRevision !== state.versions.length)
        throw Error("主地图已经更新，请重新读取差异。");
      const choices = input.resolutions || draft.resolutions;
      data = comparison(draft, choices);
      if (action === "publish") {
        if (data.unresolved.length || data.errors.length)
          throw Error("请先解决冲突和引用错误。");
        data = publish(data.document, input.note || "本地演示上传");
        draft.status = "published";
        draft.publishedRevision = data.revision;
      }
      draft.resolutions = choices;
      persist();
    } else if (method === "POST" && action === "rollback") {
      if (input.expectedRevision !== state.versions.length)
        throw Error("主地图已经更新，请刷新。");
      const version = state.versions.find((v) => v.revision === input.revision);
      if (!version) throw Error("版本不存在");
      data = publish(version.document, "恢复版本 " + input.revision);
    } else throw Error("未知地图操作");
    return { code: 200, message: "success", data: structuredClone(data) };
  };
}
