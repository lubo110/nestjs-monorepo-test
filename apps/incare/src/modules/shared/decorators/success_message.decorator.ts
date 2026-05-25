import { SetMetadata } from '@nestjs/common'

export const SUCCESS_MESSAGE_KEY = 'api_response_success_message'

export function SuccessMessage(message: string) {
  return SetMetadata(SUCCESS_MESSAGE_KEY, message)
}
