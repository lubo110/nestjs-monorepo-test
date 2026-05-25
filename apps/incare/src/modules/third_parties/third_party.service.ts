import type Redis from 'ioredis'
import { DEFAULT_REDIS, RedisService } from '@liaoliaots/nestjs-redis'
import { forwardRef, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as dayjs from 'dayjs'
import { Model } from 'mongoose'
import { ClsService } from 'nestjs-cls'
import { v4 as uuid } from 'uuid'
import { AiService } from '../ai/ai.service'
import { CreateDiagnosisDTOV2 } from '../diagnosis/diagnosis.dto'
import { DiagnosisService } from '../diagnosis/diagnosis.service'
import { CreateMeasureDTO } from '../measures/measure.dto'
import { ModelsInfoService } from '../models_Info/models_Info.service'
import { NotificationService } from '../notification/notification.service'
import { ApiKeyService } from '../shared/common/api-key.service'
import {
  Language,
  Platform,
  WaffleRequestStatus,
} from '../shared/enums/common.enum'
import { PredictionStatus } from '../shared/enums/diagnosis.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { ThirdPartyUserMappingService } from '../third_party_user_mappings/third_party_user_mapping.service'
import { CreateThirdPartyDTO } from './third_party.dto'
import { ThirdPartyContext } from './third_party.interface'
import { ThirdParty, ThirdPartyDocument } from './third_party.schema'

@Injectable()
export class ThirdPartyService {
  private response: WaffleResponse
  logger = new Logger(ThirdPartyService.name)
  private readonly redis: Redis | null
  constructor(
    @InjectModel(ThirdParty.name, 'sharedConnection')
    private readonly thirdPartyModel: Model<ThirdPartyDocument>,
    private readonly apiKeyService: ApiKeyService,
    @Inject(forwardRef(() => ThirdPartyUserMappingService))
    private readonly mappingService: ThirdPartyUserMappingService,
    private readonly diagnosisService: DiagnosisService,
    private readonly modelsInfoService: ModelsInfoService,
    // Inject ClsService to be able to retrieve data from the cls context.
    private readonly cls: ClsService,
    private readonly aiService: AiService,
    private readonly notificationService: NotificationService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getOrThrow(DEFAULT_REDIS)
  }

  // 查詢單一合作夥伴
  async findOneByThirdPartyId(
    third_party_id: string,
    is_active: boolean,
  ): Promise<ThirdPartyDocument> {
    return this.thirdPartyModel
      .findOne({
        third_party_id,
        is_active,
      })
      .exec()
  }

  // 查詢單一合作夥伴
  async findOneByApiKey(
    api_key: string,
    is_active: boolean,
  ): Promise<ThirdPartyDocument> {
    return this.thirdPartyModel
      .findOne({
        api_key,
        is_active,
      })
      .exec()
  }

  async findOneByThirdPartyName(
    third_party_name: string,
  ): Promise<ThirdPartyDocument> {
    const thirdParty = await this.thirdPartyModel
      .findOne({
        third_party_name,
      })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
    return thirdParty
  }

  // 查詢所有合作夥伴
  async findAll(): Promise<ThirdPartyDocument[]> {
    return this.thirdPartyModel.find().exec()
  }

  async createThirdParty(body: CreateThirdPartyDTO): Promise<WaffleResponse> {
    const { third_party_name, i8_device_name_prefix } = body
    const found = await this.findOneByThirdPartyName(third_party_name)

    if (found) {
      throw new ApiException(
        `The third-party name[${third_party_name}] already exists.`,
        WaffleRequestStatus.OBJECT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    const third_party_id = uuid()
    // 使用哈希方式儲存 app_key
    const { hashed_api_key }
      = await this.apiKeyService.createThirdPartyApiKey()

    const third_party = {
      third_party_id,
      third_party_name,
      api_key: hashed_api_key,
      expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      i8_device_name_prefix,
    }
    const created_third_party = await this.thirdPartyModel.create(third_party)
    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {
        third_party_id,
        third_party_name: created_third_party.third_party_name,
        api_key: hashed_api_key,
        is_active: created_third_party.is_active,
        expiry_date: created_third_party.expiry_date,
        i8_device_name_prefix: created_third_party.i8_device_name_prefix,
      },
    })
  }

  async findByApiKey(api_key: string): Promise<ThirdPartyDocument | null> {
    return this.thirdPartyModel.findOne({ api_key }).exec()
  }

  async extendApiKey(key: string) {
    const now = new Date()
    const newExpiry = new Date(now)
    newExpiry.setFullYear(newExpiry.getFullYear() + 1)

    const result = await this.thirdPartyModel.findOneAndUpdate(
      { api_key: key, is_active: true },
      {
        $set: {
          expiry_date: newExpiry,
        },
      },
      {
        new: true, // 返回更新后的数据
      },
    )
    if (!result) {
      throw new ApiException(
        `API Key not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }
    return {
      code: WaffleRequestStatus.SUCCESS,
      data: {
        api_key: result.api_key,
        expiry_date: result.expiry_date,
      },
    }
  }

  async verifyApiKeyAndGenerateToken(
    thirdParty: ThirdParty,
    externalUserId: string,
    includeSciChartKey: boolean = true,
  ): Promise<WaffleResponse> {
    const userInfo = await this.mappingService.handleThirdPartyUser(
      thirdParty,
      externalUserId,
    )

    const baseData = {
      access_token: this.formatBearerToken(userInfo.access_token),
      system_user_id: userInfo.system_user_id,
      i8_device_name_prefix: thirdParty.i8_device_name_prefix,
      lead_number: '6_leads',
    }

    const data = includeSciChartKey
      ? {
          ...baseData,
          sci_key: process.env.SCICHART_KEY ?? '',
        }
      : baseData

    return {
      code: WaffleRequestStatus.SUCCESS,
      data,
    }
  }

  private formatBearerToken(token: string): string {
    return `Bearer ${token}`
  }

  async evaluateAndNotify(
    user: any,
    diagnosis_id: string,
    notify_url: string,
    platform: Platform,
  ): Promise<any> {
    const req_id = this.cls.get('req_id')
    const user_id = user.id
    const externalUserId = user.external_user_id
    if (!user.third_party_id) {
      throw new ApiException(
        `Third part id not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }
    const third_party_id = user.third_party_id
    const thirdPart = await this.findOneByThirdPartyId(third_party_id, true)
    if (!thirdPart) {
      throw new ApiException(
        `Third part user not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }
    // 查詢診斷
    const diagnosis = await this.diagnosisService.getDiagnosisByDiagnosisId(
      diagnosis_id,
      true,
    )
    if (!diagnosis) {
      throw new ApiException(
        `Diagnosis not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
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
    const value: ThirdPartyContext = {
      notify_url,
      api_key: thirdPart.api_key,
      external_user_id: externalUserId,
    }
    await this.redis.set(`third_party:${diagnosis_id}`, JSON.stringify(value), 'EX', 60 * 60 * 24)
    // 如果已存在 ai預判結果 且 模型未變更，直接發送通知與回傳預判結果
    if (diagnosis.prediction_result.length > 0) {
      try {
        // send notification
        await this.notificationService.sendNotification(platform, {
          user_id,
          platform,
          diagnosis_id,
          measure_time: dayjs(diagnosis.create_date).format(),
          lang: Language.EN_US,
          third_party_id,
        })
        this.logger.log(
          `[req_id:${req_id}] [diagnosis_id:${diagnosis_id}] Notification sent successfully.`,
        )
      }
      catch (error) {
        this.logger.error(
          `[req_id:${req_id}] [diagnosis_id:${diagnosis_id}] Failed to send notification`,
          error,
        )
      }

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {},
        message: 'Notification sent successfully.',
      })
    }

    // 檢查 Prediction 狀態是否為 Pending , "Pending" means the request was already sent to AI server
    if (diagnosis.prediction_status === PredictionStatus.Pending) {
      this.logger.log(
        `[req_id:${req_id}] [diagnosis_id:${diagnosis_id}] [prediction_status:${PredictionStatus.Pending}] AI Server is still processing the request`,
      )
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
        lang: Language.EN_US,
        third_party_id,
        phone: user.phone,
      },
    )

    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: 'AI evaluation request has been sent.',
    })
  }

  async createDiagnosis(body: CreateDiagnosisDTOV2) {
    return this.diagnosisService.createDiagnosis(body)
  }

  async createMeasure(diagnosis_id: string, body: CreateMeasureDTO) {
    return this.diagnosisService.createMeasure(diagnosis_id, body)
  }
}
