import { Roles } from '@incare/modules/shared/enums/common.enum'
import { DoctorUserStatus } from '../doctor_users/doctor_user.schemas'

/**
 * 用户信息载荷（登录后存入 request.user 的数据结构）
 */
export interface UserPayload {
  /** 用户ID */
  id: number | string // 根据实际ID类型调整（number 或 string）

  /** 用户名 */
  username: string

  /** 角色 */
  role: Roles // 若角色有固定值，可定义为联合类型，如 'admin' | 'user' | 'guest'

  /** 手机号 */
  phone: string | null // 允许为 null

  /** 头像URL */
  profile_image: string | null // 可能为 null（未上传头像）

  /** 账号状态（已验证/未验证，基于手机号验证状态） */
  status: DoctorUserStatus
}

/**
 * 经过 JWT 验证后的用户身份信息
 * 包含从 JWT 载荷解析并验证后的核心用户数据
 */
export interface JwtPayloadWithDoctor {
  /**
   * 用户唯一标识
   * 对应 JWT 载荷中的 sub 字段（subject 的缩写，通常表示用户 ID）
   */
  id: string

  user_name: string

  /**
   * 用户手机号
   * 从 JWT 载荷中提取的用户注册手机号
   */
  phone: string

  /**
   * 用户角色
   * 表示用户在系统中的权限角色（如 admin、user 等）
   */
  role: string

  /**
   * JWT 令牌唯一标识
   * 用于标识当前令牌的唯一性，可用于令牌吊销等场景
   */
  jti: string

}

export interface SendSmsCode {
  phone: string
}
