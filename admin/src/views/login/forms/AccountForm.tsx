import { useState } from "react";
import { Form, Input, Button, Row, Col, Typography, message } from "antd";
import {
  UserOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { CaptchaWay } from "@/constants";
import Captcha from "@/components/captcha";
import * as UserAPI from "@/api/user.api";
import type { AccountLoginForm } from "@/types/user";
import { useEmit } from "@/hooks/useEmitter";
import { UserLoginEvent } from "@/events/user.event";
import { useNavigate } from "react-router";
import { useLoginStore } from "@/auth/store";

const { Title, Text } = Typography;

enum AccountMode {
  LOGIN = "login",
  REGISTER = "register",
}

export default function AccountForm() {
  const nav = useNavigate();
  const emitter = useEmit();
  const [form] = Form.useForm();
  const [accountMode, setAccountMode] = useState<AccountMode>(
    AccountMode.LOGIN,
  );
  const [loginBtnLoading, setLoginBtnLoading] = useState<boolean>(false);
  const [loginBtnDisabled, setLoginBtnDisabled] = useState<boolean>(false);
  const { isLogin } = useLoginStore();

  const accountLoginApi =
    accountMode === AccountMode.LOGIN
      ? UserAPI.accountLogin
      : UserAPI.accountRegister;

  const onFinish = async (values: AccountLoginForm) => {
    if (loginBtnDisabled) return;
    try {
      setLoginBtnLoading(true);
      setLoginBtnDisabled(true);
      const res = await accountLoginApi(values);
      if (res.isSuccess()) {
        emitter.emit("user.login", new UserLoginEvent(res.getData()!));
        message.success(
          accountMode === AccountMode.LOGIN
            ? "登录成功，即将跳转"
            : "注册成功，自动登录",
        );
        setTimeout(() => {
          nav("/");
        }, 3000);
      } else {
        message.error(res.getMessage());
        setLoginBtnDisabled(false);
      }
    } catch (error) {
      message.error("登录失败");
      setLoginBtnDisabled(false);
    } finally {
      setLoginBtnLoading(false);
    }
  };

  const switchAccountMode = () => {
    setAccountMode((pre) =>
      pre === AccountMode.LOGIN ? AccountMode.REGISTER : AccountMode.LOGIN,
    );
  };

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>
          {accountMode === AccountMode.LOGIN
            ? isLogin
              ? "切换账号"
              : "欢迎登录"
            : "账号注册"}
        </Title>
        <Text
          type="secondary"
          style={styles.registerRightNow}
          onClick={switchAccountMode}
        >
          {accountMode === AccountMode.LOGIN
            ? isLogin
              ? "再注册一个新账号？"
              : "没有账号？立即注册"
            : "已有账号，前往登录"}
        </Text>
      </div>
      <Form
        form={form}
        name="login_form"
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: "请输入账号" }]}
        >
          <Input
            prefix={<UserOutlined style={styles.inputIcon} />}
            placeholder="账号"
            allowClear
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: "请输入密码" }]}
        >
          <Input.Password
            prefix={<LockOutlined style={styles.inputIcon} />}
            placeholder="密码"
            allowClear
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Row gutter={8}>
            <Col span={16}>
              <Form.Item
                name="captcha"
                rules={[{ required: true, message: "请输入验证码" }]}
              >
                <Input
                  prefix={
                    <SafetyCertificateOutlined style={styles.inputIcon} />
                  }
                  maxLength={4}
                  placeholder="4位验证码"
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <div style={styles.captchaBox}>
                <Captcha way={accountMode === AccountMode.LOGIN ? CaptchaWay.LOGIN : CaptchaWay.REGISTER} />
              </div>
            </Col>
          </Row>
        </Form.Item>
        <Form.Item style={{ marginTop: 12 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loginBtnLoading}
            block
          >
            {accountMode === AccountMode.LOGIN ? "立即登录" : "提交注册"}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}

const styles = {
  registerRightNow: {
    textDecoration: "underline",
    color: "#1677ff80",
    cursor: "pointer",
  } as React.CSSProperties,
  captchaBox: {
    height: 40,
    backgroundColor: "#f5f5f5",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    borderRadius: 6,
    overflow: "hidden",
    border: "1px solid #d9d9d9",
  } as React.CSSProperties,
  inputIcon: {
    color: "rgba(0,0,0,0.25)",
  } as React.CSSProperties,
};
