import { Type } from 'class-transformer'
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'

export class TextContentDTO {
  @IsNotEmpty()
  @IsString()
  lang: string

  @IsString()
  text_content: string
}

export class SuggestionDTO {
  @IsOptional()
  @IsString()
  id: string

  @ValidateNested({ each: true })
  @IsArray()
  @IsNotEmpty()
  @Type(() => TextContentDTO)
  text_contents: TextContentDTO[]
}

export class CreateCommentDTO {
  @IsString()
  readonly type: string

  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => TextContentDTO)
  readonly description: TextContentDTO[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SuggestionDTO)
  readonly suggestions: SuggestionDTO[]
}

export class EditCommentDTO {
  @IsString()
  readonly comment_id: string

  @IsOptional()
  @IsString()
  readonly type: string

  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => TextContentDTO)
  readonly description: TextContentDTO[]

  @IsOptional()
  @ValidateNested({ each: true })
  @IsArray()
  @Type(() => SuggestionDTO)
  readonly suggestions: SuggestionDTO[]
}

export class DeleteCommentSuggestionDTO {
  @IsString()
  readonly comment_id: string

  @IsString()
  readonly type: string

  @IsString()
  readonly suggestion_id: string
}

export class DeleteSuggestionLanguageDTO {
  @IsString()
  readonly comment_id: string

  @IsString()
  readonly type: string

  @IsString()
  readonly suggestion_id: string

  @IsString()
  readonly lang: string
}

export class QueryCommentDTO {
  @IsString()
  diagnosis_id: string

  @IsString()
  lang: string

  @IsOptional()
  user_id: string

  @IsOptional()
  push_type: string
}
