import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Role, RoleSchema } from './role.schema';
import { RoleService } from './role.service';
import { PermissionModule } from '../permission-module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
    PermissionModule,
  ],
  controllers: [],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}
