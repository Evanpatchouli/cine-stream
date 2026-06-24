const JWTConstant = {
  SK: 'JWT_SECRET_KEY',
  TTL: 'TTL', // 7 day
} as const;

const JWTStatus = {
  ACTIVE: '1',
  INACTIVE: '0',
} as const;

export { JWTStatus };

export default JWTConstant;
