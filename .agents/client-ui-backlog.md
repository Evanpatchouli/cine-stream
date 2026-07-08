# CineStream Client UI Backlog

基于当前 `client` 代码检查结果整理的待办。目标是把“纯展示/假入口/未接后端”的 UI，按优先级逐步补成真实可用功能。

## 结论

- 已接后端的核心链路：登录、影视列表、收藏、观看历史、个人概览、播放页详情与进度记录。
- 当前主要缺口集中在：搜索、筛选、设置类入口、辅助操作按钮、历史列表更多操作。

## 优先级定义

- `P0`：核心主链路，影响基本可用性或用户明确会误以为可用的功能。
- `P1`：高频辅助能力，补齐后明显改善体验，但不阻塞主流程。
- `P2`：低频入口或纯装饰性控件，可放在最后。

## 待办清单

### P0

1. 补齐影厅搜索能力
   - 现状：`HallPage` 顶部搜索框只有输入框外观，没有搜索提交、筛选或接口调用。
   - 目标：支持按关键字搜索影视，至少先做前端本地过滤，最好接后端搜索接口。
   - 关联文件：
     - [client/src/pages/HallPage.tsx](\client\src\pages\HallPage.tsx)
     - [client/src/stores/cines.ts](\client\src\stores\cines.ts)
     - [client/src/api/cine.api.ts](\client\src\api\cine.api.ts)

2. 处理登录页的失败态与辅助操作
   - 现状：登录接口本身可用，但“显示/隐藏密码”“记住我”“忘记密码”都是假入口或未完成。
   - 目标：至少让密码显示切换真正生效；“记住我”要么接持久化逻辑，要么明确移除；“忘记密码”要么跳转要么禁用并说明。
   - 关联文件：
     - [client/src/pages/LoginPage.tsx](\client\src\pages\LoginPage.tsx)
     - [client/src/stores/auth.ts](\client\src\stores\auth.ts)

3. 处理个人空间页的假设置入口
   - 现状：“个人资料 / 订阅与账单 / 播放偏好 / 头像编辑”都只是按钮样式，没有实际行为。
   - 目标：至少给出明确跳转、弹窗或禁用态，避免误导用户；如后端暂未支持，则先做占位页或提示。
   - 关联文件：
     - [client/src/pages/SpacePage.tsx](\client\src\pages\SpacePage.tsx)
     - [client/src/components/AppShell.tsx](\client\src\components\AppShell.tsx)

### P1

4. 补齐收藏页筛选入口
   - 状态：已完成。`GET /api/watch/collections` 已支持统一分页返回，并接入 `genre/status` 后端筛选；客户端分类 Chip 和状态菜单会触发真实查询。
   - 现状：收藏页右上角筛选按钮和分类 Chip 都是静态 UI。
   - 目标：至少支持按分类/状态筛选本地收藏列表；如果后端支持分页或条件查询，再接入后端参数。
   - 关联文件：
     - [client/src/pages/CollectionPage.tsx](\client\src\pages\CollectionPage.tsx)
     - [client/src/stores/collections.ts](\client\src\stores\collections.ts)

5. 补齐观看历史的更多操作
   - 状态：已完成。`GET /api/watch/history` 已升级为统一分页返回，历史页“加载更多”会加载下一页；三点菜单已接入 `DELETE /api/watch/history/:historyId` 删除当前用户记录。
   - 现状：历史页每条记录右侧三点菜单没有行为，“加载更多”按钮也被禁用。
   - 目标：明确菜单能力边界，至少实现删除记录或跳转详情；“加载更多”要么接分页，要么移除。
   - 关联文件：
     - [client/src/pages/HistoryPage.tsx](\client\src\pages\HistoryPage.tsx)
     - [client/src/api/watch.api.ts](\client\src\api\watch.api.ts)

6. 补齐 AppShell 中的设置入口
   - 状态：已完成。侧边栏“设置”已跳转 `/settings`，并已有 `/settings/:section` 页面承接。
   - 现状：侧边栏“设置”项没有跳转或处理逻辑。
   - 目标：跳转到真实设置页，或先隐藏/禁用该入口，避免误导。
   - 关联文件：
     - [client/src/components/AppShell.tsx](\client\src\components\AppShell.tsx)
     - [client/src/App.tsx](\client\src\App.tsx)

### P2

7. 补齐播放器页的非核心 UI 行为
   - 状态：已完成。剧季入口已改为不可点击说明态，显示当前季与“暂无多季切换”；当前剧集没有视频资源时，播放器和“影院视图”入口都会给出明确提示，不再展示可播放假按钮。
   - 现状：播放器页里部分控件是本地状态或纯 UI，虽然不算假，但还有明显未完成的地方。
   - 建议优先级：
     - 剧季下拉先明确不可用态或补多季数据源。
     - 播放页悬浮/遮罩类按钮的行为收敛，避免误导。
   - 关联文件：
     - [client/src/pages/PlaybackPage.tsx](\client\src\pages\PlaybackPage.tsx)

8. 统一处理所有“空壳按钮”的交互语义
   - 状态：已完成。`GET /api/cines` 已支持 `genre` 后端筛选，影厅页分类 Chip 会触发真实查询；隐藏的无行为固定播放按钮已移除；AppShell 顶部搜索图标会跳转影厅并聚焦搜索框；其余收藏、历史、个人空间与设置入口均已有真实行为、禁用态或提示。
   - 现状：项目里存在若干仅有图标没有行为的按钮，用户点击后没有反馈。
   - 目标：要么接功能，要么明确 disabled/tooltip/说明，避免“看起来能点、实际上没作用”。
   - 关联文件：
     - [client/src/pages/HallPage.tsx](\client\src\pages\HallPage.tsx)
     - [client/src/pages/CollectionPage.tsx](\client\src\pages\CollectionPage.tsx)
     - [client/src/pages/HistoryPage.tsx](\client\src\pages\HistoryPage.tsx)
     - [client/src/pages/SpacePage.tsx](\client\src\pages\SpacePage.tsx)
     - [client/src/components/AppShell.tsx](\client\src\components\AppShell.tsx)

## 建议执行顺序

1. 先做 `P0-1` 到 `P0-3`，把最容易误导用户的入口清掉。
2. 再做 `P1-4` 到 `P1-6`，补齐高频辅助操作。
3. 最后处理 `P2-7` 到 `P2-8`，统一收口所有残留空壳按钮。

## 验收标准

- 页面上不再出现“看起来可用、实际无行为”的主要入口。
- 至少所有显著按钮都有明确行为、禁用态或说明。
- 核心链路不回归：登录、列表、收藏、历史、播放、续播仍可正常工作。
