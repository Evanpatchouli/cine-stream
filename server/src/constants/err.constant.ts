const ErrConstant = {
  // 通用错误
  UNKNOWN_ERROR: '未知错误',
  INVALID_PARAM: '参数无效',
  INVALID_TOKEN: '无效的token',
  INVALID_SIGNATURE: '无效的签名',
  INVALID_TIMESTAMP: '无效的时间戳',
  INVALID_NONCE: '无效的随机数',
  INVALID_REQUEST: '无效的请求',
  TOKEN_UNFOUND_OR_EXPIRED: 'token不存在或已过期',
} as const;

export default ErrConstant;
