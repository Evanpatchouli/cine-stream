import { useLoginStore } from "@/auth/store";
import { useNavigate } from "react-router";
import { useEvent } from "./useEmitter";
import { logout } from "@/api/user.api";

export default function useLogout() {
  const nav = useNavigate();
  const loginStore = useLoginStore();

  useEvent("user.logout", () => {
    logout().then((res) => {
      console.log("logout", res);
      loginStore.logout();
      nav("/login");
    });
  });

  return true;
}
