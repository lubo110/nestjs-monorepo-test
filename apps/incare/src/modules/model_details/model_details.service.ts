import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import {
  WaffleResponse,
  WaffleSuccessCreateResponse,
  WaffleSuccessResponse,
} from '../shared/interfaces/common.interface'
import {
  CreateModelDetailsDTO,
  UpdateModelDetailsDTO,
} from './model_details.dto'
import { ModelDetails, ModelDetailsDocument } from './model_details.schemas'

@Injectable()
export class ModelDetailsService {
  constructor(
    @InjectModel(ModelDetails.name, 'sharedConnection')
    private readonly modelDetailsModel: Model<ModelDetailsDocument>,
  ) {}

  async getAllModelDetails(): Promise<ModelDetailsDocument[]> {
    return await this.modelDetailsModel.find({}).catch((err) => {
      throw new ApiException(
        `MongDB Query Error : ${err}`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })
  }

  async getModelDetailsByName(
    model_name: string,
  ): Promise<ModelDetailsDocument> {
    const model_details: ModelDetailsDocument = await this.modelDetailsModel
      .findOne({
        model_name,
      })
      .catch((err) => {
        throw new ApiException(
          `MongDB Query Error : ${err}`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (!model_details) {
      throw new ApiException(
        `Model doesn't exist`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    return model_details
  }

  async createModelDetails(
    body: CreateModelDetailsDTO,
  ): Promise<WaffleResponse> {
    // 1.model是否已經存在
    const model_details = await this.modelDetailsModel
      .findOne({
        model_name: body.model_name,
      })
      .catch((err) => {
        throw new ApiException(
          `MongDB Query Error : ${err}`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
    // 不存在
    if (!model_details) {
      try {
        await this.modelDetailsModel.create(body)
        const result: WaffleSuccessCreateResponse = {
          code: WaffleRequestStatus.SUCCESS,
          data: { create_counts: 1, datas: [{ model_name: body.model_name }] },
        }
        return Promise.resolve(result)
      }
      catch (err) {
        throw new ApiException(
          `Insert ModelDetails Error : ${err}`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
    else {
      // model已經存在
      throw new ApiException(
        `Model already exist`,
        WaffleRequestStatus.OBJECT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async updateModelDetails(update: UpdateModelDetailsDTO) {
    // 先判斷Model是否存在
    const model_details = await this.modelDetailsModel
      .findOne({
        model_name: update.model_name,
      })
      .catch((err) => {
        throw new ApiException(
          `MongDB Query Error : ${err}`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
    // 不存在，拋出異常
    if (!model_details) {
      throw new ApiException(
        `Model doesn't exist`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    else {
      try {
        await this.modelDetailsModel.findOneAndUpdate(
          { model_name: update.model_name },
          update,
        )

        const result: WaffleSuccessResponse = {
          code: WaffleRequestStatus.SUCCESS,
          data: `Update success`,
        }

        return Promise.resolve(result)
      }
      catch (err) {
        throw new ApiException(
          `Update ModelDetail Error : ${err}`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
  }

  async getTrainedModels(is_trained: boolean): Promise<ModelDetailsDocument[]> {
    return this.modelDetailsModel
      .find({ final_model: is_trained })
      .catch((err) => {
        throw new ApiException(
          `MongDB Query Error : ${err}`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
  }
}
