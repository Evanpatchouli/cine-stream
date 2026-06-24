import type { SessionData } from 'express-session';

export type SessionState = Record<string, any> & SessionData;