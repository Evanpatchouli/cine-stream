const RS = {
  // HTTP 状态码相关
  SUCCESS: { code: "SUCCESS", message: '操作成功' },
  CREATED: { code: "CREATED", message: '创建成功' },
  ACCEPTED: { code: "ACCEPTED", message: '请求已接受' },
  NO_CONTENT: { code: "NO_CONTENT", message: '无内容' },
  MOVED_PERMANENTLY: { code: "MOVED_PERMANENTLY", message: '永久重定向' },
  FOUND: { code: "FOUND", message: '临时重定向' },
  SEE_OTHER: { code: "SEE_OTHER", message: '参见其他' },
  NOT_MODIFIED: { code: "NOT_MODIFIED", message: '未修改' },
  TEMPORARY_REDIRECT: { code: "TEMPORARY_REDIRECT", message: '临时重定向' },
  PERMANENT_REDIRECT: { code: "PERMANENT_REDIRECT", message: '永久重定向' },
  
  BAD_REQUEST: { code: "BAD_REQUEST", message: '请求参数错误' },
  UNAUTHORIZED: { code: "UNAUTHORIZED", message: '未授权' },
  PAYMENT_REQUIRED: { code: "PAYMENT_REQUIRED", message: '需要付款' },
  FORBIDDEN: { code: "FORBIDDEN", message: '无访问权限' },
  NOT_FOUND: { code: "NOT_FOUND", message: '资源未找到' },
  METHOD_NOT_ALLOWED: { code: "METHOD_NOT_ALLOWED", message: '方法不允许' },
  NOT_ACCEPTABLE: { code: "NOT_ACCEPTABLE", message: '不可接受' },
  PROXY_AUTHENTICATION_REQUIRED: { code: "PROXY_AUTHENTICATION_REQUIRED", message: '需要代理认证' },
  REQUEST_TIMEOUT: { code: "REQUEST_TIMEOUT", message: '请求超时' },
  CONFLICT: { code: "CONFLICT", message: '冲突' },
  GONE: { code: "GONE", message: '资源已不存在' },
  LENGTH_REQUIRED: { code: "LENGTH_REQUIRED", message: '需要内容长度' },
  PRECONDITION_FAILED: { code: "PRECONDITION_FAILED", message: '先决条件失败' },
  PAYLOAD_TOO_LARGE: { code: "PAYLOAD_TOO_LARGE", message: '负载过大' },
  URI_TOO_LONG: { code: "URI_TOO_LONG", message: 'URI过长' },
  UNSUPPORTED_MEDIA_TYPE: { code: "UNSUPPORTED_MEDIA_TYPE", message: '不支持的媒体类型' },
  REQUESTED_RANGE_NOT_SATISFIABLE: { code: "REQUESTED_RANGE_NOT_SATISFIABLE", message: '请求范围不可满足' },
  EXPECTATION_FAILED: { code: "EXPECTATION_FAILED", message: '期望失败' },
  I_AM_A_TEAPOT: { code: "I_AM_A_TEAPOT", message: '我是一个茶壶' },
  MISDIRECTED: { code: "MISDIRECTED", message: '请求被误导' },
  UNPROCESSABLE_ENTITY: { code: "UNPROCESSABLE_ENTITY", message: '不可处理的实体' },
  LOCKED: { code: "LOCKED", message: '资源被锁定' },
  FAILED_DEPENDENCY: { code: "FAILED_DEPENDENCY", message: '依赖失败' },
  TOO_MANY_REQUESTS: { code: "TOO_MANY_REQUESTS", message: '请求过多' },
  
  NOT_IMPLEMENTED: { code: "NOT_IMPLEMENTED", message: '未实现' },
  BAD_GATEWAY: { code: "BAD_GATEWAY", message: '错误的网关' },
  SERVICE_UNAVAILABLE: { code: "SERVICE_UNAVAILABLE", message: '服务不可用' },
  GATEWAY_TIMEOUT: { code: "GATEWAY_TIMEOUT", message: '网关超时' },
  HTTP_VERSION_NOT_SUPPORTED: { code: "HTTP_VERSION_NOT_SUPPORTED", message: 'HTTP版本不支持' },
  
  CONTINUE: { code: "CONTINUE", message: '继续请求' },
  SWITCHING_PROTOCOLS: { code: "SWITCHING_PROTOCOLS", message: '切换协议' },
  PROCESSING: { code: "PROCESSING", message: '处理中' },
  NON_AUTHORITATIVE_INFORMATION: { code: "NON_AUTHORITATIVE_INFORMATION", message: '非权威信息' },
  RESET_CONTENT: { code: "RESET_CONTENT", message: '重置内容' },
  PARTIAL_CONTENT: { code: "PARTIAL_CONTENT", message: '部分内容' },
  MULTI_STATUS: { code: "MULTI_STATUS", message: '多状态' },
  ALREADY_REPORTED: { code: "ALREADY_REPORTED", message: '已报告' },
  IM_USED: { code: "IM_USED", message: 'IM 已使用' },
  AMBIGUOUS: { code: "AMBIGUOUS", message: '请求不明确' },
  CONTENT_DIFFERENT: { code: "CONTENT_DIFFERENT", message: '内容不同' },
  EARLYHINTS: { code: "EARLYHINTS", message: '早期提示' },
  PRECONDITION_REQUIRED: { code: "PRECONDITION_REQUIRED", message: '需要先决条件' },
  UNRECOVERABLE_ERROR: { code: "UNRECOVERABLE_ERROR", message: '不可恢复的错误' },
  LOOP_DETECTED: { code: "LOOP_DETECTED", message: '检测到循环' },
  INSUFFICIENT_STORAGE: { code: "INSUFFICIENT_STORAGE", message: '存储空间不足' },
  VARIANT_ALSO_NEGOTIATES: { code: "VARIANT_ALSO_NEGOTIATES", message: '变体也需要协商' },
  BANDWIDTH_LIMIT_EXCEEDED: { code: "BANDWIDTH_LIMIT_EXCEEDED", message: '超出带宽限制' },
  NOT_EXTENDED: { code: "NOT_EXTENDED", message: '未扩展' },
  NETWORK_AUTHENTICATION_REQUIRED: { code: "NETWORK_AUTHENTICATION_REQUIRED", message: '需要网络认证' },
  
  // 业务状态码
  INTERNAL_SERVER_ERROR: { code: "INTERNAL_SERVER_ERROR", message: '服务器内部错误' },
  AUTHENTICATION_FAIL: { code: "AUTHENTICATION_FAIL", message: '用户认证失败' },
  AUTHENTICATION_FAIL_TOKEN_MISSING: { code: "AUTHENTICATION_FAIL_0001", message: '认证失败，用户 token 令牌缺失' },
  AUTHENTICATION_FAIL_TOKEN_EXPIRED: { code: "AUTHENTICATION_FAIL_0002", message: '认证失败，用户 token 令牌已过期' },
  AUTHENTICATION_FAIL_TOKEN_INVALID: { code: "AUTHENTICATION_FAIL_0003", message: '认证失败，用户 token 令牌无效' },
  AUTHENTICATION_FAIL_TOKEN_NOT_BEFORE: { code: "AUTHENTICATION_FAIL_0004", message: '认证失败，用户 token 令牌未生效' },
  
  UNEXPECTED_EXCEPTION: { code: "UNEXPECTED_EXCEPTION", message: '未知错误' },
  USER_REGISTER_SUCCESS: { code: "USER_REGISTER_SUCCESS", message: '注册成功' },
  USER_REGISTER_FAIL: { code: "USER_REGISTER_FAIL", message: '注册失败' },
  USER_REGISTER_FAIL_USERNAME_EXIST: { code: "USER_REGISTER_FAIL_0001", message: '用户名已存在' },
  LOGIN_SUCCESS: { code: "LOGIN_SUCCESS", message: '登录成功' },
  LOGIN_FAIL: { code: "LOGIN_FAIL", message: '登录失败' },
  LOGIN_FAIL_USERNAME_NOT_EXIST: { code: "LOGIN_FAIL_0001", message: '用户名不存在' },
  LOGIN_FAIL_PASSWORD_NOT_MATCH: { code: "LOGIN_FAIL_0002", message: '用户名或密码错误' },
  LOGOUT_SUCCESS: { code: "LOGOUT_SUCCESS", message: '登出成功' },
  LOGOUT_FAIL: { code: "LOGOUT_FAIL", message: '登出失败' },
  USER_INFO_GET_SUCCESS: { code: "USER_INFO_GET_SUCCESS", message: '获取用户信息成功' },
  USER_INFO_GET_FAIL: { code: "USER_INFO_GET_FAIL", message: '获取用户信息失败' },
  USER_INFO_GET_FAIL_NOT_EXIST: { code: "USER_INFO_GET_FAIL_0001", message: '用户不存在' },
  USER_INFO_GET_FAIL_NOT_ALLOW: { code: "USER_INFO_GET_FAIL_0002", message: '无权限获取用户信息' },
  USER_INFO_UPDATE_SUCCESS: { code: "USER_INFO_UPDATE_SUCCESS", message: '更新用户信息成功' },
  USER_INFO_UPDATE_FAIL_NOT_EXIST: { code: "USER_INFO_UPDATE_FAIL_0001", message: '用户不存在' },
  USER_INFO_UPDATE_FAIL_NOT_CHANGE: { code: "USER_INFO_UPDATE_FAIL_0002", message: '用户信息没有变化' },
  USER_INFO_UPDATE_FAIL_NOT_ALLOW: { code: "USER_INFO_UPDATE_FAIL_0003", message: '无权限更新用户信息' },
  USER_INFO_DELETE_SUCCESS: { code: "USER_INFO_DELETE_SUCCESS", message: '删除用户信息成功' },
  USER_INFO_DELETE_FAIL_NOT_EXIST: { code: "USER_INFO_DELETE_FAIL_0001", message: '用户不存在' },
  USER_INFO_DELETE_FAIL_NOT_CHANGE: { code: "USER_INFO_DELETE_FAIL_0002", message: '用户信息删除失败' },
} as const;

