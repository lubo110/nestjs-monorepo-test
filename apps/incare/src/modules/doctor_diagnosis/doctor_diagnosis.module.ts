import { QUEUE_NAMES } from '@incare/modules/shared/strings'
import { BullModule } from '@nestjs/bull'

import { Module } from '@nestjs/common'

import { MongooseModule } from '@nestjs/mongoose'
import { DoctorAuthModule } from '../doctor_auth/doctor_auth.module'
import { DoctorJwtStrategy } from '../doctor_auth/guards/doctor_jwt.strategy'
import { DoctorUserModule } from '../doctor_users/doctor_user.module'
import { EcgAnalysisResultModule } from '../ecg_analysis_result/ecg_analysis_result.module'
import { IdentityProfileModule } from '../identity_profile/identity_profile.module'
import { MembershipModule } from '../membership/membership.module'
import { MinioModule } from '../storage/minio/minio.module'
import { DoctorDashboardService } from './doctor-dashboard.service'
import { DoctorDiagnosisController } from './doctor_diagnosis.controller'
import { DoctorDiagnosis, DoctorDiagnosisSchema } from './doctor_diagnosis.schema'
import { DoctorDiagnosisService } from './doctor_diagnosis.service'
import { DoctorDashboardEventBus } from './events/doctor_dashboard.event_bus'
import { GenerateReportPdfJob } from './jobs/generate_report_pdf.job'

@Module({
  imports: [
    MongooseModule.forFeature(
      [
        { name: DoctorDiagnosis.name, schema: DoctorDiagnosisSchema },
      ],
      'sharedConnection',
    ),
    BullModule.registerQueue(
      {
        name: QUEUE_NAMES.DOCTOR_REPORT_PDF_GENERATE,
      },
      {
        name: QUEUE_NAMES.DOCTOR_REPORT_PDF_COMPLETED,
      },
    ),
    IdentityProfileModule,
    MembershipModule,
    DoctorAuthModule,
    DoctorUserModule,
    MinioModule,
    EcgAnalysisResultModule,
  ],
  controllers: [DoctorDiagnosisController],
  providers: [
    DoctorDiagnosisService,
    DoctorDashboardService,
    GenerateReportPdfJob,
    DoctorJwtStrategy,
    DoctorDashboardEventBus,
  ],
  exports: [DoctorDiagnosisService],
})
export class DoctorDiagnosisModule {}
