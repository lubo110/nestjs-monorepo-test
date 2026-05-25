import { HttpException, HttpStatus } from '@nestjs/common'
import { WaffleRequestStatus } from '../enums/common.enum'

export class ApiException extends HttpException {
  private errorMessage: string
  private errorCode: WaffleRequestStatus

  constructor(
    errorMessage: string,
    errorCode: WaffleRequestStatus,
    statusCode: HttpStatus,
  ) {
    super(errorMessage, statusCode)

    this.errorMessage = errorMessage
    this.errorCode = errorCode
  }

  getErrorCode(): WaffleRequestStatus {
    return this.errorCode
  }

  getErrorMessage(): string {
    return this.errorMessage
  }
}
