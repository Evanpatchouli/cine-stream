import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import AppConfig from './app.config';
import { UserModule } from './modules/user-module';
import { EventModule } from './events/event-module';
import { RoleModule } from './modules/role-module';
import { AdminModule } from './modules/admin';
import { RequestMetaMiddleware } from './middlewares/request.meta.token.middleware';
import { GlobalAuthTokenMiddleware } from './middlewares/global_auth_token.middleware';
import { GlobalExcenptionCatchProvider } from './exception/filters';
import { AuthProvider } from './auth/auth.provider';
import { CaptchaModule } from './modules/captcha-module';
import { OPTModule } from './modules/opt-module';
import { EmailModule } from './modules/email-module';
import { LoginLogModule } from './modules/login-log-module';
import { CineModule } from './modules/cine-module';

const mongoAuthOptions =
  AppConfig.DataBase.Mongo.USERNAME && AppConfig.DataBase.Mongo.PASSWORD
    ? {
        user: AppConfig.DataBase.Mongo.USERNAME,
        pass: AppConfig.DataBase.Mongo.PASSWORD,
      }
    : {};

@Module({
  imports: [
    EventModule,
    MongooseModule.forRoot(
      AppConfig.DataBase.Mongo.CONNECTION,
      mongoAuthOptions,
    ),
    RoleModule,
    UserModule,
    AdminModule,
    CaptchaModule,
    OPTModule,
    EmailModule,
    LoginLogModule,
    CineModule,
  ],
  controllers: [AppController],
  providers: [AuthProvider, AppService, GlobalExcenptionCatchProvider],
  exports: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestMetaMiddleware, GlobalAuthTokenMiddleware)
      .forRoutes('*');
  }
}
