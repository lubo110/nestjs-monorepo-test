import { HttpStatus, Injectable, Logger } from '@nestjs/common'
import { WaffleRequestStatus } from '@incare/modules/shared/enums/common.enum'
import { SystemParams } from '@incare/modules/shared/enums/system.params.enum'
import { ApiException } from '@incare/modules/shared/exceptions/api.exception'
import { ConfigurationService } from '../../configuration/configuration.service'
import { ProductInfo } from '../order.interface'

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name)

  constructor(private readonly configurationService: ConfigurationService) {}

  async getActiveProduct(productId: string): Promise<ProductInfo> {
    try {
      const configData = await this.configurationService.findOneConfiguration(SystemParams.ProductInfo)
      const productInfos = configData.value as ProductInfo[]
      const product = productInfos.find(item => item.product_id === productId && item.status === 'active')
      if (!product) {
        throw new ApiException(
          `购买的产品id错误或该产品已下架，请联系客服！`,
          WaffleRequestStatus.OBJECT_CLOSED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
      return product
    }
    catch (error) {
      if (error?.errorCode === WaffleRequestStatus.OBJECT_NOT_EXISTED) {
        throw new ApiException(
          `产品套餐数据缺失，请联系客服！`,
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
      throw error
    }
  }
}
