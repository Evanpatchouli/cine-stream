import { Menu, type MenuProps } from "antd";
import { useNavigate, useLocation } from "react-router";
import { useMemo } from "react";
import React from "react";
import { DashboardOutlined, UserOutlined, VideoCameraOutlined } from "@ant-design/icons";

export const AuthMenu: React.FC = () => {
  const nav = useNavigate();
  const location = useLocation();
  const createItems = (): MenuProps["items"] => {
    return [
      {
        key: "/dashboard",
        icon: React.createElement(DashboardOutlined),
        label: "仪表盘",
      },
      {
        key: "/system",
        icon: React.createElement(DashboardOutlined),
        label: "系统管理",
        children: [
          {
            key: "/system/user",
            icon: React.createElement(UserOutlined),
            label: "用户管理",
          },
        ],
      },
      {
        key: "/cine",
        icon: React.createElement(VideoCameraOutlined),
        label: "影视管理",
      },
    ] as MenuProps["items"];
  };

  const items = useMemo(
    () =>
      createItems(),
    [],
  );

  const handleClick = ({ key }: { key: string }) => {
    nav(key);
  };

  const openKeys = useMemo(() => {
    const pathSegments = location.pathname.split("/").filter(Boolean);
    if (pathSegments.length > 1) {
      return ["/" + pathSegments[0]];
    }
    return [];
  }, []);

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[location.pathname]}
      defaultOpenKeys={openKeys}
      items={items}
      onClick={handleClick}
    />
  );
};
