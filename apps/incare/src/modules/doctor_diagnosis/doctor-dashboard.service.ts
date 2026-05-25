import { Injectable, MessageEvent } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as moment from 'moment'
import { Model } from 'mongoose'
import { concat, debounceTime, filter, from, map, Observable, switchMap } from 'rxjs'
import { DoctorDiagnosisStatus } from './doctor_diagnosis.enum'
import { DoctorDiagnosis, DoctorDiagnosisDocument } from './doctor_diagnosis.schema'
import { DoctorDashboardEventBus } from './events/doctor_dashboard.event_bus'
import { DashboardEventType } from './events/events.enum'
import { DoctorDashboardStats } from './types/doctor_diagnosis_dashboard'

@Injectable()
export class DoctorDashboardService {
  constructor(
   @InjectModel(DoctorDiagnosis.name, 'sharedConnection')
    private readonly diagnosisModel: Model<DoctorDiagnosisDocument>,
   private readonly dashboardEventBus: DoctorDashboardEventBus,
  ) {}

  /**
   * 返回 SSE Observable，前端订阅
   * doctorId 用于筛选私有事件
   */
  getDashboardSSE(doctorId: string): Observable<MessageEvent> {
  // 提取复用：获取仪表盘数据并包装成统一格式
    const fetchDashboardData = () => from(this.getDashboardStats(doctorId)).pipe(
      map(data => ({ data })),
    )

    // 1. 初始异步数据（页面加载时直接返回）
    const initialData$ = fetchDashboardData()

    // 2. 后续事件触发的数据流
    const eventData$ = this.dashboardEventBus.onEvent().pipe(
      filter((event) => {
        if (event.type === DashboardEventType.PENDING_CHANGED)
          return true
        if (event.type === DashboardEventType.MY_CASE_CHANGED && event.doctorId === doctorId)
          return true
        return false
      }),
      debounceTime(300),
      switchMap(() => fetchDashboardData()),
    )
    return concat(initialData$, eventData$)
  }

  async getDashboardStats(doctorId: string): Promise<DoctorDashboardStats> {
    const DAYS = 30
    const now = moment()
    const startOfMonth = now.clone().startOf('month').toDate()
    // 29 天前 + 今天
    const startOf30Days = now.clone().subtract(DAYS - 1, 'days').startOf('day').toDate()
    const endOfToday = now.clone().endOf('day').toDate()
    // 待接诊记录数
    const pendingCountPromise = this.diagnosisModel.countDocuments({
      status: DoctorDiagnosisStatus.Requested,
    })

    // 我的未提交诊断
    const inProgressCountPromise = this.diagnosisModel.countDocuments({
      status: DoctorDiagnosisStatus.InProgress,
      doctor_id: doctorId,
    })

    // 本月完成诊断
    const completedThisMonthCountPromise = this.diagnosisModel.countDocuments({
      status: DoctorDiagnosisStatus.Completed,
      doctor_id: doctorId,
      completed_time: { $gte: startOfMonth, $lte: endOfToday },
    })

    // 近30日诊断曲线
    const last30DaysCurvePromise = this.diagnosisModel.aggregate([
      {
        $match: {
          doctor_id: doctorId,
          completed_time: { $gte: startOf30Days, $lte: endOfToday },
          status: DoctorDiagnosisStatus.Completed,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completed_time' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const [pendingDiagnosisCount, myInProgressCount, completedThisMonthCount, last30DaysCurve] = await Promise.all([
      pendingCountPromise,
      inProgressCountPromise,
      completedThisMonthCountPromise,
      last30DaysCurvePromise,
    ])

    // 构建完整的30天曲线，即使某天没有数据也补0
    const curveMap = new Map(
      last30DaysCurve.map(item => [item._id, item.count]),
    )
    const last30DaysTrend = Array.from({ length: DAYS }, (_, index) => {
      const date = moment(startOf30Days)
        .add(index, 'days')
        .format('YYYY-MM-DD')
      return {
        date,
        count: curveMap.get(date) ?? 0,
      }
    })
    return {
      pendingDiagnosisCount,
      myInProgressCount,
      completedThisMonthCount,
      last30DaysTrend,
    } as DoctorDashboardStats
  }
}
