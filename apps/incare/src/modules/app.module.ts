import * as path from 'node:path'
import { MyLibraryModule } from '@app/my-library'
import {
  AppConfig,
  appConfig,
  authConfig,
  DatabaseConfig,
  databaseConfig,
  paymentConfig,
  pushConfig,
  RedisConfig,
  redisConfig,
  SmsConfig,
  smsConfig,
  storageConfig,
  systemConfig,
  thirdConfig,
  validationSchema,
} from '@incare/config/index'
import { RedisModule } from '@liaoliaots/nestjs-redis'
import { BullModule } from '@nestjs/bull'
import {
  Logger,
  LoggerService,
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common'
import { ConfigModule, ConfigType } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { MongooseModule } from '@nestjs/mongoose'
import mongoose from 'mongoose'
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston'
import { ClsMiddleware, ClsModule } from 'nestjs-cls'
import { CoreController } from './@core/core.controller'
import { CoreModule } from './@core/core.module'
import { AliCloudSmsModule } from './alicloud_sms/alicloud_sms.module'
import { AuthController } from './auth/auth.controller'
import { AuthModule } from './auth/auth.module'
import { CommentController } from './comment/comment.controller'
import { CommentModule } from './comment/comment.module'
import { ConfigurationController } from './configuration/configuration.controller'
import { ConfigurationModule } from './configuration/configuration.module'
import { DiagnosisController } from './diagnosis/diagnosis.controller'
import { DiagnosisModule } from './diagnosis/diagnosis.module'
import { DoctorAuthModule } from './doctor_auth/doctor_auth.module'
import { DoctorDiagnosisController } from './doctor_diagnosis/doctor_diagnosis.controller'
import { DoctorDiagnosisModule } from './doctor_diagnosis/doctor_diagnosis.module'
import { DoctorUserModule } from './doctor_users/doctor_user.module'
import { EcgAnalysisResultModule } from './ecg_analysis_result/ecg_analysis_result.module'
import { EvalController } from './evaluation/evaluation.controller'
import { EvaluationsModule } from './evaluation/evaluation.module'
import { FileController } from './files/file.controller'
import { FileModule } from './files/file.module'
import { GuardsModule } from './guards/guards.module'
import { JwtAuthGuard } from './guards/jwt.auth.guard'
import { IdentityProfileModule } from './identity_profile/identity_profile.module'
import { ReportPdfModule } from './integrations/report_pdf/report_pdf.module'
import { LoginInfoController } from './login_info/login_info.controller'
import { MembershipModule } from './membership/membership.module'
import { ModelDetailsController } from './model_details/model_details.controller'
import { ModelDetailsModule } from './model_details/model_details.module'
import { ModelsInfoController } from './models_Info/models_Info.controller'
import { ModelsInfoModule } from './models_Info/models_Info.module'
import { NotificationController } from './notification/notification.controller'
import { NotificationModule } from './notification/notification.module'
import { PaymentModule } from './payment/payment.module'
import { WechatPayModule } from './payment/wechat/wechat.module'
import { PaymentNotifyController } from './payment_processor/controller/payment_notify.controller'

import { PaymentProcessorController } from './payment_processor/controller/payment_processor.controller'
import { PaymentProcessorModule } from './payment_processor/payment_processor.module'
import { PostController } from './posts/post.controller'
import { PostModule } from './posts/post.module'
import { PushModule } from './push/push.module'
import { LoggerMiddleware } from './shared/middlewares/logger.middleware'
import { ThirdPartyController } from './third_parties/third_party.controller'
import { ThirdPartyModule } from './third_parties/third_party.module'
import { ThirdPartyUserMappingModule } from './third_party_user_mappings/third_party_user_mapping.module'
import { UserController } from './users/user.controller'
import { UserModule } from './users/user.module'

@Module({
  imports: [
    CoreModule,
    UserModule,
    DoctorUserModule,
    AuthModule,
    DoctorAuthModule,
    DiagnosisModule,
    EvaluationsModule,
    ModelsInfoModule,
    ModelDetailsModule,
    CommentModule,
    ConfigurationModule,
    FileModule,
    PostModule,
    MyLibraryModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, authConfig, databaseConfig, paymentConfig, pushConfig, redisConfig, smsConfig, storageConfig, systemConfig, thirdConfig],
      validationSchema,
      envFilePath: [path.resolve(process.cwd(), `apps/incare/env/.env_dev`)], // 只有开发环境存在
      ignoreEnvFile: process.env.NODE_ENV === 'production', // 生产环境忽略 .env 文件
    }),
    BullModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (redis: RedisConfig) => {
        return {
          redis: {
            host: redis.host,
            port: redis.port,
            password: redis.password,
          },
        }
      },

    }),
    RedisModule.forRootAsync({
      inject: [redisConfig.KEY],
      useFactory: (redis: RedisConfig) => {
        return {
          config: [
            {
              host: redis.host,
              port: redis.port,
              password: redis.password,
            },
            {
              namespace: 'worker',
              host: redis.host,
              port: redis.port,
              password: redis.password,
            },
          ],
        }
      },
    }),
    AliCloudSmsModule.forRootAsync({
      inject: [smsConfig.KEY],
      useFactory: (config: SmsConfig) => ({
        config: {
          accessKeyId: config.aliyun.accessKeyId,
          accessKeySecret: config.aliyun.accessKeySecret,
        },
        defaults: {
          templateCode: config.aliyun.templateCode,
          signName: config.aliyun.signName,
          regionId: config.aliyun.regionId,
        },
      }),
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: false },
    }),
    MongooseModule.forRootAsync({
      connectionName: 'sharedConnection', // 設定連接名稱
      inject: [databaseConfig.KEY, appConfig.KEY],
      useFactory: async (database: DatabaseConfig, app: AppConfig) => {
        if (app.nodeEnv === 'development') {
          const sensitiveFields = new Set(['api_key', 'password', 'token'])
          const sanitize = (value: any, seen = new WeakSet()): any => {
            if (!value || typeof value !== 'object')
              return value

            if (seen.has(value)) {
              return '[Circular]'
            }
            seen.add(value)

            if (value?.constructor?.name === 'ClientSession') {
              return '[ClientSession]'
            }

            if (Array.isArray(value)) {
              return value.map(v => sanitize(v, seen))
            }

            return Object.entries(value).reduce((acc, [key, val]) => {
              acc[key] = sensitiveFields.has(key)
                ? '[REDACTED]'
                : sanitize(val, seen)
              return acc
            }, {} as Record<string, any>)
          }
          const logger = new Logger('MongoDB')
          mongoose.set('debug', (collection, method, ...args) => {
            const sanitizedArgs = args.map(a => sanitize(a))
            logger.debug(
              `[Mongo] ${collection}.${method} ${JSON.stringify(sanitizedArgs)}`,
            )
          })
        }
        return {
          uri: database.mongo.uri,
          dbName: database.mongo.name,
          socketTimeoutMS: 30000, // 合適的超時時間
          serverSelectionTimeoutMS: 30000, // 設置伺服器選擇超時
          maxPoolSize: 10, // 連接池大小配置
          minPoolSize: 5, // 連接池最小大小配置
          autoIndex: false, // 自動索引
        }
      },
    }),
    NotificationModule,
    ThirdPartyModule,
    ThirdPartyUserMappingModule,
    GuardsModule,
    PushModule,
    WechatPayModule,
    PaymentModule,
    PaymentProcessorModule,
    DoctorDiagnosisModule,
    MembershipModule,
    IdentityProfileModule,
    ReportPdfModule,
    EcgAnalysisResultModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard, // 全域 JWT 守衛
    },
  ],
  exports: [],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ClsMiddleware, LoggerMiddleware)
      .exclude({
        path: '/health',
        method: RequestMethod.ALL,
      })
      .forRoutes(
        CoreController,
        DiagnosisController,
        UserController,
        AuthController,
        EvalController,
        PostController,
        ConfigurationController,
        CommentController,
        EvalController,
        FileController,
        LoginInfoController,
        NotificationController,
        ModelsInfoController,
        ModelDetailsController,
        ThirdPartyController,
        PaymentProcessorController,
        PaymentNotifyController,
        DoctorDiagnosisController,
      )
  }
}
