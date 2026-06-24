import { useLoginStore } from "@/auth/store";
import { useEmit } from "@/hooks/useEmitter";
import type { Nullable } from "@cine-stream/common";
import type UserInfo from "@/types/userinfo";
import { createStyles } from "@/utils/style.util";
import { Dropdown, Avatar, type MenuProps } from "antd";
import { useMemo } from "react";

const useItems = (props: {
  emitter: ReturnType<typeof useEmit>;
  userInfo?: Nullable<UserInfo>;
}) => {
  return useMemo(() => {
    const items: MenuProps["items"] = [
      {
        key: "nickname",
        label: props.userInfo?.nickname,
      },
      {
        key: "logout",
        label: "退出登录",
        onClick: () => props.emitter.emit("user.logout"),
      },
    ];
    return items;
  }, [props]);
};

export default function UserAvatar() {
  const emitter = useEmit();
  const { userInfo } = useLoginStore();
  const items = useItems({ emitter, userInfo });
  return (
    <Dropdown menu={{ items }} placement="bottomRight" arrow>
      <Avatar style={styles.avatar}>{formatName(userInfo?.nickname)}</Avatar>
    </Dropdown>
  );
}

const formatName = (name?: string) => {
  if (!name) return "U";
  if (name === "超级管理员") return "管";
  return name.slice(0, 1);
};

const styles = createStyles({
  avatar: {
    backgroundColor: "dodgerblue",
    cursor: "pointer",
  },
});
