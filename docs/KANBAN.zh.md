# 项目看板（中文）

## 1. 说明

1. 本文档是 [KANBAN.md](KANBAN.md) 的中文版。
2. 任务编号与英文版保持一致，便于跨语言协作。
3. 状态分区采用 In Progress、Done、Backlog 三段结构。

## 2. In Progress

| ID | 任务 | 备注 |
| :--- | :--- | :--- |
| GL-02 | Header `#page-actions` Teleport 插槽 | 框架能力已具备，等待业务用例 |
| SB-05 | 将用户数据接入真实 Auth Store（Pinia） | 可与认证状态联动 |
| IN-03 | 接入 Budgets/Categories/Dashboard 聚合 API | Categories 与 Dashboard 已接入，Budgets 受后端端点缺失阻塞 |

## 3. Done

| ID | 任务 | 交付分支 |
| :--- | :--- | :--- |
| GL-00 | 全局布局骨架（`GlobalLayout.vue` + `AppSidebar.vue`） | `layout` |
| GL-00 | Router 嵌套路由配置 | `layout` |
| GL-04 | 路由守卫（未登录跳转登录页） | `layout` |
| GL-01 | 基于 router meta 的页面副标题 | `transactions` |
| GL-03 | 通知铃铛与未读角标（`NotificationBell.vue`） | `transactions` |
| SB-01 | 侧边栏 Logo 区域（SVG 图标 + 文案） | `layout` |
| SB-02 | 侧边栏导航项（Heroicons） | `layout` |
| SB-03 | 当前导航左侧高亮边框 | `layout` |
| SB-04 | 用户菜单弹层（`UserMenuPopup.vue`）与点击外部关闭 | `layout` |
| LG-01 | 登录页表单 UI 与校验 | `layout` |
| LG-02 | Auth Pinia Store + JWT Token 存储 | `layout` |
| DT-01 | 设计 Token 文档（`docs/develop/design-tokens.md`） | `layout` |
| DB-01 | Dashboard 汇总卡片 | `dashboard` |
| DB-02 | 最近交易列表（含分类信息） | `dashboard` |
| DB-03 | 30 天收支趋势图（Catmull-Rom 曲线） | `dashboard-chart` |
| DB-05 | 分类支出环形图 | `dashboard-chart` |
| DB-06 | 预算雷达图 | `dashboard-chart` |
| TX-01 | 交易列表与分页 | `transactions` |
| TX-02 | 搜索与筛选工具栏 | `transactions` |
| AT-01 | 交易弹窗表单（`TransactionFormModal.vue`） | `transactions` |
| AT-02 | 客户端表单校验 | `transactions` |
| AT-03 | 成功/失败反馈与提交后跳转 | `transactions` |
| AC-01 | 账户列表页（`AccountsPage.vue`） | `transactions` |
| AC-02 | 账户增删改弹窗（`AccountFormModal.vue`） | `transactions` |
| BG-01 | 预算列表与进度条（`BudgetsPage.vue`） | `transactions` |
| BG-02 | 预算增删改弹窗（`BudgetFormModal.vue`） | `transactions` |
| AN-01 | 日期范围选择器（预设 + 自定义） | `transactions` |
| AN-02 | 收入对支出趋势图 | `transactions` |
| AN-03 | 分类占比饼图 | `transactions` |
| ST-01 | 个人资料设置表单 | `transactions` |
| ST-02 | 偏好设置（货币、主题、语言） | `transactions` |
| IN-01 | 已实现后端接口 API Reference 编写 | `lint` |
| IN-01A | 路由索引与认证模型章节 | `lint` |
| IN-01B | Accounts 与 Categories 契约章节 | `lint` |
| IN-01C | Transactions 与 Summary 契约章节 | `lint` |
| IN-01D | 已知缺口与下一版修订清单 | `lint` |
| IN-01E | Auth 的 logout/me/change-password 方法约束 | `lint` |
| IN-02A | 前端认证 Store 从 mock token 切换到后端 session API | `lint` |
| IN-02B | 路由守卫通过 `/api/auth/me/` 初始化登录态 | `lint` |
| IN-02 | 用真实 Auth/Accounts/Transactions API 替换前端 mock | `lint` |
| IN-02C | Accounts 页面与弹窗改为后端 API | `lint` |
| IN-02D | Transactions 页面与弹窗改为后端 API | `lint` |
| IN-02E | Reports 与 Dashboard 改为后端 API 数据源 | `lint` |
| IN-05 | 联调测试执行手册（`docs/API_INTEGRATION_TEST_PLAN.md`） | `lint` |
| IN-06 | 联调种子数据命令与测试数据表（`seed_integration_data`、`docs/API_TEST_DATA_TABLE.md`） | `lint` |
| UI-06 | Lighthouse Desktop 优化（对比度修复、robots.txt 校验修复、路由加载调优）与前后对比证据产出（`docs/lighthouse-screenshots/`） | `frontend/ui-lighthouse-optimizations` |

