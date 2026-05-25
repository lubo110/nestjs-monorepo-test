import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import moment = require('moment')

@Injectable()
export class TransformDateFieldsPipe implements PipeTransform {
  constructor(private readonly dateFields: string[]) {}

  transform(value: any) {
    if (value && typeof value === 'object') {
      this.dateFields.forEach((field) => {
        if (value[field]) {
          const dateStr = value[field]
          // 嘗試解析多種格式
          const formats = [
            'YYYY-MM-DD',
            'YYYY/MM/DD',
            'YYYY/M/D',
            'YYYY/MM/D',
            'YYYY/M/DD',
          ]
          const date = moment(dateStr, formats, true) // 使用嚴格模式驗證格式

          if (!date.isValid()) {
            throw new BadRequestException(
              `Invalid format for ${field}. Please use YYYY/MM/DD`,
            )
          }

          // 轉換為 YYYY/MM/DD 格式
          value[field] = date.format('YYYY/MM/DD')
        }
      })
    }
    return value // 返回轉換後的完整對象
  }
}
