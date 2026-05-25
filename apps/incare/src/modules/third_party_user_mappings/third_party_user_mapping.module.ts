import { forwardRef, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { MongooseModule } from '@nestjs/mongoose'
import { authConfig, AuthConfig } from '@incare/config/index'
import { LoginInfoModule } from '../login_info/login_info.module'

import { ThirdPartyModule } from '../third_parties/third_party.module'
import { UserModule } from '../users/user.module'
import {
  ThirdPartyUserMapping,
  ThirdPartyUserMappingSchema,
} from './third_party_user_mapping.schema'
import { ThirdPartyUserMappingService } from './third_party_user_mapping.service'

@Module({
  imports: [
    forwardRef(() => UserModule),
    LoginInfoModule,
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
    MongooseModule.forFeature(
      [
        {
          name: ThirdPartyUserMapping.name,
          schema: ThirdPartyUserMappingSchema,
        },
      ],
      'sharedConnection',
    ),
    forwardRef(() => ThirdPartyModule),
  ],
  controllers: [],
  providers: [ThirdPartyUserMappingService],
  exports: [ThirdPartyUserMappingService],
})
export class ThirdPartyUserMappingModule {}
