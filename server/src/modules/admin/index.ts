import { Module } from '@nestjs/common';
import { UserModule } from '../user-module';
import { RoleController } from './role.controller';
import { RoleModule } from '../role-module';
import { CacheController } from './cache.controller';
import { UserManageController } from './user-manage.controller';
import { CineModule } from '../cine-module';
import { AdminCineController } from './cine.controller';
import { OssModule } from '../oss-module';

@Module({
  imports: [UserModule, RoleModule, CineModule, OssModule],
  controllers: [
    RoleController,
    CacheController,
    UserManageController,
    AdminCineController,
  ],
  providers: [],
})
export class AdminModule {}
