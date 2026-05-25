import { CanActivate, ExecutionContext, HttpStatus, Injectable, SetMetadata } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { WaffleRequestStatus } from '@incare/modules/shared/enums/common.enum'
import { ApiException } from '@incare/modules/shared/exceptions/api.exception'
import { DoctorDiagnosisStatus } from './doctor_diagnosis.enum'
import { DoctorDiagnosisService } from './doctor_diagnosis.service'

const DIAGNOSISACTION_KEY = 'doctorDiagnosisAction'
export function DoctorDiagnosisAction(action: 'view' | 'accept' | 'update') {
  return SetMetadata(DIAGNOSISACTION_KEY, action)
}
@Injectable()
export class DoctorDiagnosisGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly service: DoctorDiagnosisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user
    const diagnosisId = request.params.diagnosis_id
    const action = this.reflector.get<'view' | 'update' | 'accept'>(DIAGNOSISACTION_KEY, context.getHandler())
    const record = await this.service.findByDiagnosisId(diagnosisId)
    if (!record) {
      throw new ApiException(
        `诊断记录【${diagnosisId}】不存在`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }
    switch (action) {
      case 'view':
        return true // 所有医生可查看
      case 'accept':
        if (record.status !== DoctorDiagnosisStatus.Requested) {
          throw new ApiException(
            `已被其他医生医生接诊`,
            WaffleRequestStatus.ERROR,
            HttpStatus.FORBIDDEN,
          )
        }
        return true
      case 'update':
        if (record.status !== DoctorDiagnosisStatus.InProgress || record.doctor_id !== user.id) {
          throw new ApiException(
            `无权限操作该记录`,
            WaffleRequestStatus.AUTH_ERROR,
            HttpStatus.FORBIDDEN,
          )
        }
        return true
      default:
        return false
    }
  }
}
