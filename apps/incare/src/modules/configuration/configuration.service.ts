import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { v4 as uuid } from 'uuid'
import { Post, PostDocument } from '../posts/post.schema'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { SystemParams } from '../shared/enums/system.params.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'
import { mapEnumToFrontend } from '../shared/utils/util'
import {
  CreateConfigurationDTO,
  UpdateConfigurationDTO,
} from './configuration.dto'
import { Configuration, ConfigurationDocument } from './configuration.schemas'

@Injectable()
export class ConfigurationService {
  private response: WaffleResponse
  constructor(
    @InjectModel(Configuration.name, 'sharedConnection')
    private configurationModel: Model<ConfigurationDocument>,
    @InjectModel(Post.name, 'sharedConnection')
    private postModel: Model<PostDocument>,
  ) {}

  async createConfiguration(
    data: CreateConfigurationDTO,
  ): Promise<WaffleResponse> {
    const config = await this.configurationModel
      .findOne({ key: data.key })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (config) {
      throw new ApiException(
        `${data.key} already exist`,
        WaffleRequestStatus.OBJECT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    await this.configurationModel.create(data).catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `Configuration [${data.key}] created successfully`,
    })
  }

  async findOneByName(name: string): Promise<ConfigurationDocument | null> {
    const config = await this.configurationModel
      .findOne({
        key: name,
      })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (!config) {
      throw new ApiException(
        `Configuration[${name}] is not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    return config
  }

  async findOneConfiguration(
    key: string,
  ): Promise<ConfigurationDocument | null> {
    // 20240710 因為app會直接call /config/find/Language，未來提供新的api取代直接獲取設定
    if (key === 'Languages') {
      key = SystemParams.Languages
    }
    const config = await this.configurationModel.findOne({ key }).catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    if (!config) {
      throw new ApiException(
        `Configuration[${key}] is not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    return config
  }

  async updateConfiguration(
    data: UpdateConfigurationDTO,
  ): Promise<WaffleResponse> {
    const { key, category, value, type, description } = data
    const config = await this.configurationModel.findOne({ key }).catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    if (!config) {
      throw new ApiException(
        `Configuration[${data.key}] is not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    await this.configurationModel
      .findOneAndUpdate(
        {
          key,
        },
        { category, value, type, description },
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
      data: { key, value, category, type, description },
      message: `Configuration has been updated successfully`,
    })
  }

  async removeConfiguration(key: string): Promise<WaffleResponse> {
    const config = await this.configurationModel.findOne({ key }).catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    if (!config) {
      throw new ApiException(
        `Configuration[${key}] is not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    await this.configurationModel.findOneAndDelete({ key }).catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: { key, value: config.value },
      message: `Configuration has been deleted successfully`,
    })
  }

  async addLanguageCode(language_code: string) {
    const languages = await this.findOneConfiguration(SystemParams.Languages)
    if (!languages) {
      throw new ApiException(
        `${SystemParams.Languages} settings not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    const new_language = [...languages.value, language_code]

    const updateObject = {
      key: SystemParams.Languages,
      value: [...new Set(new_language)],
    }
    await this.updateConfiguration(updateObject)
    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `${SystemParams.Languages} settings has been updated`,
    })
  }

  async removeLanguageCode(language_code: string) {
    const languages = await this.findOneConfiguration(SystemParams.Languages)
    if (!languages) {
      throw new ApiException(
        `${SystemParams.Languages} settings not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    const update_languages: string[] = languages.value
    const index = update_languages.indexOf(language_code)
    if (index < 0) {
      throw new ApiException(
        `Language[${language_code}] not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    // remove specific language code
    update_languages.splice(index, 1)
    const updateObject = {
      key: SystemParams.Languages,
      value: update_languages,
    }
    await this.updateConfiguration(updateObject)

    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `Language[${language_code}] has been deleted`,
    })
  }

  async addNewsCategory(lang: string, category_name: string) {
    try {
      // 先檢語言是不是有存在於系統設定中的語言
      await this.checkSystemLanguage(lang)

      const foundCategories = await this.findOneByName(SystemParams.Categories)

      const categoriesValue: any = foundCategories.value
      const category_id = uuid()
      if (categoriesValue[lang]) {
        const isExist = categoriesValue[lang].some(
          o => o.name === category_name,
        )
        if (isExist) {
          throw new ApiException(
            `Categories[${category_name}] already exists in [${lang}]`,
            WaffleRequestStatus.OBJECT_EXISTED,
            HttpStatus.INTERNAL_SERVER_ERROR,
          )
        }
        else {
          categoriesValue[lang].push({
            category_id,
            name: category_name,
          })
        }
      }
      else {
        categoriesValue[lang] = [{ category_id, name: category_name }]
      }

      await this.configurationModel.findOneAndUpdate(
        {
          key: SystemParams.Categories,
        },
        {
          value: categoriesValue,
        },
        { new: true },
      )
      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {},
        message: `Create a new category[${category_name}] in [${lang}]`,
      })
    }
    catch (e) {
      throw e
    }
  }

  async editNewsCategory(lang: string, category_id: string, new_name: string) {
    try {
      // 先檢語言是不是有存在於系統設定中的語言
      await this.checkSystemLanguage(lang)

      const foundCategories = await this.findOneConfiguration(
        SystemParams.Categories,
      )

      const categoriesValue: any = foundCategories.value
      const update_categories: [{ category_id: string, name: string }]
        = categoriesValue[lang]

      if (update_categories) {
        // 檢查指定語言中的文章分類是否存在
        const index = this.checkSystemCategories(
          update_categories,
          category_id,
        )

        // replace new name
        update_categories[index].name = new_name
        categoriesValue[lang] = update_categories

        await this.configurationModel.findOneAndUpdate(
          {
            key: SystemParams.Categories,
          },
          {
            value: categoriesValue,
          },
          { new: true },
        )

        return (this.response = {
          code: WaffleRequestStatus.SUCCESS,
          data: {},
          message: `Category[${category_id}] has been updated`,
        })
      }
      else {
        throw new ApiException(
          `Language[${lang}] not found`,
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
    catch (e) {
      throw e
    }
  }

  // 如果分類被刪除，需把所有引用同分類的post.category改成＝""
  async removeNewsCategory(lang: string, category_id: string) {
    try {
      // 先檢查語言是不是有存在於系統設定中的語言
      await this.checkSystemLanguage(lang)

      const foundCategories = await this.findOneByName(SystemParams.Categories)

      const categoriesValue: any = foundCategories.value
      const update_categories: [{ category_id: string, name: string }]
        = categoriesValue[lang]

      if (update_categories) {
        // 檢查指定語言中的文章分類是否存在
        const index = this.checkSystemCategories(
          update_categories,
          category_id,
        )
        // 移出post中將被刪除的category
        await this.postModel.updateMany(
          {
            lang,
            category: category_id,
          },
          { category: '' },
        )

        // remove a specified category
        update_categories.splice(index, 1)
        categoriesValue[lang] = update_categories

        await this.configurationModel.findOneAndUpdate(
          {
            key: SystemParams.Categories,
          },
          {
            value: categoriesValue,
          },
          { new: true },
        )

        return (this.response = {
          code: WaffleRequestStatus.SUCCESS,
          data: {},
          message: `Category[${category_id}] has been deleted`,
        })
      }
      else {
        throw new ApiException(
          `Language[${lang}] not found`,
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }
    catch (e) {
      throw e
    }
  }

  async findCategoriesByLanguage(lang: string) {
    try {
      // 先檢語言是不是有存在於系統設定中的語言
      await this.checkSystemLanguage(lang)
      const foundCategories = await this.getCategoriesListByLang(lang)

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: foundCategories || [],
      })
    }
    catch (e) {
      throw e
    }
  }

  public async getCategoriesListByLang(lang: string) {
    try {
      // 先檢語言是不是有存在於系統設定中的語言
      await this.checkSystemLanguage(lang)

      const foundCategories = await this.findOneConfiguration(
        SystemParams.Categories,
      )
      const match_categories: [{ category_id: string, name: string }]
        = foundCategories?.value?.[lang]

      return match_categories
    }
    catch {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  private async checkSystemLanguage(lang: string) {
    const languages = await this.findOneConfiguration(SystemParams.Languages)
    if (!languages && !languages.value) {
      throw new ApiException(
        `Configuration[${SystemParams.Languages}] not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    const languagesValue: string[] = languages.value
    if (!languagesValue.includes(lang)) {
      throw new ApiException(
        `Language[${lang}] not exists`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  public checkSystemCategories(
    categories: [{ category_id: string, name: string }],
    category_id: string,
  ): number {
    const index: number = categories.findIndex(
      o => o.category_id === category_id,
    )
    if (index < 0) {
      throw new ApiException(
        `Categories[${category_id}] not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
    return index
  }

  async getValidPhoneCountryCodes(): Promise<WaffleResponse> {
    try {
      const configuration = await this.findOneConfiguration(
        SystemParams.ValidPhoneCountryCodes,
      )
      if (
        configuration
        && configuration.value
        && Array.isArray(configuration.value)
      ) {
        return (this.response = {
          code: WaffleRequestStatus.SUCCESS,
          data: {
            name: mapEnumToFrontend(SystemParams.ValidPhoneCountryCodes),
            value: configuration.value,
          },
          message: 'Success',
        })
      }
      else {
        throw new ApiException(
          'Valid phone country codes configuration not found',
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.NOT_FOUND,
        )
      }
    }
    catch {
      throw new ApiException(
        'PROCESS_FAILED',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
