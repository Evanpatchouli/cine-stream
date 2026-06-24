import React from "react";
import { Flex, Layout, theme, Typography } from "antd";
import { Outlet } from "react-router";
import { APP_NAME } from "@/constants";
import useLoginCheck from "@/hooks/useLoginCheck";
import dayjs from "dayjs";
import useLogout from "@/hooks/useLogout";
import UserAvatar from "@/components/UserAvatar";
import { AuthMenu } from "./components/auth-menu";

const { Header, Content, Footer, Sider } = Layout;

export default function Home() {
  useLoginCheck();
  useLogout();

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh", maxHeight: "100vh" }}>
      <Sider
        style={styles.siderStyle}
        breakpoint="lg"
        collapsedWidth="0"
        onBreakpoint={(broken) => {
          console.log("是否触发响应式布局的断点：", broken);
        }}
        onCollapse={(collapsed, type) => {
          console.log(collapsed, type);
        }}
      >
        <Flex style={styles.menuHeaderStyle} align="center">
          <img
            src="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
            alt="logo"
            style={{ width: 32 }}
          />
          <Typography.Text style={styles.menuHeaderTextStyle}>
            {APP_NAME}
          </Typography.Text>
        </Flex>
        <AuthMenu />
      </Sider>
      <Layout style={{ display: "flex", flexDirection: "column" }}>
        <Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 20,
            background: colorBgContainer,
            flexShrink: 0,
          }}
        >
          <div></div>
          <UserAvatar />
        </Header>
        <Content
          id="view-container"
          style={{
            margin: "24px 16px 0",
            padding: 24,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            overflow: "auto",
          }}
        >
          <Outlet />
        </Content>
        <Footer style={{ textAlign: "center", flexShrink: 0 }}>
          WebApp Admin Template ©{dayjs().year()} Powered by Evanpatchouli
        </Footer>
      </Layout>
    </Layout>
  );
}

const styles = {
  menuHeaderStyle: {
    padding: "10px 12px 8px 12px",
  } as React.CSSProperties,
  menuHeaderTextStyle: {
    marginInlineStart: 12,
    color: "#eee",
    fontSize: 18,
  } as React.CSSProperties,
  siderStyle: {
    // overflow: 'auto',
    // height: '100vh',
    // position: 'sticky',
    // insetInlineStart: 0,
    // top: 0,
    // scrollbarWidth: 'thin',
    // scrollbarGutter: 'stable',
  } as React.CSSProperties,
};
