import { Maybe } from '@cine-stream/common';

export interface ILoginResult {
  id: string;
  nickname?: Maybe<string>;
  openid?: Maybe<string>;
  phone?: Maybe<string>;
  username?: Maybe<string>;
  email?: Maybe<string>;
  token: string;
  roles: string[];
  permissions: string[];
}

export class LoginResult implements ILoginResult {
  id: string;
  nickname?: Maybe<string>;
  openid?: Maybe<string>;
  phone?: Maybe<string>;
  username?: Maybe<string>;
  email?: Maybe<string>;
  token: string;
  roles: string[] = [];
  permissions: string[] = [];

  public static new() {
    return new LoginResult();
  }

  Id(id: string) {
    this.id = id;
    return this;
  }

  Nickname(nickname: Maybe<string>) {
    this.nickname = nickname;
    return this;
  }

  Openid(openid: Maybe<string>) {
    this.openid = openid;
    return this;
  }

  Token(token: string) {
    this.token = token;
    return this;
  }

  Phone(phone: Maybe<string>) {
    this.phone = phone || null;
    return this;
  }

  Username(username: Maybe<string>) {
    this.username = username || null;
    return this;
  }

  Email(email: Maybe<string>) {
    this.email = email || null;
    return this;
  }

  Roles(roles: string[]) {
    this.roles = roles;
    return this;
  }

  Permissions(permissions: string[]) {
    this.permissions = permissions;
    return this;
  }
}
