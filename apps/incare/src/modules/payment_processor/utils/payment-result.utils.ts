import * as moment from 'moment'
import { ValidStatus } from '../enum/valid-status.enum'

export function getStatus(endTime?: Date): ValidStatus {
  try {
    if (!endTime) {
      return ValidStatus.EXPIRED
    }

    const endMoment = moment(endTime)
    if (!endMoment.isValid()) {
      return ValidStatus.EXPIRED
    }

    const nowMoment = moment()
    return nowMoment.isBefore(endMoment) || nowMoment.isSame(endMoment)
      ? ValidStatus.ACTIVE
      : ValidStatus.EXPIRED
  }
  catch {
    return ValidStatus.EXPIRED
  }
}
