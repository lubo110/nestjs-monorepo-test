import { NestFactory } from '@nestjs/core';
import { IncareOpenModule } from './incare-open.module';

async function bootstrap() {
  const app = await NestFactory.create(IncareOpenModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
