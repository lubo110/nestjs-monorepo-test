import { ProductType } from './order.enum'

/**
 * 生成18位唯一订单号（13位时间戳 + 5位随机数）
 */
export function generateOrderNo(): string {
  const timestamp = Date.now().toString()
  const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return timestamp + randomNum
}

/**
 * 根据套餐类型计算结束时间
 */
export function calculateEndTime(startTime: Date, type: ProductType): Date {
  const endTime = new Date(startTime)
  if (type === 'month')
    endTime.setMonth(endTime.getMonth() + 1)
  else if (type === 'year')
    endTime.setFullYear(endTime.getFullYear() + 1)
  else throw new Error(`不支持的套餐类型：${type}`)
  return endTime
}
