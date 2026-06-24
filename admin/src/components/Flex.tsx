import { Flex as FlexAntd, type FlexProps as FlexPropsAntd } from "antd";
import type React from "react";
import type { CSSProperties } from "react";

export type FlexProps = {
  direction?: CSSProperties["flexDirection"];
} & FlexPropsAntd;

const Flex: React.FC<FlexProps> = ({ children, direction, style, ...props }) => {
  return (
    <FlexAntd {...props} style={{
      flexDirection: direction,
      ...(style || {}),
    }}>
      {children}
    </FlexAntd>
  );
}

export default Flex;