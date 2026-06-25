import { useEffect, useState } from "react";
import * as RoleAPI from "@/api/role.api";
import type { AsyncReturnType, NonNull, PaginatedResult } from "@cine-stream/common";
import { Pagination, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import USpan from "@/components/unimportant/uspan";
import { ifFalsy } from "@/utils/value";
import Flex from "@/components/Flex";
import { BaseTableView } from "@/components/layouts/BaseTableView";
import { useTitle } from "@evanpatchouli/react-hooks-kit";

type Role = NonNull<AsyncReturnType<typeof RoleAPI.queryRolePage>["data"]>["list"][number];

export default function RoleView() {
  useTitle("角色管理 - Cine Stream");
  const [rolePage, setRolePage] = useState<PaginatedResult<Role>>({
    list: [] as any,
    page: 1,
    size: 10,
    total: 0,
    totalPages: 1,
  });

  const columns: ColumnsType<Role> = [
    {
      title: "角色名称",
      dataIndex: "role_name",
      fixed: "left",
      width: 120,
      render: (text) => ifFalsy(text, <USpan>-</USpan>),
    },
    {
      title: "角色编码",
      dataIndex: "role_code",
      width: 180,
      render: (text) => (text ? <Tag color="blue">{text}</Tag> : <USpan>-</USpan>),
    },
    {
      title: "角色描述",
      dataIndex: "description",
      width: 300,
      render: (text) => ifFalsy(text, <USpan>-</USpan>),
    },
    {
      title: "所有权限",
      dataIndex: "permissions",
      render: (permissions: Role["permissions"], record: Role) =>
        permissions && permissions.length > 0 ? (
          <Flex wrap="wrap" gap="small">
            {permissions.map((perm) => (
              <Tag key={record.id + perm.id}>{perm.perm_name}</Tag>
            ))}
          </Flex>
        ) : (
          <USpan>-</USpan>
        ),
    },
  ];

  useEffect(() => {
    RoleAPI.queryRolePage({
      page: 1,
      size: 10,
    }).then((resp) => {
      setRolePage(resp.getData() || rolePage);
    });
  }, []);

  const tableY = BaseTableView.useTableHeight(); // 设置表格高度
  return (
    <BaseTableView>
      <Table dataSource={rolePage.list} rowKey={"id"} columns={columns} pagination={false} scroll={{ y: tableY }} />
      <Pagination
        pageSize={rolePage.size}
        total={rolePage.total}
        current={rolePage.page}
        onChange={(page) => {
          RoleAPI.queryRolePage({
            page,
            size: rolePage.size,
          }).then((resp) => {
            setRolePage(resp.getData() || rolePage);
          });
        }}
      />
    </BaseTableView>
  );
}
