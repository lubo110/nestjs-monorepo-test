import { systemConfig, SystemConfig } from '@incare/config/index'
import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { ClsService } from 'nestjs-cls'
import * as rn from 'random-number'
import { v4 as uuid } from 'uuid'
import { AiService } from '../ai/ai.service'
import { JwtPayload } from '../auth/auth.interface'
import { Diagnosis, DiagnosisDocument } from '../diagnosis/diagnosis.schemas'
import { ModelsInfoService } from '../models_Info/models_Info.service'
import { AiTrainingAgreementMessages } from '../shared/common.response'
import { AiTrainingAgreement, Language, Platform, WaffleRequestStatus } from '../shared/enums/common.enum'
import { PredictionStatus } from '../shared/enums/diagnosis.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { checkChineseCharacter } from '../shared/utils/util'
import { MinioService } from '../storage/minio/minio.service'
import { User } from '../users/user.schemas'
import { UserService } from '../users/user.service'
import {
  CreateCommentDTO,
  DeleteCommentSuggestionDTO,
  DeleteSuggestionLanguageDTO,
  EditCommentDTO,
} from './comment.dto'
import { DiagnosisWithDoctorDiagnosis } from './comment.interface'
import {
  Comment,
  CommentDocument,
  Suggestion,
  TextContent,
} from './comment.schemas'

@Injectable()
export class CommentService {
  private response: WaffleResponse

  private readonly changeModelFlag: boolean
  logger = new Logger(CommentService.name)
  constructor(
    @InjectModel(Comment.name, 'sharedConnection')
    private readonly commentModel: Model<CommentDocument>,
    @InjectModel(Diagnosis.name, 'sharedConnection')
    private readonly diagnosisModel: Model<DiagnosisDocument>,
    private readonly modelsInfoService: ModelsInfoService,
    // Inject ClsService to be able to retrieve data from the cls context.
    private readonly cls: ClsService,
    private readonly aiService: AiService,
    private readonly userService: UserService,
    private readonly minioService: MinioService,
    @Inject(systemConfig.KEY)
    private readonly config: SystemConfig,
  ) {
    this.changeModelFlag = this.config.changeModelFlag
  }

