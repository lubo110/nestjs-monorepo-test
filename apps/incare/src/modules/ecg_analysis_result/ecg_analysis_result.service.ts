import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { WaffleRequestStatus } from '@incare/modules/shared/enums/common.enum'
import { ApiException } from '@incare/modules/shared/exceptions/api.exception'
import { MeasureService } from '../measures/measure.service'
import { analyzeECG } from './algorithms'
import { EcgAnalysisResult, EcgAnalysisResultDocument } from './ecg_analysis_result.schema'
import { ECGInput } from './interfaces'

@Injectable()
export class EcgAnalysisResultService {
  constructor(
    @InjectModel(EcgAnalysisResult.name, 'sharedConnection')
    private readonly ecgAnalysisResultModel: Model<EcgAnalysisResultDocument>,
    private readonly measureService: MeasureService,
  ) {}

  async getEcgAnalysisResult(id: string) {
    const measure = await this.measureService.getMeasuresByDiagnosisId(id)
    // TODO: implement ecg analysis result

    return analyzeECG(measure.values as ECGInput[] || [])
  }

  /** 获取激活的 ECG 分析结果（对外接口） */
  async getActiveECGAnalysisResult(diagnosisId: string) {
    try {
      const result = await this.findActiveECGAnalysis(diagnosisId)
      return result ? result.toObject() : null // 转成普通对象返回
    }
    catch {
      throw new ApiException(
        'Failed to fetch ECG analysis result',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  async analyzeAndSaveECGResult(diagnosisId: string) {
  // 1️获取量测数据（单个对象）
    const measure = await this.measureService.getMeasuresByDiagnosisId(diagnosisId)
    if (!measure) {
      throw new ApiException(
        'No measure data found for this diagnosis',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }

    // 2️调用算法分析
    const ecgInput: ECGInput[] = measure.values as ECGInput[] || []
    const analysisResult = analyzeECG(ecgInput)

    if (!analysisResult) {
      throw new ApiException(
        'ECG analysis result is empty',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }

    // 3️标记历史分析失效（可选）
    await this.deactivateExistingAnalysis(diagnosisId)

    // 4️构建新结果
    const newResult = new this.ecgAnalysisResultModel({
      diagnosis_id: diagnosisId,
      algorithm_version: analysisResult.version || 'v1.0.0',
      algorithm_beat_results: analysisResult.beatResults,
      leads: analysisResult.leads,
      algorithm_report: analysisResult.report,
      is_active: true,
    })

    return newResult.save()
  }

  /** 标记现有激活结果失效 */
  private async deactivateExistingAnalysis(diagnosisId: string) {
    const existing = await this.findActiveECGAnalysis(diagnosisId)
    if (existing) {
      existing.is_active = false
      await existing.save()
    }
  }

  /** 私有函数：获取激活的 ECG 分析结果对象 */
  private async findActiveECGAnalysis(diagnosisId: string) {
    return await this.ecgAnalysisResultModel
      .findOne({ diagnosis_id: diagnosisId, is_active: true })
      .exec() // 不 lean，方便修改
  }
}
