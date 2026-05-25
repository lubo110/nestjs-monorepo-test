import { forwardRef, Module } from '@nestjs/common'
import { PassportModule } from '@nestjs/passport'
import { AuthModule } from '../auth/auth.module'
import { ThirdPartyModule } from '../third_parties/third_party.module'
import { ApiKeyGuard } from './api_key.auth.guard'
import { ApiKeyStrategy } from './api_key.strategy'
import { JwtAuthGuard } from './jwt.auth.guard'
import { JwtStrategy } from './jwt.strategy'
import { LocalStrategy } from './local.strategy'

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => ThirdPartyModule),
    PassportModule,
  ],
  providers: [
    LocalStrategy,
    JwtStrategy,
    ApiKeyStrategy,
    JwtAuthGuard,
    ApiKeyGuard,
  ],
  exports: [
    LocalStrategy,
    JwtStrategy,
    ApiKeyStrategy,
    JwtAuthGuard,
    ApiKeyGuard,
  ],
})
export class GuardsModule {}
