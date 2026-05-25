export enum DiagnosisType {
  ECG = 'ECG',
}

export enum PredictionStatus {
  Initial = 'Initial', // 初始狀態，尚未處理
  Pending = 'Pending', // 正進行處理
  Success = 'Success',
  Fail = 'Fail',
}