## 4. Backlog

### 4.1 Global Layout

| ID | 任务 | 优先级 |
| :--- | :--- | :--- |
| GL-02 | Header `#page-actions` Teleport 插槽（进行中） | P2 |

### 4.2 Sidebar

| ID | 任务 | 优先级 |
| :--- | :--- | :--- |
| SB-05 | 接入真实 Auth Store（进行中） | P2 |

### 4.3 Dashboard

| ID | 任务 | 优先级 |
| :--- | :--- | :--- |
| DB-04 | Skeleton loading 细化 | P2 |
| DB-07 | 图表交互（tooltip / 周期切换） | P2 |
| DB-08 | 限制 Dashboard 图表交易查询为最近 30 天 | P1 |

### 4.4 Backend

| ID | 任务 | 优先级 |
| :--- | :--- | :--- |
| BE-01 | Django 应用脚手架（users/transactions/categories） | P1 |
| BE-02 | REST API 端点（DRF） | P1 |
| BE-03 | JWT 认证 | P1 |
| BE-04 | Accounts CRUD 端点 | P1 |
| BE-05 | Budgets CRUD 端点 | P2 |
| BE-06 | Transactions CRUD 端点 | P1 |
| BE-07 | Categories CRUD 端点 | P1 |

### 4.5 Integration

| ID | 任务 | 优先级 |
| :--- | :--- | :--- |
| IN-03 | 接入 Budgets/Categories/Dashboard 聚合 API | P1 |
| IN-04 | 联合冒烟测试与发布加固清单 | P1 |
| IN-07 | Frontend README 同时说明 bun 与 npm 的开发命令 | P2 |

### 4.6 Frontend Polish

| ID | 任务 | 优先级 |
| :--- | :--- | :--- |
| UI-01 | 暗色主题实现 | P2 |
| UI-02 | 移动端响应式优化 | P2 |
| UI-03 | Loading 动画完善 | P2 |
| UI-04 | 错误边界组件 | P2 |
| UI-05 | User Profile 弹窗异常（无法弹出、无法更换头像） | P1 |

### 4.7 Transactions

| ID | 任务 | 优先级 |
| :--- | :--- | :--- |
| TX-03 | 点击 Transaction 行弹出编辑/删除界面 | P1 |
| TX-04 | 交易列表按最新优先排序，新增后应出现在顶部 | P1 |
| TX-05 | "Failed to save transaction" 错误链路排查并修复 | P1 |
| TX-06 | 明确并配置单页最大交易条数 | P2 |

### 4.8 Settings

| ID | 任务 | 优先级 |
| :--- | :--- | :--- |
| ST-03 | Settings 资料保存未落后端 | P1 |
| ST-04 | Settings 缺少主题/语言/字号等可切换能力 | P2 |
| ST-05 | Settings 页面 Description 文案重复 | P2 |
| ST-06 | User Profile 资料编辑入口只能保留一处（侧边栏弹窗或 Settings 二选一） | P1 |
| ST-07 | "Manage your account and preferences" 应由 Global Layout 路由副标题承载 | P2 |
| ST-08 | Preferences 生效范围不完整（主题/语言/货币未对运行时行为产生实际影响） | P1 |

### 4.9 Backend Gaps

| ID | 任务 | 优先级 |
| :--- | :--- | :--- |
| BE-05 | Budgets CRUD 后端端点未实现（GAP-01） | P1 |
| SEC-01 | 非 DEBUG 环境限制 deterministic seed 命令执行 | P1 |
| SEC-02 | Cookie 会话模式下为改密接口启用 CSRF 防护 | P1 |

### 4.10 Frontend Architecture

| ID | 任务 | 优先级 |
| :--- | :--- | :--- |
| FA-01 | 前端领域类型从 mock-data 模块迁移到独立类型模块 | P2 |
