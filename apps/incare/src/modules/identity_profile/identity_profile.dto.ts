import { Transform } from 'class-transformer'
import { IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { IsBirthday } from '@incare/modules/shared/decorators/is_birthday.decorator'

export class CreateIdentityProfileDTO {
  @IsNotEmpty({ message: '姓名不能为空' })
  @IsString()
  real_name: string

  @IsEnum(['male', 'female'], { message: '性别必须为男或女' })
  @Transform(({ value }) => {
    if (value === 0 || value === '0')
      return 'male'
    if (value === 1 || value === '1')
      return 'female'
    return value
  })
  gender: 'male' | 'female'

  @IsNotEmpty({ message: '出生日期不能为空' })
  @IsBirthday()
  birthday: string

  @IsNotEmpty({ message: '身份证号不能为空' })
  @IsString()
  id_card: string

  @IsString()
  id_type = 'ID_CARD'
}
