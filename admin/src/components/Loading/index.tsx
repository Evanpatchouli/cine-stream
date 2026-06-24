import { useEffect, useMemo } from "react";
import "./index.css";

interface LoadingProps<T> {
  on?: boolean;
  /** default is `"blue"` */
  theme?: "dark" | "gray" | "blue" | "yellow" | "green" | "purple" | "red";
  /** 16 bit color, will override theme */
  color?: T extends `#${infer U}` ? U : never;
  disableHeartBit?: boolean;
}

const LoadColor = {
  dark: "#000000",
  gray: "#666666",
  blue: "#2196f3",
  yellow: "#ffeb3b",
  green: "#3b9b3e",
  purple: "#00008f",
  red: "#f44336",
};

export default function Loading<T>({ on, theme, color, disableHeartBit }: LoadingProps<T>) {
  useEffect(() => {
    if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("color must be 16 bit color");
  }, []);
  const loadColor = useMemo(() => color || LoadColor[theme ?? "blue"], [color, theme]);
  const loadColor2 = useMemo(() => loadColor + "81", [loadColor]);
  return on ? (
    <div
      className="cine-stream-loading"
      style={{
        // @ts-ignore
        "--loading-color": `${loadColor}`,
        "--loading-color2": `${loadColor2}`,
      }}
    >
      <div style={{ animationPlayState: disableHeartBit ? "paused" : "running" }} />
      <div />
      <div />
      <div />
    </div>
  ) : null;
}
