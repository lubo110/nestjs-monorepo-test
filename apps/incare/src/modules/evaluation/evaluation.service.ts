import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { v4 as uuid } from 'uuid'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import {
  WaffleResponse,
  WaffleSuccessResponse,
} from '../shared/interfaces/common.interface'
import { CreateEvaluationDTO } from './evaluation.dto'
import { Evaluation, EvaluationDocument } from './evaluation.schemas'

@Injectable()
export class EvaluationsService {
  constructor(
    @InjectModel(Evaluation.name, 'sharedConnection')
    private readonly evalModel: Model<EvaluationDocument>,
  ) {}

  /**
   * get all evaluations tags by model name
   */
  public async getEvaluationsByModelName(
    model_name: any,
  ): Promise<WaffleResponse> {
    const evaluation: Array<EvaluationDocument> = await this.evalModel
      .find({ model_name })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
    if (!evaluation) {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const recomputed_evaluations = {}

    evaluation.forEach((e) => {
      if (!recomputed_evaluations[`${e.diagnosis_id}:${e.channel}`]) {
        recomputed_evaluations[`${e.diagnosis_id}:${e.channel}`] = []
      }
      recomputed_evaluations[`${e.diagnosis_id}:${e.channel}`].push({
        id: e.id,
        evaluator_sequence: e.evaluator_sequence,
        ai_sequence: e.ai_sequence,
        evaluator: e.evaluator,
        score: e.score,
        model_name: e.model_name,
        x1: e.x1,
        x2: e.x2,
        evaluation: e.evaluation,
        last_updated: e.last_updated,
      })
    })
    const result: WaffleSuccessResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: recomputed_evaluations,
    }
    return Promise.resolve(result)
  }

  /**
   * get all evaluations tags
   */
  public async getAllEvaluations(): Promise<WaffleResponse> {
    const evaluation: Array<EvaluationDocument> = await this.evalModel
      .find({})
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
    if (!evaluation) {
      throw new ApiException(
        `evaluation not found`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const recomputed_evaluations = {}

    evaluation.forEach((e) => {
      if (!recomputed_evaluations[`${e.diagnosis_id}:${e.channel}`]) {
        recomputed_evaluations[`${e.diagnosis_id}:${e.channel}`] = []
      }
      recomputed_evaluations[`${e.diagnosis_id}:${e.channel}`].push({
        id: e.id,
        evaluator_sequence: e.evaluator_sequence,
        ai_sequence: e.ai_sequence,
        evaluator: e.evaluator,
        score: e.score,
        model_name: e.model_name,
        x1: e.x1,
        x2: e.x2,
        evaluation: e.evaluation,
        last_updated: e.last_updated,
      })
    })
    const result: WaffleSuccessResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: recomputed_evaluations,
    }
    return Promise.resolve(result)
  }

  /**
   * get evaluation tags for a diagnosis
   */
  public async getEvaluation(diagnosis_id: string): Promise<WaffleResponse> {
    const evaluation: Array<EvaluationDocument> = await this.evalModel
      .find({ diagnosis_id })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (!evaluation) {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const result: WaffleSuccessResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: evaluation.map((ev) => {
        return {
          id: ev.id,
          diagnosis_id: ev.diagnosis_id,
          channel: ev.channel,
          x1: ev.x1,
          x2: ev.x2,
          evaluation: ev.evaluation,
          evaluator: ev.evaluator,
          model_name: ev.model_name,
          last_updated: ev.last_updated,
        }
      }),
    }
    return Promise.resolve(result)
  }

  /**
   * save evaluation for a specific diagnosis and specific channel
   */

  public async saveEvaluation(
    body: CreateEvaluationDTO,
  ): Promise<WaffleResponse> {
    const evaluator_sequence = body.evaluator_sequence
    const ai_sequence = body.ai_sequence

    const create_data = {
      id: uuid(),
      diagnosis_id: body.diagnosis_id,
      evaluator_sequence,
      ai_sequence,
      evaluator: body.evaluator,
      model_name: body.model_name,
      score: body.score,
      channel: body.channel,
      x1: body.x1,
      x2: body.x2,
      evaluation: body.evaluation,
    }

    const model = new this.evalModel(create_data)
    await model.save().catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
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
   * delete evaluation for a diagnosis
   */
  public async deleteEvaluation(id: any): Promise<WaffleResponse> {
    await this.evalModel.deleteOne({ id }).catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })
    return Promise.resolve({ code: WaffleRequestStatus.SUCCESS, data: {} })
  }
}
