/**
 * 用户信息载荷（登录后存入 request.user 的数据结构）
 */
export interface UserPayload {
  /** 用户ID */
  id: number | string // 根据实际ID类型调整（number 或 string）

  /** 用户名 */
  username: string

  /** 角色 */
  role: string // 若角色有固定值，可定义为联合类型，如 'admin' | 'user' | 'guest'

  /** 邮箱 */
  email: string | null // 允许为 null（如果用户可能未填写）

  /** 手机号 */
  phone: string | null // 允许为 null

  /** 性别 */
  gender: 'male' | 'female' | 'other' | string | null // 可根据实际枚举值细化

  /** 生日 */
  birthday: string | Date | null // 可能是字符串（如 '2000-01-01'）或 Date 对象

  /** 身高（单位：cm 等） */
  height: string

  /** 体重（单位：kg 等） */
  weight: string

  /** 头像URL */
  profile_image: string | null // 可能为 null（未上传头像）

  /** 国家/地区代码（如 'CN'、'HK'、'US' 等） */
  country: string
  /** 账号状态（已验证/未验证，基于手机号验证状态） */
  status: 'verified' | 'not verified'

  /**
   * 是否同意AI训练协议
   * 0 - 未确认（用户尚未对该授权进行确认操作）
   * 1 - 不同意（用户明确不同意将心电图数据用于 AI 训练）
   * 2 - 同意（用户明确同意将心电图数据用于 AI 训练）
   */
  ai_training_agreement: number
}

/**
 * 经过 JWT 验证后的用户身份信息
 * 包含从 JWT 载荷解析并验证后的核心用户数据
 */
export interface JwtPayload {
  /**
   * 用户唯一标识
   * 对应 JWT 载荷中的 sub 字段（subject 的缩写，通常表示用户 ID）
   */
  id: string

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

  /**
   * 第三方平台用户 ID
   */
  third_party_id: string | null

  /**
   * 是否为中国大陆用户
   * 仅当用户所属国家（country）为 'CN' 时，该值为 true；否则为 false
   */
  isMainlandChinaUser: boolean
}
