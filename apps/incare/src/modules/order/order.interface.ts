import { ProductType } from './order.enum'

/** 套餐状态的联合类型（根据业务场景补充可选值，如active/inactive */
export type ProductStatus = 'active' | 'inactive'

/**
 * 套餐信息的核心接口
 * 对应业务中的会员套餐数据结构
 */
export interface ProductInfo {
  /** 套餐唯一标识ID */
  product_id: string
  /** 套餐名称 */
  product_name: string
  /** 套餐原价（单位：分，数值类型） */
  original_amount: number
  /** 套餐现价（单位：分，数值类型） */
  actual_amount: number
  /** 套餐类型 */
  product_type: ProductType
  /** 套餐描述信息 */
  product_desc: string
  /** 套餐状态 */
  status: ProductStatus
}
