import { Global, Module } from '@nestjs/common'
import { PushGatewayRegistry } from './gateways/push.gateway.registry'

@Global()
@Module({
  providers: [PushGatewayRegistry],
  exports: [PushGatewayRegistry],
})
export class PushRegistryModule {}
