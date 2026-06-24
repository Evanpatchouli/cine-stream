import React, { useState } from "react";
import Loading from ".";

export type DivProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
  loading?: boolean;
};

const Div: React.FC<DivProps> = ({ children, style, loading }) => {
  return (
    <div style={{ position: "relative", ...style }}>
      {children}
      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            backgroundColor: "rgba(255, 255, 255, 0.666)", // semi-transparent background
          }}
        >
          <Loading on={loading} />
        </div>
      )}
    </div>
  );
};

export default Div;
