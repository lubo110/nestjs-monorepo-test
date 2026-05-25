import { Controller, Get } from '@nestjs/common';
import { IncareOpenService } from './incare-open.service';

@Controller()
export class IncareOpenController {
  constructor(private readonly incareOpenService: IncareOpenService) {}

  @Get()
  getHello(): string {
    return this.incareOpenService.getHello();
  }
}
