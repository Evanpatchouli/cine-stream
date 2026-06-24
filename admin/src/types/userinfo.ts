export default interface UserInfo {
  id: string;
  openid: string;
  phone: string;
  nickname: string;
  email: string;
  roles: string[];
  permissions: string[];
}
