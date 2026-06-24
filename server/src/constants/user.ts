import { toObjectId } from '@/utils/mapper';
import { ADMIN_USER_ID as ADMIN_USER_ID_STR } from '@cine-stream/common';

export const ADMIN_USER_ID = toObjectId(ADMIN_USER_ID_STR);

export const RESET_PASSWORD = '123456';