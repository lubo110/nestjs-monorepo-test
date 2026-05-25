import { SetMetadata } from '@nestjs/common'

export const SKIP_APP_GUARD = 'skipAppGuard'
export const SkipAppGuard = () => SetMetadata(SKIP_APP_GUARD, true)
