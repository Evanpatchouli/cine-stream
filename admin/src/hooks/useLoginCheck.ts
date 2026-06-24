import { useLoginStore } from "@/auth/store";
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { withoutTrailingSlash } from "ufo";

export default function useLoginCheck() {
  const nav = useNavigate();
  const url = useLocation();
  const loginStore = useLoginStore();

  const isPublicRoute = useMemo(() => {
    const pathname = withoutTrailingSlash(url.pathname);
    return pathname === "/login" || pathname === "/403";
  }, [url.pathname]);

  useEffect(() => {
    if (!loginStore.isLogin && !isPublicRoute) {
      nav("/login");
    }
  }, [loginStore.isLogin, isPublicRoute, nav]);

  return true;
}
