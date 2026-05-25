import { SetMetadata } from '@nestjs/common'

export const IS_THIRD_PARTY_KEY = 'isThirdParty'

export const ThirdParty = () => SetMetadata(IS_THIRD_PARTY_KEY, true)
