import { Injectable } from '@nestjs/common';

@Injectable()
export class IncareOpenService {
  getHello(): string {
    return 'Hello World!';
  }
}