  async createComment(body: CreateCommentDTO) {
    const predictionComment = await this.findOneCommentByType(body.type).catch(
      () => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      },
    )
    if (predictionComment) {
      throw new ApiException(
        'Comment already exist',
        WaffleRequestStatus.OBJECT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    const suggestions: Suggestion[] = []
    if (body.suggestions && body.suggestions.length > 0) {
      body.suggestions.forEach((item) => {
        suggestions.push({ id: uuid(), text_contents: item.text_contents })
      })
    }
    const new_comment = {
      comment_id: uuid(),
      type: body.type,
      description: body.description,
      suggestions,
    }
    await this.commentModel.create(new_comment).catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })
    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: 'Comment created',
    })
  }

  async editPredictionComment(body: EditCommentDTO) {
    const comment = await this.findOneCommentById(body.comment_id)
    const updateObject: Record<string, any> = {}
    if (!comment) {
      throw new ApiException(
        'Comment is not found',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    if (body.type) {
      updateObject.type = body.type
    }

    // update description if array of objects is not empty
    let update_description: TextContent[] = []
    if (body.description && body.description.length > 0) {
      const origin_desc = comment.description.filter(
        ({ lang: value1 }) =>
          !body.description.some(({ lang: value2 }) => value1 === value2),
      )
      const update_desc = body.description.filter(({ lang: value1 }) =>
        comment.description.some(({ lang: value2 }) => value1 === value2),
      )
      const new_desc = body.description.filter(
        ({ lang: value1 }) =>
          !comment.description.some(({ lang: value2 }) => value1 === value2),
      )
      update_description = [...origin_desc, ...update_desc, ...new_desc]
      updateObject.description = update_description
    }

    // update suggestions if array of objects is not empty
    let final_suggestions: Suggestion[] = []
    if (body.suggestions && body.suggestions.length > 0) {
      // check suggestion format error like [[suggestion]]
      for (let i = 0; i < body.suggestions.length; i++) {
        const suggestion = body.suggestions[i]
        for (let j = 0; j < suggestion.text_contents.length; j++) {
          const text_contents = suggestion.text_contents
          for (let k = 0; k < text_contents.length; k++) {
            if (Array.isArray(text_contents[k])) {
              throw new ApiException(
                'Suggestion format error',
                WaffleRequestStatus.TYPE_ERROR,
                HttpStatus.BAD_REQUEST,
              )
            }
          }
        }
      }

      body.suggestions.forEach((i) => {
        final_suggestions = comment.suggestions
        if (i.id) {
          const index = comment.suggestions.findIndex(j => i.id === j.id)
          const database_suggestion = comment.suggestions[index]
          if (database_suggestion) {
            const update_suggestions = i.text_contents.filter(x =>
              database_suggestion.text_contents.some(y => x.lang === y.lang),
            )
            const origin_suggestions = database_suggestion.text_contents.filter(
              x => !i.text_contents.some(y => x.lang === y.lang),
            )
            const new_suggestions = i.text_contents.filter(
              x =>
                !database_suggestion.text_contents.some(y => x.lang === y.lang),
            )

            final_suggestions[index].text_contents = [
              ...update_suggestions,
              ...origin_suggestions,
              ...new_suggestions,
            ]
          }
          else {
            console.log(
              `在[comment_id:${body.comment_id}]中沒有對應content id[${i.id}]，故忽略處理`,
            )
          }
        }
        else {
          const new_suggestion: Suggestion = {
            id: uuid(),
            text_contents: i.text_contents,
          }
          final_suggestions.push(new_suggestion)
        }
      })
      updateObject.suggestions = final_suggestions
    }

    await this.commentModel.findOneAndUpdate(
      { comment_id: body.comment_id },
      updateObject,
      { new: true },
    )

    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `Comment has been updated successfully`,
    })
  }

  async deleteCommentById(comment_id: string) {
    const comment = await this.findOneCommentById(comment_id)
    if (!comment) {
      throw new ApiException(
        'Comment not found',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    await this.commentModel
      .deleteOne({
        comment_id,
      })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: { comment_id, type: comment.type },
      message: `Comment has been deleted successfully`,
    })
  }

  async deleteCommentSuggestion(body: DeleteCommentSuggestionDTO) {
    const comment = await this.findOneCommentByType(body.type)
    if (!comment) {
      throw new ApiException(
        'Comment not found',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    const updated_suggestions = comment.suggestions
    const index = comment.suggestions.findIndex(
      item => item.id === body.suggestion_id,
    )
    if (index < 0) {
      throw new ApiException(
        `Suggestion id not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    // remove specific suggestion
    updated_suggestions.splice(index, 1)

    await this.commentModel
      .findOneAndUpdate(
        { type: body.type },
        { suggestions: updated_suggestions },
        { new: true },
      )
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `Suggestion has been deleted successfully`,
    })
  }

  async deleteSuggestionLanguage(body: DeleteSuggestionLanguageDTO) {
    const comment = await this.findOneCommentByType(body.type)
    if (!comment) {
      throw new ApiException(
        `Comment not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const updated_suggestions = comment.suggestions
    const suggestion_index = comment.suggestions.findIndex(
      item => item.id === body.suggestion_id,
    )
    if (suggestion_index < 0) {
      throw new ApiException(
        `Suggestion id not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const suggestion = updated_suggestions[suggestion_index]
    const language_index = suggestion.text_contents.findIndex(
      ({ lang }) => lang === body.lang,
    )
    if (language_index < 0) {
      throw new ApiException(
        `Language not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    // remove a specified language
    suggestion.text_contents.splice(language_index, 1)
    updated_suggestions[suggestion_index] = suggestion

    await this.commentModel
      .findOneAndUpdate(
        { type: body.type },
        { suggestions: updated_suggestions },
        { new: true },
      )
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `language has been deleted successfully`,
    })
  }

  async findAllComments(): Promise<any> {
    const comments = await this.commentModel.find()
    return comments.map((comment) => {
      comment.suggestions = comment.suggestions.map((suggestion: Suggestion & { default_idx: number }) => {
        // add a new default_idx field for front end
        suggestion.default_idx = 0
        return suggestion
      })
      return comment
    })
  }

  async getCommentsByType(types: string[], lang: string) {
    const regex_types = types.map(type => new RegExp(type, 'i'))
    const predictionComments = await this.commentModel.find(
      {
        type: { $in: regex_types },
      },
      { created_at: 0, updated_at: 0 },
    )

    // check chinese character and change to LowerCase
    const new_lang_code = checkChineseCharacter(lang.toLowerCase())

    return predictionComments.map((comment) => {
      if (comment.description && comment.description.length > 0) {
        const index = comment.description.findIndex(
          ({ lang: value }) => value === new_lang_code,
        )
        if (index >= 0) {
          comment.description = [comment.description[index]]
        }
        else {
          //  the default language setting is English
          const eng = comment.description.find(
            ({ lang: value }) => value === Language.EN_US,
          )
          comment.description = [eng]
        }
      }

      if (comment.suggestions && comment.suggestions.length > 0) {
        const num = rn({
          min: 0,
          max: comment.suggestions.length - 1,
          integer: true,
        })

        const suggestion = comment.suggestions[num]
        if (suggestion.text_contents) {
          const index = suggestion.text_contents.findIndex(
            ({ lang: value }) => value === new_lang_code,
          )
          if (index >= 0) {
            suggestion.text_contents = [suggestion.text_contents[index]]
          }
          else {
            //  the default language setting is English
            const eng = suggestion.text_contents.find(
              ({ lang: value }) => value === Language.EN_US,
            )
            suggestion.text_contents = [eng]
          }
          comment.suggestions = [suggestion]
        }
      }
      return comment
    })
  }

  async findOneCommentById(comment_id: string): Promise<CommentDocument> {
    const comment = await this.commentModel
      .findOne({
        comment_id,
      })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
    return comment
  }

  async findOneCommentByType(type: string): Promise<CommentDocument> {
    const comment = await this.commentModel
      .findOne({
        type,
      })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
    return comment
  }

  // offline
  async getPredictionCommentsV2(
    diagnosisId: string,
    lang: string,
    platform: Platform,
    userPayload: JwtPayload,
    // 消息推送类型，中国大陆andriod版本会赋值 jpush 极光推送
    pushType?: string,
  ) {
    const { phone } = userPayload
    const req_id = this.cls.get('req_id')
    const diagnosis = await this.diagnosisModel.findOne({
      diagnosis_id: diagnosisId,
    }).populate({
      path: 'doctorDiagnosis',
      select: 'report_pdf_key',
    }) as DiagnosisWithDoctorDiagnosis | null

    if (!diagnosis) {
      throw new ApiException(
        `Diagnosis not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }
    const fileKey = diagnosis?.doctorDiagnosis?.report_pdf_key ?? null
    if (fileKey) {
      const doctor_pdf_url = await this.minioService.getPresignedUrl(fileKey)
      return {
        doctor_pdf_url,
      }
    }
    // 处理中国大陆用户的特殊逻辑（若存在则直接返回结果）
    const mainlandResult = await this.handleMainlandUserLogic(diagnosis, userPayload, lang)
    if (mainlandResult) {
      return mainlandResult
    }

    // 確認模型是否改變
    const modelsInfo = await this.modelsInfoService.getModelsInfo()
    if (!modelsInfo) {
      throw new ApiException(
        `ModelsInfo not found`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.NOT_FOUND,
      )
    }
    const isDefaultModelChange
      = this.changeModelFlag
        && !(modelsInfo.default === diagnosis.prediction_model)

    this.logger.log(
      `[getPredictionCommentsV2] [req_id:${req_id}] [diagnosis_id:${diagnosisId}] [lang:${lang}] CHANGE_MODEL_FLAG = ${this.changeModelFlag}, isDefaultModelChange = ${isDefaultModelChange}`,
    )

    // 如果已存在 ai預判結果 且 模型未變更，直接返回衛教資訊
    if (!isDefaultModelChange && diagnosis.prediction_result.length > 0) {
      this.logger.log(
        `[getPredictionCommentsV2] [req_id:${req_id}] [diagnosis_id:${diagnosisId}] [prediction_status:${PredictionStatus.Pending}] AI Server is still processing the request`,
      )
      return this.getCommentsByType(diagnosis.prediction_result, lang)
    }

    // 檢查 Prediction 狀態是否為 Pending , "Pending" means the request was already sent to AI server
    if (diagnosis.prediction_status === PredictionStatus.Pending) {
      throw new ApiException(
        `AI Server is processing your request, please wait`,
        WaffleRequestStatus.PROCESSING,
        HttpStatus.ACCEPTED,
      )
    }

    // 調用 AiService 處理預測請求
    await this.aiService.handlePredictionRequest(
      {
        diagnosis,
        platform,
        default_model: modelsInfo.default,
        req_id,
        push_type: pushType,
        lang: lang || Language.EN_US,
        phone,
      },
    )

    return [
      (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {},
        message: `AI evaluation request has been sent`,
      }),
    ]
  }

  /**
   * 处理中国大陆用户的AI训练协议校验逻辑
   * @returns 若需拦截返回则返回对应数据，否则返回null
   */
  private async handleMainlandUserLogic(
    diagnosis: DiagnosisDocument,
    userPayload: JwtPayload,
    lang: string,
  ): Promise<Array<{ description: any[], suggestions: any[] }> | null> {
    const { phone, isMainlandChinaUser } = userPayload
    if (!isMainlandChinaUser) {
      return null // 非中国大陆用户无需处理
    }
    // 获取用户信息（不存在则抛出异常）
    const user = await this.getUserByPhone(phone)
    // 已同意协议则无需拦截
    if (this.hasAgreedTrainingAgreement(user)) {
      return null
    }
    const predictionResult = diagnosis.prediction_result || []
    // 存在预测结果时返回对应数据
    if (this.isValidPredictionResult(predictionResult)) {
      this.logger.log(
        `[handleMainlandUserLogic]:存在预测结果,但用户未同意Ai训练协议,直接返回结果数据， [diagnosis_id:${diagnosis.id}] [lang:${lang}] [predictionResult:${predictionResult}] `,
      )
      return this.getCommentsByType(predictionResult, lang)
    }

    const agreementMessage = AiTrainingAgreementMessages[lang]
    this.logger.log(
      `[handleMainlandUserLogic]:不存在预测结果,但用户未同意Ai训练协议 [diagnosis_id:${diagnosis.id}] [lang:${lang}] [predictionResult:${predictionResult}] `,
    )
    return [{
      description: [{ lang, text_content: agreementMessage.title }],
      suggestions: [{
        id: '',
        text_contents: [{ lang, text_content: agreementMessage.text }],
      }],
    }]
  }

  /**
   * 通过手机号获取用户信息
   * @throws 当用户不存在时抛出异常
   */
  private async getUserByPhone(phone: string): Promise<User> {
    const user = await this.userService.findByIdentifier(phone)
    if (!user) {
      throw new ApiException(
        'User not found. Please check and try again',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }
    return user
  }

  /**
   * 判断用户是否已同意AI训练协议
   */
  private hasAgreedTrainingAgreement(user: User) {
    return user.ai_training_agreement === AiTrainingAgreement.AGREED
  }

  /**
   * 验证预测结果是否为有效的非空数组
   */
  private isValidPredictionResult(predictionResult: unknown): predictionResult is any[] {
    return Array.isArray(predictionResult) && predictionResult.length > 0
  }

  async getPredictionStatusByDiagnosisId(diagnosis_id: string) {
    const diagnosis = await this.diagnosisModel.findOne({ diagnosis_id })
    if (!diagnosis) {
      throw new ApiException(
        `diagnosis_id not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {
        diagnosis_id: diagnosis.diagnosis_id,
        prediction_result: diagnosis.prediction_result || [],
        prediction_status: diagnosis.prediction_status,
      },
    })
  }
}
