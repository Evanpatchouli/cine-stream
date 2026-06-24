# 数据迁移使用指南

## 📋 概述

本项目使用类似 Flyway 的迁移版本管理系统，确保每个迁移脚本只执行一次。

---

## 🚀 使用方法

### 方式 1: 独立运行迁移（推荐）

```bash
cd server
pnpm migrate
```

**行为**:
- ✅ 只执行未执行过的迁移
- ✅ 跳过已成功执行的迁移
- ✅ 记录执行历史到数据库

### 方式 2: 服务启动时自动迁移

在 `src/app.config.ts` 中配置：

```typescript
public static readonly Migrator = {
  on: true,        // 开启启动时迁移
  waitAfter: 1000, // 迁移后等待时间（毫秒）
};
```

然后启动服务：

```bash
pnpm start:dev
```

**行为**:
- ✅ 服务启动前自动执行迁移
- ✅ 使用已有的数据库连接
- ✅ 智能跳过已执行的迁移
- ✅ 迁移完成后等待指定时间再启动服务

### 强制重新执行（慎用）

```bash
pnpm migrate:force
```

**行为**:
- ⚠️ 重新执行所有迁移（包括已执行的）
- ⚠️ 可能导致数据重复或冲突
- ⚠️ 仅用于开发环境或数据修复

---

## 🔄 版本管理机制

### 工作原理

1. **迁移记录表** - 在数据库中创建 `migrations` 集合
2. **执行检查** - 运行前检查哪些版本已执行
3. **智能跳过** - 自动跳过已成功执行的版本
4. **失败处理** - 记录失败信息，下次可重试

### 迁移记录结构

```typescript
{
  version: "v1",                    // 版本号
  name: "初始化权限和角色数据",      // 描述
  executed_at: 1738368000,          // 执行时间戳
  execution_time: 1234,             // 耗时（毫秒）
  status: "success",                // 状态：success | failed
  error_message: null               // 错误信息（如果失败）
}
```

---

## 📁 文件结构

```
server/
├── src/
│   └── migrator/
│       ├── v1.ts                  # 迁移脚本 v1
│       ├── migration.schema.ts    # 迁移记录 Schema ✨
│       ├── migration-manager.ts   # 迁移管理器 ✨
│       └── config.ts              # 数据库配置
├── scripts/
│   └── migrate.ts                 # 迁移入口
└── package.json
    └── scripts:
        ├── "migrate": "..."       # 常规迁移
        └── "migrate:force": "..." # 强制迁移 ✨
```

---

## 📝 添加新迁移

### 步骤 1: 创建迁移脚本

创建 `src/migrator/v2.ts`:

```typescript
export async function v2() {
  // 你的迁移逻辑
  console.log('执行 v2 迁移...');
}
```

### 步骤 2: 注册迁移

在 `scripts/migrate.ts` 中注册：

```typescript
manager.register({
  version: 'v2',
  name: '你的迁移描述',
  up: v2,
});
```

### 步骤 3: 运行迁移

```bash
pnpm migrate
```

系统会自动跳过 v1，只执行 v2。

---

## 💡 使用场景

### 场景 1: 首次部署

```bash
pnpm migrate
```

执行所有迁移，初始化数据库。

### 场景 2: 增量更新

添加新迁移后：

```bash
pnpm migrate
```

只执行新增的迁移。

### 场景 3: 开发环境重置

```bash
pnpm migrate:force
```

强制重新执行所有迁移（会清空数据）。

### 场景 4: 迁移失败后重试

如果某个迁移失败，修复问题后：

```bash
pnpm migrate
```

系统会重新执行失败的迁移。

---

## ⚙️ 配置

### 数据库连接

使用环境变量或配置文件：

```bash
# 环境变量
export MONGODB_URI="mongodb://localhost:27017/cine-stream"

# 或修改 src/migrator/config.ts
export default {
  CONNECTION: 'mongodb://localhost:27017/cine-stream'
};
```

---

## ⚠️ 注意事项

1. **生产环境慎用 --force** - 可能导致数据丢失
2. **备份数据** - 运行迁移前建议备份数据库
3. **测试迁移** - 在开发环境充分测试后再部署
4. **版本号唯一** - 确保每个迁移版本号唯一
5. **幂等性** - 迁移脚本应该是幂等的（可重复执行）

---

## 🔍 故障排查

### 问题 1: 迁移被跳过

```
⏭️ 跳过 v1: 初始化权限和角色数据 (已执行)
```

**原因**: 该版本已成功执行过

**解决**:
- 如需重新执行，使用 `pnpm migrate:force`
- 或手动删除 `migrations` 集合中的记录

### 问题 2: 连接失败

```
❌ 数据库连接失败
```

**解决**:
- 检查 MongoDB 是否运行
- 检查连接字符串是否正确
- 检查网络连接

### 问题 3: 迁移失败

```
❌ v2 执行失败: ...
```

**解决**:
- 查看错误信息
- 修复迁移脚本
- 再次运行 `pnpm migrate`

---

**最后更新**: 2026-02-01

