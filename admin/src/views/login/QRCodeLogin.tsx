import { QRCode, Typography } from "antd";

const { Title, Text } = Typography;

export default function QRCodeLogin() {
  return (
    <div style={styles.qrCodeWrapper}>
      <Title level={2} style={{ marginBottom: 8 }}>微信登录</Title>
      <Text type="secondary">打开微信 - 扫一扫登录</Text>
      <div style={styles.qrContainer}>
        <QRCode value="https://ant.design/" status="active" size={200} />
      </div>
      <Text type="secondary">扫描二维码安全登录</Text>
    </div>
  );
}

const styles = {
  qrCodeWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  } as React.CSSProperties,
  qrContainer: {
    padding: 16,
    background: '#fff',
    border: '1px solid #f0f0f0',
    borderRadius: 8,
    marginBlock: 20,
  } as React.CSSProperties,
};
