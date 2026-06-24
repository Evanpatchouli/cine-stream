import { createStyles } from "@/utils/style.util";
import { MailOutlined } from "@ant-design/icons";
import { Form, Input, Button, Typography, Flex, message, Tooltip } from "antd";
import { useState } from "react";
import * as OPTAPI from "@/api/opt.api";
import * as UserAPI from "@/api/user.api";
import { isValidEmail } from "@/utils/is.util";
import { useNavigate } from "react-router";
import { useEmit } from "@/hooks/useEmitter";
import { UserLoginEvent } from "@/events/user.event";

export default function EmailForm() {
  const nav = useNavigate();
  const [loginBtnLoading, setLoginBtnLoading] = useState<boolean>(false);
  const [count, setCount] = useState(0);
  const [form] = Form.useForm();
  const email = Form.useWatch("email", form);
  const isEmailValid = email && isValidEmail(email);

  const emitter = useEmit();

  const sendCode = async () => {
    setCount(60);
    const timer = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    const resp = await OPTAPI.getEmailLoginOPT(form.getFieldValue("email"));
    if (resp.isSuccess()) {
      message.success("验证码已发送");
    } else {
      message.error("验证码发送失败");
    }
  };

  const onFinish = async (values: any) => {
    setLoginBtnLoading(true);
    try {
      const resp = await UserAPI.emailLogin({
        email: values.email,
        code: values.code,
      });
      if (resp.isSuccess()) {
        emitter.emit("user.login", new UserLoginEvent(resp.getData()!));
        message.success("登录成功，即将跳转");
        setTimeout(() => {
          nav("/");
        }, 3000);
      } else {
        message.error("登录失败");
      }
    } catch (error) {
      console.error(error);
      message.error("登录失败");
    }
    setLoginBtnLoading(false);
  };

  return (
    <>
      <div style={{ marginBottom: 32 }}>
        <Typography.Title level={2}>邮箱登录</Typography.Title>
        <Typography.Text type="secondary">
          未绑定账号的邮箱将自动创建账号
        </Typography.Text>
      </div>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="email"
          rules={[{ type: "email", required: true, message: "请输入邮箱" }]}
          initialValue={""}
        >
          <Flex gap={8}>
            <Input
              prefix={<MailOutlined style={styles.inputIcon} />}
              placeholder="邮箱地址"
              allowClear
            />
            <Tooltip title={isEmailValid ? "" : "请输入正确的邮箱地址"}>
              <Button disabled={count > 0 || !isEmailValid} onClick={sendCode}>
                {count ? `${count}s` : "发送验证码"}
              </Button>
            </Tooltip>
          </Flex>
        </Form.Item>

        <Form.Item name="code" rules={[{ required: true }]}>
          <Input.OTP
            styles={{
              root: styles.optRoot,
            }}
            length={6}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loginBtnLoading}
            block
          >
            立即登录
          </Button>
        </Form.Item>
      </Form>
    </>
  );
}

const styles = createStyles({
  inputIcon: {
    color: "rgba(0,0,0,0.25)",
  },
  optRoot: {
    width: "100%",
    justifyContent: "space-between",
  },
});
