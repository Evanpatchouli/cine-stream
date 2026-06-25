import { Card, Space, Divider, Tag } from "antd";
import { useLoginStore } from "@/auth/store";
import { usePermissionChecker, useHasPermission, useIsSuperAdmin } from "@/auth/hooks";
import AuthWrapper from "@/components/AuthWrapper";
import AuthButton from "@/components/AuthButton";
import { PERMISSIONS, ROLES } from "@/constants/permissions";
import { useTitle } from "@evanpatchouli/react-hooks-kit";

/**
 * 权限控制使用示例页面
 */
export default function PermissionDemo() {
  useTitle("权限示例 - Cine Stream");
  const { userInfo } = useLoginStore();
  const checker = usePermissionChecker();
  const canManageCine = useHasPermission(PERMISSIONS.CINE_MANAGE);
  const isSuperAdmin = useIsSuperAdmin();

  return (
    <div style={{ padding: "24px" }}>
      <h1>权限控制系统使用示例</h1>

      {/* 当前用户信息 */}
      <Card title="当前用户信息" style={{ marginBottom: "24px" }}>
        <p>
          <strong>用户ID:</strong> {userInfo?.id || "未登录"}
        </p>
        <p>
          <strong>昵称:</strong> {userInfo?.nickname || "未设置"}
        </p>
        <p>
          <strong>角色:</strong>{" "}
          {userInfo?.roles?.map((role) => (
            <Tag color="blue" key={role}>
              {role}
            </Tag>
          )) || "无"}
        </p>
        <p>
          <strong>权限:</strong>{" "}
          {userInfo?.permissions?.map((perm) => (
            <Tag color="green" key={perm}>
              {perm}
            </Tag>
          )) || "无"}
        </p>
        <p>
          <strong>是否超级管理员:</strong>{" "}
          <Tag color={isSuperAdmin ? "red" : "default"}>{isSuperAdmin ? "是" : "否"}</Tag>
        </p>
      </Card>

      <Divider />

      {/* 示例1: 使用 Hook 方式 */}
      <Card title="示例1: 使用 Hook 方式" style={{ marginBottom: "24px" }}>
        <Space orientation="vertical" style={{ width: "100%" }}>
          <div>
            <strong>useHasPermission Hook:</strong>
            {canManageCine ? (
              <Tag color="success">有 CINE_MANAGE 权限</Tag>
            ) : (
              <Tag color="error">无 CINE_MANAGE 权限</Tag>
            )}
          </div>

          <div>
            <strong>usePermissionChecker Hook:</strong>
            {checker.hasRole(ROLES.CONTENT_ADMIN) ? (
              <Tag color="success">有 CONTENT_ADMIN 角色</Tag>
            ) : (
              <Tag color="error">无 CONTENT_ADMIN 角色</Tag>
            )}
          </div>
        </Space>
      </Card>

      <Divider />

      {/* 示例2: 使用 AuthWrapper 组件 */}
      <Card title="示例2: 使用 AuthWrapper 组件" style={{ marginBottom: "24px" }}>
        <Space orientation="vertical" style={{ width: "100%" }}>
          <div>
            <strong>有权限时显示:</strong>
            <AuthWrapper permission={PERMISSIONS.SYSTEM_USER_VIEW}>
              <Tag color="success">您有 USER_LIST 权限，可以看到这段内容</Tag>
            </AuthWrapper>
          </div>

          <div>
            <strong>无权限时显示 fallback:</strong>
            <AuthWrapper
              permission={PERMISSIONS.CINE_DELETE}
              fallback={<Tag color="warning">您没有 CINE_DELETE 权限</Tag>}
            >
              <Tag color="success">您有 CINE_DELETE 权限</Tag>
            </AuthWrapper>
          </div>
        </Space>
      </Card>

      <Divider />

      {/* 示例3: 使用 AuthButton 组件 */}
      <Card title="示例3: 使用 AuthButton 组件" style={{ marginBottom: "24px" }}>
        <Space>
          <AuthButton type="primary" permission={PERMISSIONS.CINE_CREATE} onClick={() => alert("创建影视")}>
            创建影视
          </AuthButton>

          <AuthButton
            danger
            permission={PERMISSIONS.CINE_DELETE}
            fallback={<button disabled>删除影视（无权限）</button>}
            onClick={() => alert("删除影视")}
          >
            删除影视
          </AuthButton>
        </Space>
      </Card>

      <Divider />

      {/* 示例4: 条件渲染 */}
      <Card title="示例4: 条件渲染" style={{ marginBottom: "24px" }}>
        <Space orientation="vertical" style={{ width: "100%" }}>
          {canManageCine && (
            <div>
              <Tag color="blue">使用 Hook 条件渲染: 您有影视管理权限</Tag>
            </div>
          )}

          {checker.hasPermission([PERMISSIONS.SYSTEM_USER_EDIT, PERMISSIONS.SYSTEM_USER_DISABLE]) && (
            <div>
              <Tag color="purple">您有编辑或禁用用户权限（任意一个）</Tag>
            </div>
          )}

          {isSuperAdmin && (
            <div>
              <Tag color="red">超级管理员专属内容</Tag>
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
}
