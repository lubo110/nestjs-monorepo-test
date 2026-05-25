import { DynamicModule, Module } from '@nestjs/common'
import { ALICLOUD_SMS_MODULE_OPTIONS } from './alicloud_sms.constant'
import { AliCloudSmsService } from './alicloud_sms.service'
import { AliCloudSmsOptions } from './interfaces'

@Module({})
export class AliCloudSmsModule {
  public static forRoot(options: AliCloudSmsOptions): DynamicModule {
    return {
      module: AliCloudSmsModule,
      global: true,
      providers: [
        {
          provide: ALICLOUD_SMS_MODULE_OPTIONS,
          useValue: options,
        },
        AliCloudSmsService,
      ],
      exports: [AliCloudSmsService],
    }
  }

  static forRootAsync(options: {
    imports?: any[]
    inject?: any[]
    useFactory: (...args: any[]) => AliCloudSmsOptions
  }): DynamicModule {
    return {
      module: AliCloudSmsModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: ALICLOUD_SMS_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        AliCloudSmsService,
      ],
      exports: [AliCloudSmsService],
    }
  }
}
