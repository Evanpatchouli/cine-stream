import type React from "react";
import Flex from "../Flex";
import useAvailableHeight from "@/hooks/useAvailableHeight";

export type BaseTableViewProps = {
  children: React.ReactNode[] & { length: 2 };
};

type IBaseTableView = React.FC<BaseTableViewProps> & { useTableHeight: () => number };

export const BaseTableView: IBaseTableView = ({ children }) => {
  return (
    <Flex flex={1} direction="column" justify="space-between">
      {children[0]}
      <Flex justify="right" style={{ marginTop: 20 }}>
        {children[1]}
      </Flex>
    </Flex>
  )
}

BaseTableView.useTableHeight = () => {
  const tableY = useAvailableHeight((h) => {
    return h - 156;
  });
  return tableY;
}