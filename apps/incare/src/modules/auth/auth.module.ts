import { forwardRef, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { authConfig, AuthConfig } from '@incare/config/index'
import { DiagnosisModule } from '../diagnosis/diagnosis.module'
import { GuardsModule } from '../guards/guards.module'
import { LoginInfoModule } from '../login_info/login_info.module'
import { UnregisterModule } from '../unregister/unregister.module'
import { UserModule } from '../users/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'

@Module({
  imports: [
    forwardRef(() => UserModule),
    forwardRef(() => DiagnosisModule),
    PassportModule,
    JwtModule.registerAsync({
      inject: [authConfig.KEY],
      useFactory: (config: AuthConfig) => {
        return {
          secret: config.jwt.secretUserV2,
          signOptions: {
            expiresIn: config.jwt.expiresIn || '90d',
          },
        }
      },
    }),
    GuardsModule,
    UnregisterModule,
    LoginInfoModule,
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
