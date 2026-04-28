import { registerAs } from '@nestjs/config';

export default registerAs('appConfig', () => ({
  enviroment: process.env.NODE_ENV || 'production',
}));
