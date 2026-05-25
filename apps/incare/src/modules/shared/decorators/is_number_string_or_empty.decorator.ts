import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator'

export function IsNumberStringOrEmpty(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNumberStringOrEmpty',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          // eslint-disable-next-line regexp/no-unused-capturing-group
          return value === '' || /^[+-]?\d+(\.\d+)?$/.test(value) // 空字串或數字型字串
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a numeric string or empty.`
        },
      },
    })
  }
}
