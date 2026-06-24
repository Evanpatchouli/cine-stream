# 经验记录

- 本项目使用 pnpm workspace，根脚本需要通过 `pnpm --filter @cine-stream/*` 调用各包脚本。
- 客户端使用 `HashRouter`，浏览器验证时应访问 `/#/login`、`/#/hall`、`/#/collection`、`/#/play/:id`。
- Playwright 的 iPhone 设备预设会默认需要 WebKit；当前验证使用 Chromium + `390,844` 视口。
- Stitch 远程图片容易在自动化截图中显示为空白或灰块，交付页面应优先使用本地静态素材。
- PowerShell 生成文本文件时要避免 BOM；本次手写文本通过 `apply_patch` 修改。
