# 校园地图

地图管理位于控制台的「校园地图」。支持 .camap 校验、上传草稿、主图预览、对象冲突选择、发布、历史下载和恢复。下载后的主图带 masterId/baseRevision，万卷图再次导出时会保留基准，用于三方合并；不要把缺失对象视为删除。

演示模式使用真实 SDK 在浏览器内读写，版本持久化到当前浏览器的 localStorage。真实模式使用学校 Bearer 会话访问 Server/api/school/maps.php；必须安装 PHP SDK 和执行 003_camap.sql。没有生产部署操作。

本地依赖要求 ../CampuraOne_Camap_SDK/typescript 已完成 npm ci 与 npm run build。之后本项目执行 npm ci、npm run dev。通过 VITE_APP_MODE=live 与 VITE_API_BASE 指定已经配置的测试 API；禁止在 VITE_* 写入密钥。

演示下载链接由 VITE_CAMAP_EDITOR_DOWNLOAD_URL 指定；真实模式由服务端 CAMPURA_CAMAP_EDITOR_URL 指定。安装包应使用经过当前平台验收的产物。当前编辑器不实现 MapKit 底图或室内导航。
