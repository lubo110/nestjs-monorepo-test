import * as moment from 'moment'
import { ChineseCharacter } from '../common.meta'
import { Language, Platform } from '../enums/common.enum'
import { SystemParams } from '../enums/system.params.enum'

export function formatDate(date: moment.MomentInput, outputFormat = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) {
    return '-'
  }
  return moment(date).format(outputFormat)
}

export function checkChineseCharacter(country_code: string): string {
  const new_country_code: { convert_code: string }
    = ChineseCharacter[country_code]
  if (new_country_code) {
    country_code = new_country_code.convert_code
  }
  return country_code
}

export function mapEnumToFrontend(param: SystemParams): string {
  // 去除前缀 "config_"
  return param.replace(/^config_/, '')
}

export function isValidLanguage(lang: string): boolean {
  return Object.values(Language).includes(lang as Language)
}

export function validatePlatform(platform: string): Platform {
  if (Object.values(Platform).includes(platform as Platform)) {
    return platform as Platform
  }
  throw new Error(`Invalid platform: ${platform}`)
}

export function isPlainObject(obj: any) {
  return obj !== null && typeof obj === 'object' && Object.prototype.toString.call(obj) === '[object Object]'
};
