import { WaffleRequestStatus } from '../enums/common.enum'

export interface WaffleResponse<T = any> {
  readonly code: WaffleRequestStatus
  readonly data: T
  readonly message?: string
}

export interface WaffleErrorResponse extends WaffleResponse<null> {
  readonly code: WaffleRequestStatus.ERROR
  readonly message: string
}

export interface WaffleSuccessResponse<T = any> extends WaffleResponse<T> {
  readonly code: WaffleRequestStatus.SUCCESS
}

export interface CreateObject {
  readonly create_counts: number
  readonly datas: Array<unknown>
}

export interface WaffleSuccessCreateResponse extends WaffleSuccessResponse {
  readonly data: CreateObject
}

export interface UpdateObject {
  readonly update_counts: number
  readonly datas: Array<unknown>
}

export interface WaffleSuccessUpdateResponse extends WaffleSuccessResponse {
  readonly data: UpdateObject
}

export interface DeleteObject {
  readonly delete_counts: number
  readonly datas: Array<unknown>
}

export interface WaffleSuccessDeleteResponse extends WaffleSuccessResponse {
  readonly data: DeleteObject
}

export interface ITranslate {
  zhTw: string
  zhCn: string
  koKr: string
  en: string
}

export interface Image {
  version: string
  saas: string
  cloud_path: string
  id: string
}
export interface ISMSMessage {
  code: string
  body: string
}

export interface IFile {
  fieldname: string
  originalname: string
  encoding: string
  mimetype: string
  size: number
  destination: string
  filename: string
  path: string
  buffer: Buffer
}

export interface JWTPayload {
  id: string
  phone: string
  role: string
  jti: string
  third_party_id: string
}
