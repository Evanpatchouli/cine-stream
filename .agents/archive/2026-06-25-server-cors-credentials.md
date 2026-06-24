# 归档任务：修复 server CORS credentials 白名单

## 目标

修复前端携带 credentials 请求时，后端 CORS 返回通配符 `*` 导致浏览器拦截的问题。仅修改 server，保留前端请求封装不变。

## 完成情况

- [x] 定位当前 server CORS 与 env 配置。
- [x] 实现 `CORS_ORIGIN` 白名单解析并改 `enableCors`。
- [x] 同步 env 示例和文档。
- [x] server 构建与 BOM 检查。
