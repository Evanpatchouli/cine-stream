import { useState } from "react";
import { Card, Row, Col, Typography } from "antd";
import { QrcodeOutlined, DesktopOutlined } from "@ant-design/icons";
import LoginForm from "./LoginForm";
import QRCodeLogin from "./QRCodeLogin";
import { APP_NAME, SYSTEM_NAME } from "@/constants";
import { createStyles } from "@/utils/style.util";
import { useTitle } from "@evanpatchouli/react-hooks-kit";

const { Title, Text } = Typography;

enum LoginMode {
  FORM = "form",
  QRCODE = "qrcode",
}

export default function LoginView() {
  useTitle("登录 - WebApp");
  const [mode, setMode] = useState<LoginMode>(LoginMode.FORM);

  return (
    <div style={styles.container}>
      <Card
        style={styles.actionCard}
        styles={{ body: styles.actionCardBody }}
        variant="borderless"
      >
        {/* 右上角折角切换按钮 */}
        <div
          style={styles.corner}
          onClick={() =>
            setMode(mode === LoginMode.FORM ? LoginMode.QRCODE : LoginMode.FORM)
          }
          title={mode === LoginMode.FORM ? "切换扫码登录" : "切换账号登录"}
        >
          <div style={styles.ribbon} />
          <div style={styles.icon}>
            {mode === LoginMode.FORM ? <QrcodeOutlined /> : <DesktopOutlined />}
          </div>
        </div>

        <Row style={{ flex: 1 }}>
          {/* 左侧区域，系统名称LOGO等 */}
          <Col span={7} style={styles.leftSide}>
            <div>
              <Title level={3} style={{ color: "#fff", margin: 0 }}>
                {APP_NAME}
              </Title>
              <Text style={{ color: "rgba(255,255,255,0.8)" }}>
                {SYSTEM_NAME}
              </Text>
            </div>
          </Col>

          {/* 右侧区域，放置登录表单等 */}
          <Col span={17} style={styles.rightSide}>
            {mode === LoginMode.FORM ? <LoginForm /> : <QRCodeLogin />}
          </Col>
        </Row>
      </Card>
    </div>
  );
}

const styles = createStyles({
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  actionCardBody: {
    display: "flex",
    padding: 0,
  },
  actionCard: {
    width: 680,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    borderRadius: 12,
  },
  leftSide: {
    paddingBlock: "20px",
    background:
      // "#1677ff", // 单色
      // "linear-gradient(180deg, #4096ff 0%, #0958d9 100%)", // 从下到上渐变
      // "linear-gradient(180deg, #0958d9 0%, #4096ff 100%)", // 从上到下渐变
      "linear-gradient(90deg, #0958d9 0%, #4096ff 100%)", // 从左到右渐变
    // "linear-gradient(-90deg, #0958d9 0%, #4096ff 100%)", // 从右到左渐变
    // "linear-gradient(-45deg, #0958d9 0%, #4096ff 75%, #69b1ff 100%)", // 从右下到左上渐变
    // "linear-gradient(135deg, #0958d9 0%, #4096ff 75%, #69b1ff 100%)", // 从左上到右下渐变
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    color: "#fff",
  },
  rightSide: {
    paddingBlock: "20px",
    backgroundColor: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "0 50px",
    height: 480,
  },

  corner: {
    position: "absolute",
    right: 0,
    top: 0,
    width: 60,
    height: 60,
    cursor: "pointer",
    zIndex: 10,
  },
  ribbon: {
    width: 0,
    height: 0,
    borderStyle: "solid",
    borderWidth: "0 68px 68px 0",
    borderColor: "transparent #1677ffac transparent transparent",
  },
  icon: {
    position: "absolute",
    top: 6,
    right: 14,
    color: "#fff",
    fontSize: 32,
  },
});
