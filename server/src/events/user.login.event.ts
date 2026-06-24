import { LoginType } from '@/constants/login.constant';

export default class UserLoginEvent {
  constructor(
    public readonly id: any,
    public readonly last_login_ip: string,
    public readonly last_login_at: number,
    public readonly type: LoginType,
  ) {}
}
