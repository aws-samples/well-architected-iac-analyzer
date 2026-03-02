import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { requestGuardMiddleware } from './shared/middleware/request-guard.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase payload size limit
  app.use(bodyParser.json({limit: '100mb'}));
  app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));

  // Validate that state-changing requests originate from application clients
  app.use(requestGuardMiddleware);

  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:8080',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.useGlobalPipes(new ValidationPipe());
  
  await app.listen(3000);
}
bootstrap();