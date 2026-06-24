import type { CSSProperties } from "react";

export const createStyles = <T extends Record<string, CSSProperties>>(styles: T): T => {
  return styles;
};
