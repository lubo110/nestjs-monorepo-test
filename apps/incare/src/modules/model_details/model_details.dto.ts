import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class CreateModelDetailsDTO {
  @IsString()
  @IsNotEmpty()
  model_name: string

  @IsString()
  url: string

  @IsOptional()
  @IsString()
  authorization: string

  @IsString()
  position: string

  @IsBoolean()
  final_model: boolean

  @IsOptional()
  @IsString()
  description: string
}

export class UpdateModelDetailsDTO {
  @IsString()
  model_name: string

  @IsOptional()
  @IsString()
  url: string

  @IsOptional()
  @IsString()
  authorization: string

  @IsOptional()
  @IsString()
  position: string

  @IsOptional()
  @IsBoolean()
  final_model: boolean

  @IsOptional()
  @IsString()
  description: string
}
