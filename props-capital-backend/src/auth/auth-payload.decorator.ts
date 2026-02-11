import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from './types';

export const AuthPayload = createParamDecorator(
  (data?: keyof JwtPayload, ctx?: ExecutionContext) => {
    const request = ctx?.switchToHttp().getRequest();
    if (data && request && request?.user) {
      return request?.user?.[data];
    }
    return request?.user;
  },
);
