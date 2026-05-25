export interface DoctorDashboardStats {
  pendingDiagnosisCount: number
  myInProgressCount: number
  completedThisMonthCount: number
  last30DaysTrend: {
    date: string
    count: number
  }[]
}
