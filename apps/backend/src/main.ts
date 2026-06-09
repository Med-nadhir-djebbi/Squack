import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getCorsOptions } from './config/cors.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
  app.enableCors(getCorsOptions());
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
