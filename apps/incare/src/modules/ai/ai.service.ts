import { Injectable, Logger } from '@nestjs/common'
import { CoreService } from '../@core/core.service'
import { IPredictionRequest } from '../comment/comment.interface'
import { MeasureService } from '../measures/measure.service'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { PredictionStatus } from '../shared/enums/diagnosis.enum'
import { DiagnosisProcessor } from './processor/diagnosis_processor'
import { DiagnosisProcessorResult } from './processor/diagnosis_processor.interface'
import { PredictionProducer } from './queues/prediction.producer'

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  constructor(
    private readonly service: CoreService,
    private readonly measureService: MeasureService,
    private readonly predictionProducer: PredictionProducer,
  ) {}

  async sendPredictionRequest(diagnosis_id: string): Promise<DiagnosisProcessorResult> {
    try {
      this.logger.log(
        `[sendPredictionRequest] Sending ai request for diagnosis_id: ${diagnosis_id}`,
      )
      const anomalies = await this.service.getAnomaliesByModelName(
        'default',
        diagnosis_id,
        '2',
      )
      if (anomalies.code !== WaffleRequestStatus.SUCCESS) {
        throw new Error(JSON.stringify(anomalies))
      }

      const hr = await this.measureService.getLatestHeartRate(diagnosis_id)
      const processor = new DiagnosisProcessor(anomalies.data, hr)
      const res = processor.execute()
      if (!res.status) {
        throw res.message
      }
      this.logger.log(
        `[sendPredictionRequest] Receive DiagnosisProcessor result for diagnosis_id: ${diagnosis_id}`,
      )
      return res
    }
    catch (error) {
      this.logger.error(
        `[sendPredictionRequest] Request failed for diagnosis_id: ${diagnosis_id}`,
        error,
      )
      throw error
    }
  }

  async handlePredictionRequest(params: IPredictionRequest): Promise<void> {
    // 更新 diagnosis 的 prediction_status 為 Pending
    const { diagnosis, req_id, platform, default_model, third_party_id, push_type, lang } = params

    diagnosis.prediction_status = PredictionStatus.Pending
    await diagnosis.save()

    this.logger.log(
      `[handlePredictionRequest] [req_id:${req_id}] [diagnosis_id:${diagnosis.diagnosis_id}] Updated prediction_status to: ${PredictionStatus.Pending}`,
    )

    // 將請求加入 Prediction Queue
    this.predictionProducer.createJob({
      user_id: diagnosis.user_id,
      diagnosis_id: diagnosis.diagnosis_id,
      measure_time: new Date(diagnosis.create_date).toISOString(),
      platform,
      default_model,
      third_party_id: third_party_id || null,
      lang,
      push_type,
      phone: params.phone,
    })

    this.logger.log(
      `[handlePredictionRequest] [req_id:${req_id}] [diagnosis_id:${diagnosis.diagnosis_id}] [lang:${lang}] Added to prediction queue successfully`,
    )
  }
}
