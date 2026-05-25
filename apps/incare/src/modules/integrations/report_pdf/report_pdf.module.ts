import { QUEUE_NAMES } from '@incare/modules/shared/strings'
import { BullModule } from '@nestjs/bull'
import { Module } from '@nestjs/common'
import { DoctorDiagnosisModule } from '../../doctor_diagnosis/doctor_diagnosis.module'
import { PushModule } from '../../push/push.module'
import { ReportPdfCompletedProcessor } from './report_pdf_completed.processor'

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.DOCTOR_REPORT_PDF_COMPLETED }),
    PushModule,
    DoctorDiagnosisModule,
  ],
  providers: [ReportPdfCompletedProcessor],
})
export class ReportPdfModule {}
