import { MigrationManager } from '../src/migrator/migration-manager';
import config from '../src/migrator/config';
import { v1 } from '../src/migrator/v1';
import { v2 } from '../src/migrator/v2';

// 解析命令行参数
const args = process.argv.slice(2);
const force = args.includes('--force') || args.includes('-f');

async function runMigration() {
  const MONGO_URI = process.env.MONGODB_URI || config.CONNECTION;
  const mongoAuthOptions =
    config.USERNAME && config.PASSWORD
      ? {
          user: config.USERNAME,
          pass: config.PASSWORD,
        }
      : {};
  const manager = new MigrationManager(MONGO_URI, mongoAuthOptions);

  try {
    // 连接数据库
    await manager.connect();

    // 注册所有迁移脚本
    manager.register({
      version: 'v1',
      name: '初始化权限和角色数据',
      up: v1,
    });

    manager.register({
      version: 'v2',
      name: '更新管理员邮箱',
      up: v2,
    });

    // 运行迁移
    await manager.run({ force });

    process.exit(0);
  } catch (error) {
    console.error('\n❌ 迁移执行失败:', error);
    process.exit(1);
  } finally {
    await manager.disconnect();
  }
}

runMigration();
