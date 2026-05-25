import { registerDecorator, ValidationOptions } from 'class-validator'

/**
 * 自定义身份证验证器
 */
export function IsIdCard(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isIdCard',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string')
            return false
          value = value.toUpperCase()
          if (!/^\d{17}[\dX]$/.test(value))
            return false

          // 校验位
          const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
          const checkMap = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
          const sum = value
            .substring(0, 17)
            .split('')
            .reduce((acc, curr, idx) => acc + Number(curr) * weights[idx], 0)
          const check = checkMap[sum % 11]
          return check === value[17]
        },
        defaultMessage() {
          return '身份证号不合法!'
        },
      },
    })
  }
}
