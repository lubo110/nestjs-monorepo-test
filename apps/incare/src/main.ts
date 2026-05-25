import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BadRequestException,
  Logger,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { OptionsUrlencoded } from 'body-parser'
import { WinstonModule } from 'nest-winston'
import { AppConfig } from './config'
import winstonConfig from './config/winston.config'
import { ApplicationModule } from './modules/app.module'
import { AllExceptionsFilter } from './modules/shared/exceptionfilters/all-exceptions.filter'
// Logger instance
const logger = new Logger('Main')
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(ApplicationModule, {
    logger: WinstonModule.createLogger(winstonConfig()),
    // 微信支付签名验证需要
    rawBody: true,

  })
  app.enableCors()
  app.useBodyParser('json', {
    inflate: true,
    limit: '10000kb',
    strict: true,
    type: 'application/json',
  })
  app.useBodyParser<OptionsUrlencoded>('urlencoded', {
    extended: true,
    parameterLimit: 1000,
    type: 'application/x-www-form-urlencoded',
  })
  app.useGlobalFilters(new AllExceptionsFilter())
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory(errors: ValidationError[]) {
        const formatted = errors.map((err) => {
          return {
            field: err.property,
            message: Object.values(err.constraints).join(', '),
          }
        })
        return new BadRequestException(formatted)
      },
    }),
  )
  // app.setGlobalPrefix("broker/medical/v2");
  app.setGlobalPrefix('incare/main/v1')

  // Starts listening for shutdown hooks
  app.enableShutdownHooks()
  const configService = app.get(ConfigService)
  const appSettings = configService.get<AppConfig>('app')
  const port = appSettings.port
  await app.listen(port)
  return {
    port,
    nodeEnv: appSettings.nodeEnv,
  }
}

bootstrap().then(({ port, nodeEnv }) => {
  const version = getVersion()
  logger.log(
    `
┌───────────────────────────────────────────
│ 🚀 Application successfully started
│
│ 📦 Version : v${version}
│ 🌍 Env     : ${nodeEnv || 'development'}
│ ⚡ Node    : ${process.version}
│ 🔌 Port    : ${port}
└───────────────────────────────────────────`,
  )
})

process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled Rejection at:', promise, 'reason:', reason)
})

function getVersion() {
  const pkg = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf8'),
  )
  return pkg.version
}
