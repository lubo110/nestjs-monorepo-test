import { DashboardEventType } from './events.enum'

export interface DashboardEvent {
  // PENDING_CHANGED 通知所有医生更新数据，doctorId选填
  // MY_CASE_CHANGED 通知指定医生更新数据，doctorId必填
  type: DashboardEventType
  doctorId?: string
}
