import { RouterView } from "./router";
import { useEvent } from "./hooks/useEmitter";
import { useLoginStore } from "./auth/store";
import type UserInfo from "./types/userinfo";
import "./App.css";

function App() {
  const loginStore = useLoginStore();

  useEvent("user.login", (result) => {
    const { token, ...userInfo } = result.getPayload();
    loginStore.setToken(token);
    loginStore.setUserInfo({
      ...userInfo,
    } as UserInfo);
    loginStore.setIsLogin(true);
  });

  return <RouterView />;
}

export default App;
