import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { v4 as uuid } from 'uuid'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { Anomaly, AnomalyDocument } from './anomaly.schemas'

@Injectable()
export class AnomalyService {
  constructor(
    @InjectModel(Anomaly.name, 'sharedConnection')
    private readonly anomalyModel: Model<AnomalyDocument>,
  ) {}

  /**
   * get anomaly
   */
  public async getAnomaly(model_name: any, diagnosis_id: any): Promise<any> {
    const anomaly: AnomalyDocument = await this.anomalyModel
      .findOne({ model_name, diagnosis_id })
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    return Promise.resolve(anomaly)
  }

  /**
   * save anomaly
   */

  public async saveAnomaly(
    model_name: any,
    diagnosis_id: any,
    result: any,
    start_end_peak: any,
    retake_measurement?: number,
  ): Promise<any> {
    const create_data = {
      id: uuid(),
      diagnosis_id,
      model_name,
      result,
      start_end_peak,
      retake_measurement,
    }

    const model = new this.anomalyModel(create_data)
    await model.save().catch(() => {
      throw new ApiException(
        'PROCESS_FAILED',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    return Promise.resolve({
      code: WaffleRequestStatus.SUCCESS,
      data: create_data,
    })
  }

  /**
   * delete anomaly
   */
  public async deleteAnomaly(model_name: any, diagnosis_id: any) {
    return await this.anomalyModel
      .deleteOne({ model_name, diagnosis_id })
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
  }
}
