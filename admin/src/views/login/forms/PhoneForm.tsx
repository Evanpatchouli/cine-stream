import { isValidPhone } from "@/utils/is.util";
import { createStyles } from "@/utils/style.util";
import { PhoneOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Form, Input, Button, Typography, Flex, message } from "antd";
import { useState } from "react";
import * as OPTAPI from "@/api/opt.api";
import * as UserAPI from "@/api/user.api";
import { useEmit } from "@/hooks/useEmitter";
import { useNavigate } from "react-router";
import { UserLoginEvent } from "@/events/user.event";

export default function PhoneForm() {
  const nav = useNavigate();
  const [loginBtnLoading, setLoginBtnLoading] = useState<boolean>(false);
  const [count, setCount] = useState(0);
  const [form] = Form.useForm();
  const phone = Form.useWatch("phone", form);
  const isPhoneValid = phone && isValidPhone(phone);

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
    const resp = await OPTAPI.getPhoneLoginOPT(form.getFieldValue("phone"));
    if (resp.isSuccess()) {
      message.success("验证码已发送");
    } else {
      message.error("验证码发送失败");
    }
  };

  const onFinish = async (values: any) => {
    setLoginBtnLoading(true);
    try {
      const resp = await UserAPI.phoneLogin({
        phone: values.phone,
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
        <Typography.Title level={2}>手机号登录</Typography.Title>
        <Typography.Text type="secondary">
          未绑定账号的手机号将自动创建账号
        </Typography.Text>
      </div>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="phone" rules={[{ required: true }]} initialValue={""}>
          <Input
            placeholder="手机号"
            prefix={<PhoneOutlined style={styles.inputIcon} />}
          />
        </Form.Item>

        <Form.Item name="code" rules={[{ required: true }]}>
          <Flex gap={8}>
            <Input
              placeholder="验证码"
              prefix={<SafetyCertificateOutlined style={styles.inputIcon} />}
            />
            <Button disabled={count > 0 || !isPhoneValid} onClick={sendCode}>
              {count ? `${count}s` : "发送验证码"}
            </Button>
          </Flex>
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
  } as React.CSSProperties,
});
