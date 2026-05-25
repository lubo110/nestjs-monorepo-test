import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MeasuresModule } from '../measures/measure.module'
import { EcgAnalysisResultController } from './ecg_analysis_result.controller'
import { EcgAnalysisResult, EcgAnalysisResultSchema } from './ecg_analysis_result.schema'
import { EcgAnalysisResultService } from './ecg_analysis_result.service'

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: EcgAnalysisResult.name, schema: EcgAnalysisResultSchema },
      ],
      'sharedConnection',
    ),
    MeasuresModule,
  ],
  providers: [EcgAnalysisResultService],
  exports: [EcgAnalysisResultService],
  controllers: [EcgAnalysisResultController],
})
export class EcgAnalysisResultModule {}
