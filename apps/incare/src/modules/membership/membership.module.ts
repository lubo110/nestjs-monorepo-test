import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MembershipController } from './membership.controller'
import { Membership, MembershipSchema } from './membership.schema'
import { MembershipService } from './membership.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Membership.name, schema: MembershipSchema },
      ],
      'sharedConnection',
    ),
  ],
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
