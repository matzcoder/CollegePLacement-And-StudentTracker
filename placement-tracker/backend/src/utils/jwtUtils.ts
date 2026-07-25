import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { v4 as uuidv4 } from 'uuid';

export interface JwtPayload {
  userId: string;
  role: string;
  jti?: string;
  exp?: number;
}

export function signAccessToken(userId: string, role: string): string {
  const jti = uuidv4(); // include jti for denylist tracking
  return jwt.sign({ userId, role, jti }, config.jwtSecret, {
    expiresIn: config.jwtAccessExpiry as jwt.SignOptions['expiresIn'],
  });
}

export function signRefreshToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, config.jwtSecret, {
    expiresIn: config.jwtRefreshExpiry as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}
