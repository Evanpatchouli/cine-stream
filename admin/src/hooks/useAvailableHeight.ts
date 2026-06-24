import { DomID } from "@/constants/dom";
import { useLayoutEffect, useState } from "react";

const useAvailableHeight = (calcFn?: (height: number) => number) => {
  const [height, setHeight] = useState(600);

  useLayoutEffect(() => {
    const update = () => {
      // 获取 Content 的可用高度
      const content = document.getElementById(DomID.content);
      if (content) {
        if (calcFn) {
          setHeight(calcFn(content.clientHeight));
        } else {
          setHeight(content.clientHeight);
        }
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return height;
};

export default useAvailableHeight;