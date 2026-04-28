import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
