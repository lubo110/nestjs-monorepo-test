import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { UpdateModelsInfoDTO } from './models_Info.dto'
import { ModelsInfo, ModelsInfoDocument } from './models_Info.schema'

@Injectable()
export class ModelsInfoService {
  constructor(
    @InjectModel(ModelsInfo.name, 'sharedConnection')
    private readonly modelsInfoModel: Model<ModelsInfoDocument>,
  ) {}

  public async getModelsInfo(): Promise<ModelsInfoDocument> {
    return await this.modelsInfoModel.findOne({})
  }

  public async setDefaultModel(model_name: string): Promise<WaffleResponse> {
    const modelsInfo = await this.getModelsInfo()

    if (!modelsInfo) {
      throw new ApiException(
        `Access ModelsInfo Error`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    if (modelsInfo.default === model_name) {
      return {
        code: WaffleRequestStatus.SUCCESS,
        data: modelsInfo,
      }
    }

    if (modelsInfo.challengers.includes(model_name)) {
      const index: number = modelsInfo.challengers.findIndex(
        item => item === model_name,
      )

      modelsInfo.challengers[index] = modelsInfo.default
      modelsInfo.default = model_name

      try {
        await this.modelsInfoModel.findOneAndUpdate(
          { _id: modelsInfo.id },
          modelsInfo,
        )
        return {
          code: WaffleRequestStatus.SUCCESS,
          data: modelsInfo,
        }
      }
      catch {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
    else {
      throw new ApiException(
        `Models doesn't exist`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  public async addTrainedModel(
    model_name: string,
    is_default: boolean,
  ): Promise<WaffleResponse> {
    const modelsInfo = await this.getModelsInfo()

    if (!modelsInfo) {
      throw new ApiException(
        `Access ModelsInfo Error`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    // model is not duplicate
    if (
      model_name !== modelsInfo.default
      && !modelsInfo.challengers.includes(model_name)
    ) {
      let newChallengers: string[] = []

      if (is_default) {
        newChallengers = [modelsInfo.default, ...modelsInfo.challengers]
        modelsInfo.default = model_name
      }
      else {
        newChallengers = [model_name, ...modelsInfo.challengers]
      }
      modelsInfo.challengers = newChallengers

      try {
        await this.modelsInfoModel.findOneAndUpdate(
          { _id: modelsInfo.id },
          modelsInfo,
        )
        return {
          code: WaffleRequestStatus.SUCCESS,
          data: modelsInfo,
        }
      }
      catch (err) {
        throw new ApiException(
          `Update ModelsInfo Error : ${err}`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
    else {
      throw new ApiException(
        `Model[${model_name}] already exist`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  public async updateModelInfo(updateModelInfo: UpdateModelsInfoDTO) {
    const modelsInfo = await this.getModelsInfo()
    if (!modelsInfo) {
      throw new ApiException(
        `Access ModelsInfo Error`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    try {
      await this.modelsInfoModel.findOneAndUpdate(
        { _id: modelsInfo.id },
        updateModelInfo,
      )
      return {
        code: WaffleRequestStatus.SUCCESS,
        data: updateModelInfo,
      }
    }
    catch (err) {
      throw new ApiException(
        `Update ModelsInfo Error : ${err}`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  public async deleteChallenger(model: string) {
    const modelsInfo = await this.getModelsInfo()
    if (!modelsInfo) {
      throw new ApiException(
        `Access ModelsInfo Error`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    if (
      modelsInfo.default === model
      || !modelsInfo.challengers.includes(model)
    ) {
      throw new ApiException(
        `Model doesn't exist or model is not in challengers`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    else {
      try {
        const index = modelsInfo.challengers.indexOf(model)
        modelsInfo.challengers.splice(index, 1)
        await this.modelsInfoModel.findOneAndUpdate(
          { _id: modelsInfo.id },
          modelsInfo,
        )
        return {
          code: WaffleRequestStatus.SUCCESS,
          data: modelsInfo,
        }
      }
      catch (err) {
        throw new ApiException(
          `Update ModelsInfo Error : ${err}`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
  }
}
