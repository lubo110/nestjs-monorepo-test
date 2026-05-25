import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

@Injectable()
export class DoctorLocalAuthGuard extends AuthGuard('doctor-local') {}
