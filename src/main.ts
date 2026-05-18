import 'reflect-metadata';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  //*
  //swagger configuration
  //*
  const config = new DocumentBuilder()
    .setDescription('Welcome this is my first ApI ducumentation')
    .setTitle('Nest.JS /blog API')
    .setVersion('1.0')
    .setTermsOfService('terms of service')
    //.setLicense(MIT)
    .build();

  /////////
  //instation Ducument
  const ducument = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, ducument);

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  await app.listen(process.env.PORT ?? 8080);
}
void bootstrap();
