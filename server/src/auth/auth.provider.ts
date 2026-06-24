import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

const AuthProvider = {
  provide: APP_GUARD,
  useClass: AuthGuard,
};

export { AuthProvider };
