import { useState } from "react";
import { Segmented } from "antd";
import AccountForm from "./forms/AccountForm";
import PhoneForm from "./forms/PhoneForm";
import EmailForm from "./forms/EmailForm";
import { MailOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";

type FormType = "account" | "phone" | "email";

export default function LoginForm() {
  const [type, setType] = useState<FormType>("account");

  return (
    <div style={{ width: "100%", maxWidth: 360 }}>
      <Segmented
        block
        size="middle"
        shape="round"
        value={type}
        onChange={(v) => setType(v as FormType)}
        style={{ marginBlock: 28 }}
        options={[
          { label: "账号密码", value: "account", icon: <UserOutlined /> },
          { label: "手机号", value: "phone", icon: <PhoneOutlined /> },
          { label: "邮箱", value: "email", icon: <MailOutlined /> },
        ]}
      />

      {type === "account" && <AccountForm />}
      {type === "phone" && <PhoneForm />}
      {type === "email" && <EmailForm />}
    </div>
  );
}
