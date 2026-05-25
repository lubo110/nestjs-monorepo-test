import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import * as moment from 'moment'
import { Model, Query } from 'mongoose'
import { retry } from 'rxjs'
import { v4 as uuid } from 'uuid'
import { Anomaly, AnomalyDocument } from '../anomaly/anomaly.schemas'
import { AnomalyService } from '../anomaly/anomaly.service'
import { Evaluation, EvaluationDocument } from '../evaluation/evaluation.schemas'
import { CreateMeasureDTO } from '../measures/measure.dto'
import { ECGValue, Measure, MeasureDocument } from '../measures/measure.schemas'
import { Note, NoteDocument } from '../notes/note.schemas'
import { OrderByType, Roles, WaffleRequestStatus } from '../shared/enums/common.enum'
import { PredictionStatus } from '../shared/enums/diagnosis.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import {
  JWTPayload,
  WaffleResponse,
  WaffleSuccessCreateResponse,
  WaffleSuccessResponse,
} from '../shared/interfaces/common.interface'
import { UserDocument } from '../users/user.schemas'
import { UserService } from '../users/user.service'
import {
  CountByDeviceIdsDTO,
  CreateDiagnosisDTOV2,
  DeviceIdsDiagnosesQueryDTO,
  QueryDiagnosisCalDTO,
  QueryDiagnosisDTOV2,
  QueryDisableDiagnosisDTO,
} from './diagnosis.dto'
import { Diagnosis, DiagnosisDocument } from './diagnosis.schemas'

type LeadName = 'L1' | 'L2' | 'L3' | 'aVR' | 'aVL' | 'aVF'
type LeadMap = Record<LeadName, number[]>
@Injectable()
export class DiagnosisService {
  private response: WaffleResponse

  static readonly QUERY_NUMBER: number = 1000

  constructor(
    @InjectModel(Diagnosis.name, 'sharedConnection')
    private readonly diagnosisModel: Model<DiagnosisDocument>,
    @InjectModel(Measure.name, 'sharedConnection')
    private readonly measureModel: Model<MeasureDocument>,
    @InjectModel(Anomaly.name, 'sharedConnection')
    private readonly anomalyModel: Model<AnomalyDocument>,
    @InjectModel(Evaluation.name, 'sharedConnection')
    private readonly evalModel: Model<EvaluationDocument>,
    @InjectModel(Note.name, 'sharedConnection')
    private readonly noteModel: Model<NoteDocument>,
    private readonly anomalyService: AnomalyService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async createDiagnosis(body: CreateDiagnosisDTOV2): Promise<WaffleResponse> {
    const create_data = {
      version: 'v1',
      enabled: true,
      diagnosis_id: uuid(),
      medical_id: body.medical_id,
      diagnosis_type: body.type,
      device_id: body.device_id,
      firmware_version: body.firmware_version,
      mac_address: body.mac_address,
      gain: body.gain,
      latitude: body.latitude,
      longitude: body.longitude,
      measure_times: body.measure_times,
      measure_type: body.measure_type,
      user_id: body.user_id,
      name: body.name,
      age: body.age,
      gender: body.gender,
      phone: body.phone,
      // 新增medical_record_number
      medical_record_number: body.medical_record_number
        ? body.medical_record_number
        : '',
      create_date: moment(body.create_date),
      update_date: moment(body.create_date),
      start_time: moment(body.start_time),
      end_time: moment(body.end_time),
    }

    const model = new this.diagnosisModel(create_data)
    await model.save().catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    const result: WaffleSuccessCreateResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: {
        create_counts: 1,
        datas: [{ diagnosis_id: create_data.diagnosis_id }],
      },
    }
    return Promise.resolve(result)
  }

