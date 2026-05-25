import { registerDecorator, ValidationOptions } from 'class-validator'
import * as moment from 'moment'

export function IsBirthday(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBirthday',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const date = moment(value, moment.ISO_8601, true)
          if (!date.isValid())
            return false
          const age = moment().diff(date, 'years')
          return age >= 0 && age <= 120
        },
        defaultMessage() {
          return '生日必须是合法日期且年龄在0~120岁'
        },
      },
    })
  }
}
