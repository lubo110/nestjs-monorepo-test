import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

@ValidatorConstraint({
  name: 'IsStartNumberLessThanOrEqualToEndNumber',
  async: false,
})
export class IsStartNumberLessThanOrEqualToEndNumber
implements ValidatorConstraintInterface {
  validate(end_number: any, args: ValidationArguments) {
    const object = args.object as any
    const start_number = object.start_number

    return typeof start_number === 'number' && typeof end_number === 'number'
      ? start_number <= end_number
      : true
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Start number must be less than or equal to end number'
  }
}
