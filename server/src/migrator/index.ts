import { MigrationManager } from './migration-manager';
import AppConfig from '../app.config';
import { logger } from '@/common/logger';
import { sleep } from '@/utils/sleep';
import { v1 } from './v1';
import { v2 } from './v2';

const MigratorConfig = AppConfig.Migrator;

export const migrate = async () => {
  if (!MigratorConfig.on) {
    return;
  }

  logger.info('🚀 开始执行数据迁移...');

  const mongoAuthOptions =
    AppConfig.DataBase.Mongo.USERNAME && AppConfig.DataBase.Mongo.PASSWORD
      ? {
          user: AppConfig.DataBase.Mongo.USERNAME,
          pass: AppConfig.DataBase.Mongo.PASSWORD,
        }
      : {};
  const manager = new MigrationManager(
    AppConfig.DataBase.Mongo.CONNECTION,
    mongoAuthOptions,
  );

  try {
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

    await manager.connect();

    // 运行迁移
    await manager.run({ force: false });

    logger.info('✅ 数据库迁移成功');
    logger.info(`⏳ 将在 ${MigratorConfig.waitAfter / 1000} 秒后启动服务器...`);
    await sleep(MigratorConfig.waitAfter);
  } catch (error) {
    logger.error('❌ 数据库迁移失败:', error);
    throw error;
  } finally {
    await manager.disconnect();
  }
};
