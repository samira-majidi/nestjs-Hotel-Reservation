import 'express';
import { JwtPayload } from 'src/auth/types/jwt-payload.type';
import { REQUEST_USER_KEY } from 'src/auth/constants/auth-constant';

declare module 'express' {
  interface Request {
    [REQUEST_USER_KEY]?: JwtPayload;
  }
}
