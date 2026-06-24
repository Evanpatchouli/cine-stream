import mongoose from 'mongoose';
import { MigrationModel } from './migration.schema';

export interface MigrationDefinition {
  version: string;
  name: string;
  up: () => Promise<void>;
}

export class MigrationManager {
  private migrations: MigrationDefinition[] = [];
  private useExistingConnection: boolean;

  constructor(private mongoUri?: string, private options: mongoose.ConnectOptions = {}) {
    this.useExistingConnection = !mongoUri;
  }

  /**
   * 注册迁移脚本
   */
  register(migration: MigrationDefinition) {
    this.migrations.push(migration);
    return this;
  }

  /**
   * 连接数据库
   */
  async connect() {
    if (this.useExistingConnection) {
      if (mongoose.connection.readyState === 2) {
        await mongoose.connection.asPromise();
      }
      if (mongoose.connection.readyState !== 1) {
        throw new Error(
          '未检测到可复用的 Mongoose 数据库连接，请传入 mongoUri 或等待连接建立后再执行迁移',
        );
      }
      console.log('✅ 使用已有的数据库连接');
      return;
    }
    await mongoose.connect(this.mongoUri!, {
      ...this.options,
    });
    console.log('✅ 数据库连接成功');
  }

  /**
   * 断开数据库连接
   */
  async disconnect() {
    if (this.useExistingConnection) {
      console.log('👋 保持数据库连接（由外部管理）');
      return;
    }
    await mongoose.disconnect();
    console.log('👋 数据库连接已关闭');
  }

  /**
   * 检查迁移是否已执行
   */
  async isExecuted(version: string): Promise<boolean> {
    const record = await MigrationModel.findOne({
      version,
      status: 'success'
    });
    return !!record;
  }

  /**
   * 记录迁移执行结果
   */
  async recordMigration(
    version: string,
    name: string,
    executionTime: number,
    status: 'success' | 'failed',
    errorMessage?: string
  ) {
    await MigrationModel.create({
      version,
      name,
      executed_at: Date.now(),
      execution_time: executionTime,
      status,
      error_message: errorMessage,
    });
  }

  /**
   * 执行单个迁移
   */
  async executeMigration(migration: MigrationDefinition, force: boolean = false) {
    const { version, name, up } = migration;

    // 检查是否已执行
    const executed = await this.isExecuted(version);
    if (executed && !force) {
      console.log(`⏭️  跳过 ${version}: ${name} (已执行)`);
      return { skipped: true };
    }

    if (executed && force) {
      console.log(`🔄 强制重新执行 ${version}: ${name}`);
    } else {
      console.log(`▶️  执行 ${version}: ${name}`);
    }

    const startTime = Date.now();
    try {
      await up();
      const executionTime = Date.now() - startTime;

      await this.recordMigration(version, name, executionTime, 'success');
      console.log(`✅ ${version} 执行成功 (耗时: ${executionTime}ms)`);

      return { success: true, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      await this.recordMigration(version, name, executionTime, 'failed', errorMessage);
      console.error(`❌ ${version} 执行失败:`, errorMessage);

      throw error;
    }
  }

  /**
   * 运行所有迁移
   */
  async run(options: { force?: boolean } = {}) {
    const { force = false } = options;

    console.log('🚀 开始执行数据迁移...\n');

    if (force) {
      console.log('⚠️  强制模式：将重新执行所有迁移\n');
    }

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const migration of this.migrations) {
      try {
        const result = await this.executeMigration(migration, force);
        if (result.skipped) {
          skipCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        failCount++;
        console.error(`\n❌ 迁移失败，停止执行`);
        throw error;
      }
    }

    console.log('\n📊 迁移统计：');
    console.log(`   - 成功: ${successCount}`);
    console.log(`   - 跳过: ${skipCount}`);
    console.log(`   - 失败: ${failCount}`);
    console.log('\n🎉 数据迁移完成！');
  }

  /**
   * 获取迁移历史
   */
  async getHistory() {
    return await MigrationModel.find().sort({ executed_at: -1 });
  }
}

