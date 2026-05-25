import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WaffleRequestStatus } from '@incare/modules/shared/enums/common.enum'
import { ApiException } from '@incare/modules/shared/exceptions/api.exception'
import { Measure, MeasureDocument } from './measure.schemas'

@Injectable()
export class MeasureService {
  constructor(
        @InjectModel(Measure.name, 'sharedConnection')
        private readonly measureModel: Model<MeasureDocument>,
  ) {}

  async getLatestHeartRate(diagnosis_id: string): Promise<number> {
  // 只查询最新的一条 measure
    const measure = await this.measureModel
      .findOne({ diagnosis_id })
      .select('heart_rate')
      .sort({ _id: -1 }) // 根据 _id 倒序获取最新记录
      .lean<{ heart_rate: number[] }>()
      .exec()

    // 返回最后一个心率值，如果没有数据则返回 0
    return measure?.heart_rate?.at(-1) ?? 0
  }

  async getMeasuresByDiagnosisId(diagnosis_id: string) {
    return await this.measureModel
      .findOne({ diagnosis_id })
      .lean<Measure>()
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
  }
}
