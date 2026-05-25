import { IsArray, IsString } from 'class-validator'

export class CreateEvaluationDTO {
  @IsString()
  diagnosis_id: string

  @IsString()
  model_name: string

  @IsString()
  evaluator: string

  @IsString()
  score: string

  @IsString()
  channel: string

  @IsString()
  x1: string

  @IsString()
  x2: string

  @IsString()
  evaluation: string

  @IsArray()
  evaluator_sequence: Array<number>

  @IsArray()
  ai_sequence: Array<number>
}
