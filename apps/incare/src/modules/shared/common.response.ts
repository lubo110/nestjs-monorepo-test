import { ECGPredictionNotification } from '../notification/notification.interface'
import { Language } from './enums/common.enum'

export const SMSTranslateMsg = {
  en_us: {
    signup:
      'inCare Verification code: 0000.  please enter code within 5 minutes to sign up',
    resetPassword:
      'inCare Verification code: 0000.  please enter code within 5 minutes to reset your password',
  },
  zh_tw: {
    signup:
      '【inCare】感謝您使用inCare，您的認證碼為: 0000，請於APP內輸入以完成註冊程序，感謝您。',
    resetPassword:
      '【inCare】驗證碼為: 0000，請在5分鐘內正確輸入並重置新的密碼。感謝您對我們的支持！',
  },
  zh_cn: {
    signup:
      '【inCare】感谢您使用inCare，您的认证码为: 0000，请于APP内输入以完成注册程序，感谢您。',
    resetPassword:
      '【inCare】验证码为: 0000，请在5分钟内正确输入并重置新的密码。感谢您对我们的支持！',
  },
}

export const ECGPredictionNotificationMessages: Partial<
  Record<Language, ECGPredictionNotification>
> = {
  en_us: {
    title: 'ECG prediction has been received.',
    message: 'The ECG prediction result is now available for review.',
  },
  zh_tw: {
    title: '已收到心電圖預測結果。',
    message: '您的心電圖預測結果已經準備好，可以開始查看。',
  },
  zh_cn: {
    title: '已收到心电图预测结果。',
    message: '您的心电图预测结果已准备好，可以开始查看。',
  },
  ko_kr: {
    title: 'ECG 예측이 수신되었습니다.',
    message: 'ECG 예측 결과가 이제 준비되었습니다. 결과를 확인하세요.',
  },
}

export const DoctorReportNotificationMessages: Partial<
  Record<Language, ECGPredictionNotification>
> = {
  en_us: {
    title: 'ECG prediction has been received.',
    message: 'The ECG prediction result is now available for review.',
  },
  zh_tw: {
    title: '已收到心電圖預測結果。',
    message: '您的心電圖預測結果已經準備好，可以開始查看。',
  },
  zh_cn: {
    title: '已收到心电图预测结果。',
    message: '您的心电图预测结果已准备好，可以开始查看。',
  },
  ko_kr: {
    title: 'ECG 예측이 수신되었습니다.',
    message: 'ECG 예측 결과가 이제 준비되었습니다. 결과를 확인하세요.',
  },
}

export const AiTrainingAgreementMessages: Record<string, { title: string, text: string }> = {
  en_us: {
    title: 'No analysis report',
    text: `Please join development plan in the app's general setting`,
  },
  zh_tw: {
    title: '暫無分析報告',
    text: '請在App通用設定中加入開發計畫',
  },
  zh_cn: {
    title: '暂无分析报告',
    text: '请在App通用设置中加入开发计划',
  },
  ko_kr: {
    title: '분석 보고서가 없습니다.',
    text: '앱 일반 설정에서 개발 계획을 추가하세요.',
  },
}
