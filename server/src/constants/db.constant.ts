const DB_PROVIDE = 'DATABASE_CONNECTION';
const DB_CONNECTION = 'mongodb://localhost/cine-stream';

export const UserConstant = {
  NAME: 'user',
  PROVIDE: 'USER_MODEL',
  INJECT: [DB_PROVIDE],
} as const;

const DbConstant = {
  PROVIDE: DB_PROVIDE,
  CONNECTION: DB_CONNECTION,
  providers: {
    User: UserConstant,
  },
} as const;

export default DbConstant;
