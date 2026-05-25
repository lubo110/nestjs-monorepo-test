import { Controller } from '@nestjs/common'
import { ThirdPartyUserMappingService } from './third_party_user_mapping.service'

@Controller('third-party-user-mappings')
export class ThirdPartyUserMappingController {
  constructor(private readonly mappingService: ThirdPartyUserMappingService) {}
}
