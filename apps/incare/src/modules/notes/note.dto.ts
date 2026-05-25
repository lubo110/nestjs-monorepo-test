import { IsString } from 'class-validator'

export class CreateNoteDTO {
  @IsString()
  readonly id: string

  @IsString()
  readonly diagnosis_id: string

  @IsString()
  readonly x1: string

  @IsString()
  readonly x2: string

  @IsString()
  readonly channel: string

  @IsString()
  readonly note: string
}
