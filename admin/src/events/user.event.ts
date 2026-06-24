import type { Maybe } from "@cine-stream/common";
import type { BaseEvent } from "@/types/event";
import type { ILoginResult } from "@/types/user";
import { nanoid } from "nanoid";

export class UserLoginEvent implements BaseEvent {
  $event_id: string;
  $event_name: string = UserLoginEvent.name;
  id: string;
  openid?: Maybe<string>;
  phone?: Maybe<string>;
  username?: Maybe<string>;
  nickname?: Maybe<string>;
  email?: Maybe<string>;
  token: string;
  roles: string[];
  permissions: string[];

  constructor(loginResult: ILoginResult) {
    this.$event_id = nanoid(8) + nanoid(4);
    this.id = loginResult.id;
    this.openid = loginResult.openid;
    this.phone = loginResult.phone;
    this.username = loginResult.username;
    this.email = loginResult.email;
    this.nickname = loginResult.nickname;
    this.token = loginResult.token;
    this.roles = loginResult.roles;
    this.permissions = loginResult.permissions;
  }

  getPayload() {
    return {
      id: this.id,
      openid: this.openid,
      phone: this.phone,
      username: this.username,
      nickname: this.nickname,
      email: this.email,
      token: this.token,
      roles: this.roles,
      permissions: this.permissions,
    };
  }
}
