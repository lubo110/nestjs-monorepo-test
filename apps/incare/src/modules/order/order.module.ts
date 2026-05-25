import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigurationModule } from '../configuration/configuration.module'
import { MembershipModule } from '../membership/membership.module'
import { OrderRepository } from './order.repository'
import { Order, OrderSchema } from './order.schema'
import { OrderService, ProductService } from './service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: Order.name, schema: OrderSchema },
      ],
      'sharedConnection',
    ),
    ConfigurationModule,
    MembershipModule,
  ],
  providers: [OrderService, ProductService, OrderRepository],
  exports: [OrderService],
})
export class OrderModule {}
