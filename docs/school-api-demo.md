# 学校 Web 本地演示与 Server 对齐

2026-10-07。以 `Server/includes/school/{management,schedules,notices,auth}.php`、`Server/docs/openapi-school.json` 和 `school-console.md` 为依据。本次没有修改 Server、上线、迁移数据库或接入网络请求。

数据仅保存在一次登录的 React Context 中，刷新、退出即清空。`src/demo/schoolDemo.js` 的业务命令使用当前接口字段、动作、版本号和 `{code,message,data}` 响应；文件内容和演示操作记录保存在独立的 UI 状态中。`advertisementViewModels` 是显示适配器，其嵌套对象不是服务端返回字段。

| UI | 现有接口/动作 | 本地演示 |
| --- | --- | --- |
| 账号 | auth/school/login、session、logout、password | 保留演示登录/退出；账号设置展示会话和改密表单，不验证、保存或修改任何真实密码 |
| 学校资料/Logo | school/profile PATCH；POST upload_logo | 名称、分段地址、Logo 的会话内修改；Logo 仅使用本地 data URL |
| 校区/学生 | school/directory、students GET | 只读目录、完整班级归属；精确学号或姓名包含查询，选择 studentID |
| 通知 | announcements POST create/revoke、PATCH update、GET history | 类型 0/1/2，Markdown/DOCX、起止时间、定时发布、结构化接收范围、编辑/撤回/历史 |
| 学期 | semesters POST/PATCH | 连续学年、日期范围、首个周一、重叠校验、版本号 |
| 常规课表 | timetables upload_base、restore_base | 完整校区/院系/班级、学期、ICS 文件、原始版本与恢复 |
| 临时课表 | timetables upload_temporary、cancel_temporary | 多选周、替换整周、空 ICS 表示无课、覆盖指针更新/撤销、历史保留 |
| 校历 | calendar upload、restore | 整份版本上传/恢复、原文件下载 |
| 临时安排 | 现有 calendar upload（没有独立临时安排接口） | 保留当前 VCALENDAR 中事件，添加 VEVENT 后生成一份完整新版本；通过版本恢复撤销 |
| 广告 | advertisements approve/reject/edit_reason/undo_rejection/withdraw/resubmit、GET history | 四种状态、撤下必填原因、版本检查、操作记录、当前待审统计同步 |
| 仪表盘 | dashboard GET | 最近七个上海自然日 approve/reject 操作数、当前状态通过率、quoteTotal；在线/曝光/点击/到账均未接入 |

## 演示与正式实现的边界

- 不发送 HTTP，不生成/存储 Token，不保存密码，不依赖任何历史凭据。正式权限、会话、CORS、冲突处理、分页和上传均需部署准备完成后再接入。
- ICS 在 demo 中只做轻量格式和单源周校验，并保留原文；没有移植 PHP 的 Sabre 递归展开/时区/EXDATE/例外编译器。下载明确标为**原文件**，不冒充服务端编译下载。课表仪表盘明确标为**文件内容预览**，不能视作服务端“下一节课”结果。
- 班级使用 compoundID/departmentID/classID；学生使用 studentID，不把学号当主键。UI 每次选择一个接收范围，服务对象仍保留结构化 selector 数组。
- 广告详情只消费当前学校端返回的商户名、投放时间、类型、报价方案/金额、提交时间、状态与原因；没有从商户名猜行业，也不依赖学校端未返回的促销文案、商户地址或真实付款状态。素材目前为标明 DEMO 的本地 CSS 占位，不加载 example.test 外部图片。
- 生产接入时必须增加服务端原文错误到中文提示的适配、分页/加载/异常/409 刷新；学校范围来自会话，不能由 UI 请求 schoolID 越权。

## 验证

`npm run build`、`npm run lint`、`node --test tests/school-demo.test.js`。

测试覆盖 DTO 字段、广告状态/撤下原因/版本冲突、通知范围和撤回、整周替换/撤销/恢复、校历新版本与恢复、学期校验、七日操作统计和未接入指标、临时 ICS 跨源周拒绝。

浏览器验收：桌面/390px 排布，广告批准→撤下→重新送审，临时课表与临时安排快捷入口，工具箱鼠标过渡区域、键盘关闭、移动选中背景。
