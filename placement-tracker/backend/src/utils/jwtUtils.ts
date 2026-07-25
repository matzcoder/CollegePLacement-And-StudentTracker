import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

export interface TokenPayload {
  userId: string;
  role: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export function signAccessToken(userId: string, role: string): string {
  const jti = uuidv4(); // Fix 2.8: include jti for denylist tracking
  return jwt.sign({ userId, role, jti }, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiry,
  });
}

export function signRefreshToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpiry,
  });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
