import { Injectable } from '@nestjs/common'

@Injectable()
export class MyLibraryService {
  getHello(): string {
    return 'Hello World!xxx'
  }
}