  public async disableDiagnosis(
    diagnosis_id: string,
    enabled: boolean,
  ): Promise<WaffleResponse> {
    const diagnosis: DiagnosisDocument = await this.diagnosisModel
      .findOneAndUpdate(
        {
          diagnosis_id,
        },
        { enabled },
      )
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (!diagnosis) {
      throw new ApiException(
        `diagnosis not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const measures: Array<MeasureDocument> = await this.measureModel
      .find({ diagnosis_id })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    measures.forEach(async (measure) => {
      measure.enabled = enabled
      await measure.save()
    })

    return {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `The diagnosis[${diagnosis_id}] has been ${
        enabled ? 'enabled' : 'disabled'
      }`,
    }
  }

  public async deleteDiagnosesByPhone(phone: string): Promise<WaffleResponse> {
    await this.diagnosisModel.deleteMany({ phone }).catch(() => {
      throw new ApiException(
        'User deleted, but diagnoses deletion failed!',
        WaffleRequestStatus.ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    const success: WaffleSuccessResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: { message: 'Deletion complete!' },
    }
    return Promise.resolve(success)
  }

  async getDiagnosisCal(data: QueryDiagnosisCalDTO) {
    const { user_id, start_date, end_date, medical_record_number, order_by }
      = data
    const sort = OrderByType.ASC === order_by ? 1 : -1
    const filter: any = {
      enabled: true,
      user_id,
      create_date: { $gte: start_date, $lt: end_date },
    }

    if (medical_record_number && medical_record_number.trim() !== '') {
      filter.medical_record_number = medical_record_number
    }

    const diagnoses: Array<DiagnosisDocument> = await this.diagnosisModel
      .find(filter)
      .sort({ create_date: sort })
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    // find all diagnoses IDs
    const IDs = diagnoses.map(({ diagnosis_id }) => diagnosis_id)

    // find all measures matching diagnoses IDs
    const unsortedMeasures: Array<MeasureDocument> = await this.measureModel
      .find(
        {
          diagnosis_id: {
            $in: IDs,
          },
        },
        { diagnosis_id: 1, heart_rate: 1, stress: 1 },
      )
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    const measures: Array<MeasureDocument> = []
    diagnoses.forEach((diagnosis) => {
      const measure: MeasureDocument = unsortedMeasures.find(
        item => item.diagnosis_id === diagnosis.diagnosis_id,
      )
      if (measure) {
        measures.push(measure)
      }
      else {
        measures.push(null)
      }
    })

    return {
      code: WaffleRequestStatus.SUCCESS,
      data: diagnoses.map((diagnosis, index) => {
        const heartRate = measures[index]
          ? measures[index].heart_rate
            ? measures[index].heart_rate
            : [0]
          : [0]

        // average of last 10 stress (last 10 seconds),
        const stress = measures[index]
          ? measures[index].stress
            ? measures[index].stress.slice(
                Math.floor((measures[index].stress.length / 3) * 2),
                measures[index].stress.length,
              )
            : [0]
          : [0]
        const avgStress = stress.length
          ? Math.floor(stress.reduce((acc, cur) => acc + cur) / stress.length)
          : 0

        return {
          user_id: diagnosis.user_id,
          diagnosis_id: diagnosis.diagnosis_id,
          create_date: diagnosis.create_date,
          hr_last: heartRate[heartRate.length - 1],
          stress_last: avgStress,
          medical_record_number: diagnosis.medical_record_number,
          prediction_result: diagnosis.prediction_result || [],
          prediction_status: diagnosis.prediction_status,
        }
      }),
    }
  }

  async deletePredictionResult(diagnosis_id: string) {
    await this.updateDiagnosis(diagnosis_id, {
      prediction_result: [],
      prediction_model: '',
      prediction_status: PredictionStatus.Initial,
    }).catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    return (this.response = {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `The prediction result of diagnosis[${diagnosis_id}] has been deleted successfully`,
    })
  }

  async findUserLatestDiagnosisId(user_id: string) {
    try {
      const diagnosis = await this.diagnosisModel
        .findOne({ enabled: true, user_id })
        .sort({ _id: -1 })

      if (!diagnosis) {
        throw new ApiException(
          `Diagnosis not found`,
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: { diagnosis_id: diagnosis.diagnosis_id },
      })
    }
    catch (e) {
      throw e
    }
  }

  async updateDiagnosis(diagnosis_id: string, updateObj: any) {
    const foundDiagnosis = await this.diagnosisModel.findOne({ diagnosis_id })
    if (!foundDiagnosis) {
      throw new ApiException(
        `Failed to update user's diagnosis`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    await this.diagnosisModel
      .updateOne({ diagnosis_id }, { $set: updateObj })
      .catch((e) => {
        throw new ApiException(
          `Update failed for diagnosis id: ${diagnosis_id}. Error: ${e.message}`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })
  }

  async handleUpdateDiagnosis(
    diagnosis_id: string,
    updateObj: any,
  ): Promise<WaffleResponse> {
    await this.updateDiagnosis(diagnosis_id, updateObj)
    return {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `The diagnosis[${diagnosis_id}] has been updated successfully`,
    }
  }

  public async queryDiagnosisByRange(body: any): Promise<WaffleResponse> {
    let diagnoses: Array<DiagnosisDocument> = []

    diagnoses = await this.diagnosisModel
      .find({
        enabled: true,
        medical_id: body.medical_id || '01',
        create_date: { $lte: body.end, $gte: body.start },
      })
      .sort({ create_at: -1 })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    const result: WaffleSuccessResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: diagnoses.map((diagnosis) => {
        return {
          diagnosis_id: diagnosis.diagnosis_id,
          diagnosis_type: diagnosis.diagnosis_type,
          measure_times: diagnosis.measure_times,
          measure_type: diagnosis.measure_type,
          user_id: diagnosis.user_id,
          create_date: diagnosis.create_date,
        }
      }),
    }
    return Promise.resolve(result)
  }

  public async getAllDisabledDiagnosis(body: QueryDisableDiagnosisDTO) {
    const { start_number, end_number, search_uid, search_phone }
      = body
    const filter: any = {
      enabled: false,
    }
    const query_num = end_number - start_number + 1
    const skip_num = start_number - 1

    if (search_phone) {
      const user = await this.userService.findByIdentifier(search_phone)
      if (user) {
        filter.user_id = user.id
      }
      else {
        filter.user_id = null
      }
    }

    if (search_uid && search_uid.length > 0) {
      filter.user_id = search_uid
    }

    try {
      const diagnoses_counts: number = await this.diagnosisModel.countDocuments(
        filter,
      )

      const diagnoses: any[] = await this.diagnosisModel
        .find(filter)
        .populate({ path: 'user', select: 'phone' })
        .limit(query_num)
        .skip(skip_num)
        .sort({ _id: -1 })

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {
          counts: diagnoses_counts,
          diagnoses: diagnoses.map(
            ({
              diagnosis_id,
              user_id,
              device_id,
              create_date,
              enabled,
              user,
            }) => {
              return {
                diagnosis_id,
                user_id,
                phone: user?.phone || '',
                device_id,
                create_date,
                enabled,
              }
            },
          ),
        },
      })
    }
    catch (e) {
      throw new ApiException(
        `PROCESS_FAILED:${e}`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  public async removeDisableDiagnosis(diagnosis_id: string) {
    try {
      const diagnosis: DiagnosisDocument = await this.diagnosisModel.findOne({
        diagnosis_id,
        enabled: false,
      })
      if (!diagnosis) {
        throw new ApiException(
          `[diagnosis_id：${diagnosis_id}] not found`,
          WaffleRequestStatus.OBJECT_NOT_EXISTED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }

      // anomalies
      const anomalies: AnomalyDocument[] = await this.anomalyModel.find({
        diagnosis_id,
      })
      if (anomalies.length > 0) {
        await this.anomalyModel.deleteMany({ diagnosis_id })
      }

      // evaluations
      const evaluations: EvaluationDocument[] = await this.evalModel.find({
        diagnosis_id,
      })
      if (evaluations.length > 0) {
        await this.evalModel.deleteMany({ diagnosis_id })
      }

      // notes
      const notes: NoteDocument[] = await this.noteModel.find({
        diagnosis_id,
      })
      if (notes.length > 0) {
        await this.noteModel.deleteMany({ diagnosis_id })
      }

      // measures
      const measures: MeasureDocument[] = await this.measureModel.find({
        diagnosis_id,
      })
      if (measures.length > 0) {
        await this.measureModel.deleteMany({ diagnosis_id })
      }

      // diagnosis
      if (diagnosis) {
        await diagnosis.deleteOne()
      }

      return (this.response = {
        code: WaffleRequestStatus.SUCCESS,
        data: {},
        message: `The diagnosis[${diagnosis_id}] has been deleted successfully`,
      })
    }
    catch (e) {
      throw new ApiException(
        `PROCESS_FAILED:${e}`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  private async getDiagnosisQueryObject(
    body: QueryDiagnosisDTOV2,
    user: JWTPayload,
  ): Promise<any> {
    const {
      medical_id,
      enabled,
      tag_value,
      search_phone,
      diagnosis_id,
      medical_record_number,
    } = body
    // base query object
    const queryObject: any = {
      enabled: !!enabled,
      medical_id,
    }

    if (diagnosis_id) {
      queryObject.diagnosis_id = diagnosis_id
    }

    if (medical_record_number) {
      queryObject.medical_record_number = medical_record_number
    }

    // for admin user
    let diagnosis_IDs: Array<string> = []
    if (Roles.Admin === user.role) {
      let search_uid = ''
      // 搜尋特定user id
      if (search_phone) {
        const user = await this.userService.findUserByPhoneInternal(
          search_phone,
        )
        search_uid = user ? user.id : null
        queryObject.user_id = search_uid
      }

      // 搜尋有tag的diagnosis
      if (tag_value) {
        diagnosis_IDs = await this.getDiagnosisIDsWithTagV2(
          search_uid,
          tag_value,
          !!enabled,
          diagnosis_id,
          medical_record_number,
        )
        queryObject.diagnosis_id = { $in: diagnosis_IDs }
      }
    }
    else {
      // for normal user
      queryObject.user_id = user.id
      // 搜尋有tag的diagnosis
      if (tag_value) {
        const diagnosis_IDs: Array<string>
          = await this.getDiagnosisIDsWithTagV2(
            user.id,
            tag_value,
            !!enabled,
            diagnosis_id,
            medical_record_number,
          )
        queryObject.diagnosis_id = { $in: diagnosis_IDs }
      }
    }
    return queryObject
  }

  public async queryDiagnosisByAdmin(
    body: QueryDiagnosisDTOV2,
    user: JWTPayload,
  ): Promise<WaffleSuccessResponse<{ counts: number, diagnoses: any }>> {
    const query = await this.getDiagnosisQueryObject(body, user)
    const counts = await this.diagnosisModel.countDocuments(query)
    const diagnosisQuery = this.diagnosisModel.find(query)
    const diagnoses: DiagnosisDocument[] = await this.handleQuery(
      diagnosisQuery,
      body.start_number,
      body.end_number,
    )
    const result = await this.handleDiagnosisResData(counts, diagnoses)

    return Promise.resolve(result)
  }

  private async getDiagnosisIDsWithTagV2(
    search_uid: string,
    tag_value: string,
    enable: boolean,
    diagnosis_id?: string,
    medical_record_number?: string,
  ): Promise<string[]> {
    let diagnosis_IDs: Array<string> = []
    const pipelines: any[] = [
      { $group: { _id: '$diagnosis_id', notes: { $addToSet: '$note' } } },
    ]

    // 搜尋特定tag_value
    if (tag_value) {
      pipelines.push({
        $match: {
          notes: { $regex: tag_value, $options: 'i' },
        },
      })
    }

    pipelines.push(
      {
        $lookup: {
          localField: '_id',
          foreignField: 'diagnosis_id',
          from: 'diagnoses',
          as: 'diagnosis',
        },
      },
      { $unwind: '$diagnosis' },
      {
        $match: {
          'diagnosis.enabled': enable,
        },
      },
    )

    // 如果有傳入特定search_uid，只搜尋特定user id
    if (diagnosis_id) {
      pipelines.push({ $match: { 'diagnosis.diagnosis_id': diagnosis_id } })
    }

    // 如果有傳入特定search_uid，只搜尋特定user id
    if (search_uid) {
      pipelines.push({ $match: { 'diagnosis.user_id': search_uid } })
    }

    // 如果有傳入特定medical_record_number，只搜尋特定medical_record_number
    if (medical_record_number) {
      pipelines.push({
        $match: { 'diagnosis.medical_record_number': medical_record_number },
      })
    }

    pipelines.push(
      // 根據 create_date 降序排序
      {
        $sort: {
          'diagnosis.create_date': -1,
        },
      },
      { $project: { 'diagnosis.user_id': 1, 'notes': 1 } },
      {
        $group: {
          _id: null,
          diagnoses_ids: { $push: '$_id' },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0 } },
    )

    const diagnosisIdsAndCount = await this.noteModel
      .aggregate(pipelines)
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (diagnosisIdsAndCount && diagnosisIdsAndCount.length > 0) {
      diagnosis_IDs = diagnosisIdsAndCount[0].diagnoses_ids
    }

    return diagnosis_IDs
  }

  private async handleDiagnosisResData(
    counts: number,
    diagnoses: DiagnosisDocument[],
  ) {
    const diagnosisValues: Array<ECGValue> = []
    const measures: Array<MeasureDocument> = []
    let IDs: Array<string> = []
    let user_IDs: Array<string> = []

    const initial_response: WaffleSuccessResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: {
        counts: 0,
        diagnoses: [],
      },
    }

    // If the number of diagnoses is 0, return the default result directly
    if (diagnoses.length === 0) {
      return initial_response
    }

    IDs = diagnoses.map(diagnosis => diagnosis.diagnosis_id)

    // prepare channel 2 values for response
    const unsortedMeasures: Array<MeasureDocument> = await this.measureModel
      .find({
        diagnosis_id: {
          $in: IDs,
        },
      })
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    // use the first available measurement since mobile is 30 seconds max
    const indexOneMeasures = unsortedMeasures.filter(
      item => item.measure_index === 1,
    )
    diagnoses.forEach((diagnosis) => {
      const measure = indexOneMeasures.filter(
        item => item.diagnosis_id === diagnosis.diagnosis_id,
      )
      if (measure.length !== 0) {
        // channel 1 data is used for preview data
        diagnosisValues.push(measure[0].values[0])
        measures.push(measure[0])
      }
      else {
        diagnosisValues.push(null)
        measures.push(null)
      }
    })

    // find all notes matching diagnoses IDs
    const notes: Array<NoteDocument> = await this.noteModel
      .find({
        diagnosis_id: {
          $in: IDs,
        },
      })
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    // strip out relevant properties
    const notesEssential: Array<{
      diagnosis_id: string
      note: string
    }> = notes.map((note) => {
      return {
        diagnosis_id: note.diagnosis_id,
        note: note.note,
      }
    })

    // reduce notes to unique diagnosis IDs
    const notesEssentialUnique: Array<{
      diagnosis_id: string
      notes: Array<string>
    }> = []
    const collectedIds: Array<string> = []
    notesEssential.forEach((note) => {
      const resultIndex = collectedIds.indexOf(note.diagnosis_id)
      if (resultIndex >= 0) {
        // ID already collected; add new note entry
        notesEssentialUnique[resultIndex].notes.push(note.note)
      }
      else {
        // ID not found; establish new note array
        notesEssentialUnique.push({
          diagnosis_id: note.diagnosis_id,
          notes: [note.note],
        })
        collectedIds.push(note.diagnosis_id)
      }
    })

    // get all unique diagnoses IDs containing notes
    const uniqueIDs: Array<string> = notesEssentialUnique.map(
      note => note.diagnosis_id,
    )

    // create bijection between diagnoses and notes
    const finalNotes: Array<Array<string>> = []
    diagnoses.forEach((diagnosis) => {
      const resultIndex = uniqueIDs.indexOf(diagnosis.diagnosis_id)
      if (resultIndex >= 0) {
        // remove duplicates
        const uniqueNotes = [
          ...new Set(notesEssentialUnique[resultIndex].notes),
        ]
        finalNotes.push(uniqueNotes)
      }
      else {
        finalNotes.push([])
      }
    })

    // Get a list of all users
    const diagnosisUsers: Array<UserDocument> = []
    user_IDs = diagnoses.map(diagnosis => diagnosis.user_id)
    const users: Array<UserDocument>
      = await this.userService.findUserInfoByUserIds(user_IDs)
    diagnoses.forEach((diagnosis) => {
      const res = users.find(user => diagnosis.user_id === user.id)
      if (res) {
        diagnosisUsers.push(res)
      }
      else {
        diagnosisUsers.push(null)
      }
    })

    return {
      ...initial_response,
      data: {
        counts,
        diagnoses: diagnoses.map((diagnosis, index) => {
          // 202410071005 ecg_prev web端沒有用
          // const rawData = diagnosisValues[index]
          //   ? diagnosisValues[index].raw_datas
          //   : [];

          // const bleEvents = measures[index]
          //   ? measures[index].event_detect
          //     ? measures[index].event_detect
          //     : []
          //   : [];

          const heartRate = measures[index]
            ? measures[index].heart_rate
              ? measures[index].heart_rate
              : [0]
            : [0]

          // 202410071005 ecg_prev web端沒有用
          // const blEventsCount = measures[index]
          //   ? measures[index].event_count
          //     ? measures[index].event_count
          //     : 0
          //   : 0;
          // const ecgRaw = rawData.slice(
          //   Math.floor((rawData.length / 3) * 2),
          //   rawData.length
          // );

          // average of last 10 stress (last 10 seconds),
          const stress = measures[index]
            ? measures[index].stress
              ? measures[index].stress.slice(
                  Math.floor((measures[index].stress.length / 3) * 2),
                  measures[index].stress.length,
                )
              : [0]
            : [0]
          const avgStress = stress.length
            ? Math.floor(stress.reduce((acc, cur) => acc + cur) / stress.length)
            : 0

          // set user's phone
          const user_phone = diagnosisUsers[index]
            ? diagnosisUsers[index].phone
            : null

          return {
            user_phone,
            user_id: diagnosis.user_id,
            diagnosis_id: diagnosis.diagnosis_id,
            medical_id: diagnosis.medical_id,
            diagnosis_type: diagnosis.diagnosis_type,
            synthetic: diagnosis.synthetic || false,
            measure_times: diagnosis.measure_times,
            measure_type: diagnosis.measure_type,
            gain: diagnosis.gain,
            latitude: diagnosis.latitude,
            longitude: diagnosis.longitude,
            device_id: diagnosis.device_id,
            mac_address: diagnosis.mac_address,
            create_date: diagnosis.create_date,
            start_time: diagnosis.start_time,
            end_time: diagnosis.end_time,
            // 202410071005 ecg_prev web端沒有用
            // last third of raw data (last 10 seconds)
            // ecg_prev: ecgRaw,
            // last heart rate value
            hr_last: heartRate[heartRate.length - 1],
            // average of last 10 stress (last 10 seconds),
            stress_last: avgStress,
            // 202410071005 ecg_prev web端沒有用
            // bluetooth detection events
            // event_count: blEventsCount,
            // event_detect: bleEvents,
            notes: finalNotes[index],
          }
        }),
      },
    }
  }

  private async handleQuery(
    query: Query<DiagnosisDocument[], DiagnosisDocument>,
    start_num: number,
    end_num: number,
  ): Promise<DiagnosisDocument[]> {
    try {
      const query_num = end_num - start_num + 1
      const skip_num = start_num - 1
      const result: DiagnosisDocument[] = await query
        .sort({ create_date: -1 })
        .skip(skip_num || 0)
        .limit(query_num || DiagnosisService.QUERY_NUMBER)

      return result
    }
    catch {
      throw new ApiException(
        'PROCESS_FAILED',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  public async getDiagnosis(
    diagnosis_id: string,
    include_all_channels: boolean,
  ): Promise<WaffleResponse> {
    const { diagnosis, measures } = await this.fetchDiagnosisAndMeasures(
      diagnosis_id,
    )

    // get anomaly
    let anomaly: any = {}
    if (diagnosis.prediction_model) {
      anomaly = await this.anomalyService.getAnomaly(
        diagnosis.prediction_model,
        diagnosis_id,
      )
    }

    let measurements: Array<Array<ECGValue>>
    const twoChannels = measures.map(measure => measure.values)
    if (include_all_channels) {
      measurements = this.calculateAllChannels(twoChannels)
    }
    else {
      measurements = twoChannels
    }

    const result: WaffleSuccessResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: {
        version: diagnosis.version,
        medical_id: diagnosis.medical_id,
        diagnosis_type: diagnosis.diagnosis_type,
        diagnosis_id: diagnosis.diagnosis_id,
        synthetic: diagnosis.synthetic || false,
        device_id: diagnosis.device_id,
        firmware_version: diagnosis.firmware_version,
        mac_address: diagnosis.mac_address,
        gain: diagnosis.gain,
        latitude: diagnosis.latitude,
        longitude: diagnosis.longitude,
        measure_times: diagnosis.measure_times,
        measure_type: diagnosis.measure_type,
        measures: measures.map((measure, index) => {
          // last third of raw data (last 10 seconds)
          const rawData = measure.values[0] ? measure.values[0].raw_datas : []
          const ecgRaw = rawData.slice(
            Math.floor((rawData.length / 3) * 2),
            rawData.length,
          )

          // last heart rate value
          const heartRate = measure.heart_rate ? measure.heart_rate : [0]

          // average of last 10 stress (last 10 seconds),
          const stress = measure.stress
            ? measure.stress.slice(
                Math.floor((measure.stress.length / 3) * 2),
                measure.stress.length,
              )
            : [0]
          const avgStress = stress.length
            ? Math.floor(stress.reduce((acc, cur) => acc + cur) / stress.length)
            : 0

          return {
            measure_id: measure.measure_id,
            measure_index: measure.measure_index,
            measure_counts_by_second: measure.measure_counts_by_second,
            peak_indexs: measure.peak_indexs,
            heart_rate: measure.heart_rate,
            stress: measure.stress,
            event_count: measure.event_count,
            event_detect: measure.event_detect,
            values: measurements[index],
            // last third of raw data (last 10 seconds)
            ecg_prev: ecgRaw,
            // last heart rate value
            hr_last: heartRate[heartRate.length - 1],
            // average of last 10 stress (last 10 seconds),
            stress_last: avgStress,
          }
        }),
        name: diagnosis.name,
        age: diagnosis.age,
        gender: diagnosis.gender,
        phone: diagnosis.phone,
        // 新增medical_record_number
        medical_record_number: diagnosis.medical_record_number
          ? diagnosis.medical_record_number
          : '',
        // prediction info
        prediction_result: diagnosis.prediction_result,
        prediction_status: diagnosis.prediction_status,
        prediction_model: diagnosis.prediction_model,
        anomaly: anomaly
          ? {
              result: anomaly.result,
              start_end_peak: anomaly.start_end_peak,
              model_name: anomaly.model_name,
            }
          : {},
        create_date: diagnosis.create_date,
        update_date: diagnosis.update_date,
        start_time: diagnosis.start_time,
        end_time: diagnosis.end_time,
      },
    }

    return Promise.resolve(result)
  }

  private calculateAllChannels(
    values: ECGValue[][],
  ): ECGValue[][] {
    return values.map((ecgGroup) => {
      const L1 = ecgGroup[0].raw_datas
      const L3 = ecgGroup[1].raw_datas

      // 基于 Einthoven 定律
      const L2 = L1.map((v, i) => v + L3[i])

      // 增强导联（Goldberger）
      const aVR = L1.map((v, i) => -(v + L2[i]) / 2)
      const aVL = L1.map((v, i) => v - L2[i] / 2)
      const aVF = L2.map((v, i) => v - L1[i] / 2)

      const leads: LeadMap = {
        L1,
        L2,
        L3,
        aVR,
        aVL,
        aVF,
      }

      return Object.entries(leads).map(([name, raw_datas]) => ({
        name: name as LeadName,
        raw_datas,
      }))
    })
  }

  public async provideThirdPartyECGData(
    diagnosis_id: string,
    include_all_channels: boolean,
  ) {
    const { diagnosis, measures } = await this.fetchDiagnosisAndMeasures(
      diagnosis_id,
    )

    let measurements: Array<Array<ECGValue>>
    const twoChannels = measures.map(measure => measure.values)
    if (include_all_channels) {
      measurements = this.calculateAllChannels(twoChannels)
    }
    else {
      measurements = twoChannels
    }

    const result = {
      version: diagnosis.version,
      diagnosis_id: diagnosis.diagnosis_id,
      diagnosis_type: diagnosis.diagnosis_type,
      device_id: diagnosis.device_id,
      firmware_version: diagnosis.firmware_version,
      measure_times: diagnosis.measure_times,
      measure_type: diagnosis.measure_type,
      measures: measures.map((measure, index) => {
        // last third of raw data (last 10 seconds)
        const rawData = measure.values[0] ? measure.values[0].raw_datas : []
        const ecgRaw = rawData.slice(
          Math.floor((rawData.length / 3) * 2),
          rawData.length,
        )

        // last heart rate value
        const heartRate = measure.heart_rate ? measure.heart_rate : [0]

        // average of last 10 stress (last 10 seconds),
        const stress = measure.stress
          ? measure.stress.slice(
              Math.floor((measure.stress.length / 3) * 2),
              measure.stress.length,
            )
          : [0]
        const avgStress = stress.length
          ? Math.floor(stress.reduce((acc, cur) => acc + cur) / stress.length)
          : 0

        return {
          // measure_id: measure.measure_id,
          // measure_index: measure.measure_index,
          measure_counts_by_second: measure.measure_counts_by_second,
          peak_indexs: measure.peak_indexs,
          heart_rate: measure.heart_rate,
          stress: measure.stress,
          values: measurements[index],
          // last third of raw data (last 10 seconds)
          ecg_prev: ecgRaw,
          // last heart rate value
          hr_last: heartRate[heartRate.length - 1],
          // average of last 10 stress (last 10 seconds),
          stress_last: avgStress,
        }
      }),
      // prediction info
      prediction_result: diagnosis.prediction_result,
      // prediction_status: diagnosis.prediction_status,
      prediction_model: diagnosis.prediction_model,
      create_date: diagnosis.create_date,
      update_date: diagnosis.update_date,
      start_time: diagnosis.start_time,
      end_time: diagnosis.end_time,

    }

    return result
  }

  public async createMeasure(
    diagnosis_id: string,
    body: CreateMeasureDTO,
  ): Promise<WaffleResponse> {
    for (const o of body.values) {
      if (o.raw_datas.length !== body.counts) {
        throw new ApiException(
          'OBJECT_OVER',
          WaffleRequestStatus.OBJECT_OVER,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      }
    }

    const diagnosis: DiagnosisDocument = await this.diagnosisModel
      .findOne({
        diagnosis_id,
      })
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (!diagnosis) {
      throw new ApiException(
        'diagnosis not found',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }

    const measure_counts: number = await this.measureModel
      .find({ diagnosis_id, measure_index: body.measure_index })
      .countDocuments()
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (measure_counts > 0) {
      throw new ApiException(
        'measure_counts is greater than 0',
        WaffleRequestStatus.OBJECT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const create_data = {
      version: 'v1',
      enabled: true,
      measure_id: uuid(),
      diagnosis_id,
      measure_index: body.measure_index,
      measure_counts_by_second: body.measure_counts_by_second,
      counts: body.counts,
      peak_indexs: body.peak_indexs,
      heart_rate: body.heart_rate,
      stress: body.stress,
      event_count: body.event_count,
      event_detect: body.event_detect,
      values: body.values,
    }

    const model = new this.measureModel(create_data)
    await model.save().catch(() => {
      throw new ApiException(
        'PROCESS_FAILED',
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    const result: WaffleSuccessCreateResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: {
        create_counts: 1,
        datas: [{ measure_id: create_data.measure_id }],
      },
    }

    return Promise.resolve(result)
  }

  private createQueryByDeviceIds(
    user_id: string | undefined,
    device_ids: string[],
  ) {
    const query: any = { device_id: { $in: device_ids } }
    if (user_id !== undefined && user_id?.trim() !== '') {
      query.user_id = user_id
    }
    return query
  }

  async findByDeviceIds(
    body: DeviceIdsDiagnosesQueryDTO,
  ): Promise<WaffleResponse> {
    const { user_id, device_ids } = body
    const query = this.createQueryByDeviceIds(user_id, device_ids)
    const counts = await this.diagnosisModel.countDocuments(query)
    const diagnosisQuery = this.diagnosisModel.find(query)
    const diagnoses = await this.handleQuery(
      diagnosisQuery,
      body.start_number,
      body.end_number,
    )
    return await this.handleDiagnosisResData(counts, diagnoses)
  }

  async countDocumentsByDeviceIds(
    body: CountByDeviceIdsDTO,
  ): Promise<WaffleResponse> {
    const { user_id, device_ids } = body
    const query = this.createQueryByDeviceIds(user_id, device_ids)
    const count = await this.diagnosisModel.countDocuments(query)
    return {
      code: WaffleRequestStatus.SUCCESS,
      data: {
        diagnosis_counts: count,
      },
    }
  }

  async fetchDiagnosisAndMeasures(diagnosis_id: string): Promise<{
    diagnosis: DiagnosisDocument
    measures: Array<MeasureDocument>
  }> {
    const diagnosis: DiagnosisDocument = await this.diagnosisModel
      .findOne({
        diagnosis_id,
      })
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (!diagnosis) {
      throw new ApiException(
        'OBJECT_NOT_EXISTED',
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.NOT_FOUND,
      )
    }

    const measures: Array<MeasureDocument> = await this.measureModel
      .find({ diagnosis_id })
      .catch(() => {
        throw new ApiException(
          'PROCESS_FAILED',
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    return { diagnosis, measures }
  }

  async getDiagnosisByDiagnosisId(
    diagnosis_id: string,
    enabled: boolean,
  ): Promise<DiagnosisDocument> {
    return await this.diagnosisModel.findOne({ diagnosis_id, enabled })
  }
}
