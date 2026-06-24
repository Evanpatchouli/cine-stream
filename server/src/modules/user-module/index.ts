import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { User, UserSchema } from './user.schema';
import { UserController } from './user.controller';
import { UserModel } from './user.model';
import { UserLoginService } from './user.service.login';
import { UserRoleService } from './user.service.role';
import { RoleModule } from '../role-module';
import { UserRegisterService } from './user.service.register';
import { CaptchaModule } from '../captcha-module';
import { OPTModule } from '../opt-module';
import { UserManageService } from './user.service.manage';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    RoleModule,
    CaptchaModule,
    OPTModule,
  ],
  controllers: [UserController],
  providers: [
    UserModel,
    UserLoginService,
    UserRoleService,
    UserRegisterService,
    UserService,
    UserManageService,
  ],
  exports: [UserService, UserManageService],
})
export class UserModule {}
