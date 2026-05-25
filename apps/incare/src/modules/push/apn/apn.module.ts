import { Module } from '@nestjs/common'
import { UserModule } from '../../users/user.module'
import { ApnGateway } from './apn.gateway'
import { ApnService } from './apn.service'

@Module({
  imports: [UserModule],
  providers: [
    ApnService,
    ApnGateway,
  ],
})
export class ApnModule {}
