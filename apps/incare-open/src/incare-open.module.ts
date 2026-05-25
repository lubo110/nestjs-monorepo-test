import { Module } from '@nestjs/common';
import { IncareOpenController } from './incare-open.controller';
import { IncareOpenService } from './incare-open.service';

@Module({
  imports: [],
  controllers: [IncareOpenController],
  providers: [IncareOpenService],
})
export class IncareOpenModule {}
