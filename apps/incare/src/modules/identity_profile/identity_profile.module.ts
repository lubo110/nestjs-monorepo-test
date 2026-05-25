import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { IdentityProfileController } from './identity_profile.controller'
import { IdentityProfile, IdentityProfileSchema } from './identity_profile.schema'
import { IdentityProfileService } from './identity_profile.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: IdentityProfile.name, schema: IdentityProfileSchema },
      ],
      'sharedConnection',
    ),
  ],
  providers: [IdentityProfileService],
  exports: [IdentityProfileService],
  controllers: [IdentityProfileController],
})
export class IdentityProfileModule {}
