import { Maybe } from '@cine-stream/common';
import type { AuthTokenPayload } from '../auth/jwt';

export interface AccessInfo {
  ip: string;
  userAgent: string;
  xtimestamp: Maybe<string | number>;
  xnonce: Maybe<string | number>;
  user?: Maybe<AuthTokenPayload>;
}
