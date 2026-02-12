import type { UserRole } from '@prisma/client'

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

export type PlatformJwtPayload = {
  userId: string;
  accountId: string;
  sessionId: string;
};