export default RS;

export const BS = {
  // 认证相关
  AUTHENTICATION: {
    SUCCESS: RS.SUCCESS,
    FAIL: RS.AUTHENTICATION_FAIL,
    TOKEN_MISSING: RS.AUTHENTICATION_FAIL_TOKEN_MISSING,
    TOKEN_EXPIRED: RS.AUTHENTICATION_FAIL_TOKEN_EXPIRED,
    TOKEN_INVALID: RS.AUTHENTICATION_FAIL_TOKEN_INVALID,
    TOKEN_NOT_BEFORE: RS.AUTHENTICATION_FAIL_TOKEN_NOT_BEFORE,
  },
  
  // 用户相关
  USER: {
    // 注册
    REGISTER: {
      SUCCESS: RS.USER_REGISTER_SUCCESS,
      FAIL: RS.USER_REGISTER_FAIL,
      USERNAME_EXIST: RS.USER_REGISTER_FAIL_USERNAME_EXIST,
    },
    
    // 登录
    LOGIN: {
      SUCCESS: RS.LOGIN_SUCCESS,
      FAIL: RS.LOGIN_FAIL,
      USERNAME_NOT_EXIST: RS.LOGIN_FAIL_USERNAME_NOT_EXIST,
      PASSWORD_NOT_MATCH: RS.LOGIN_FAIL_PASSWORD_NOT_MATCH,
    },
    
    // 登出
    LOGOUT: {
      SUCCESS: RS.LOGOUT_SUCCESS,
      FAIL: RS.LOGOUT_FAIL,
    },
    
    // 用户信息
    INFO: {
      GET: {
        SUCCESS: RS.USER_INFO_GET_SUCCESS,
        FAIL: RS.USER_INFO_GET_FAIL,
        NOT_EXIST: RS.USER_INFO_GET_FAIL_NOT_EXIST,
        NOT_ALLOW: RS.USER_INFO_GET_FAIL_NOT_ALLOW,
      },
      UPDATE: {
        SUCCESS: RS.USER_INFO_UPDATE_SUCCESS,
        FAIL_NOT_EXIST: RS.USER_INFO_UPDATE_FAIL_NOT_EXIST,
        FAIL_NOT_CHANGE: RS.USER_INFO_UPDATE_FAIL_NOT_CHANGE,
        FAIL_NOT_ALLOW: RS.USER_INFO_UPDATE_FAIL_NOT_ALLOW,
      },
      DELETE: {
        SUCCESS: RS.USER_INFO_DELETE_SUCCESS,
        FAIL_NOT_EXIST: RS.USER_INFO_DELETE_FAIL_NOT_EXIST,
        FAIL_NOT_CHANGE: RS.USER_INFO_DELETE_FAIL_NOT_CHANGE,
      },
    },
  },
  
  // 系统相关
  SYSTEM: {
    EXCEPTION: RS.INTERNAL_SERVER_ERROR,
    UNEXPECTED_EXCEPTION: RS.UNEXPECTED_EXCEPTION,
    INTERNAL_SERVER_ERROR: RS.INTERNAL_SERVER_ERROR,
  },
  
  // 请求相关
  REQUEST: {
    BAD_REQUEST: RS.BAD_REQUEST,
    FORBIDDEN: RS.FORBIDDEN,
    UNAUTHORIZED: RS.UNAUTHORIZED,
  },
} as const;