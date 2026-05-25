import { HttpStatus, Inject, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { Model } from 'mongoose'
import { appConfig, AppConfig } from '@incare/config/index'
import { AiResponse } from '../ai/processor/diagnosis_processor.interface'
import { AnomalyDocument } from '../anomaly/anomaly.schemas'
import { AnomalyService } from '../anomaly/anomaly.service'
import { Measure, MeasureDocument } from '../measures/measure.schemas'
import { ModelDetailsService } from '../model_details/model_details.service'
import { ModelsInfoService } from '../models_Info/models_Info.service'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import { WaffleResponse } from '../shared/interfaces/common.interface'

@Injectable()
export class CoreService {
  constructor(
    @InjectModel(Measure.name, 'sharedConnection')
    private readonly measureModel: Model<MeasureDocument>,
    private readonly modelsInfoService: ModelsInfoService,
    private readonly modelDetailService: ModelDetailsService,
    private readonly anomalyService: AnomalyService,
    @Inject(appConfig.KEY)
    private readonly config: AppConfig,
  ) { }

  /***
   * Machine Learning requests
   */
  public async getAnomaliesByModelName(
    model_name: string,
    diagnosis_id: string,
    version: string,
  ): Promise<WaffleResponse<AiResponse>> {
    const modelsInfo = await this.modelsInfoService.getModelsInfo()

    // get a list of model names
    const trained_models = await this.modelDetailService.getTrainedModels(true)
    const final_models: string[] = trained_models.map(
      model_detail => model_detail.model_name,
    )

    let checked_model_name = ''
    if (model_name === 'default') {
      checked_model_name = modelsInfo.default
    }
    else {
      checked_model_name = model_name
    }
    const modelDetail = await this.modelDetailService.getModelDetailsByName(
      checked_model_name,
    )

    const saved_in_db: AnomalyDocument = await this.anomalyService.getAnomaly(
      checked_model_name,
      diagnosis_id,
    )

    if (!saved_in_db) {
      const config: AxiosRequestConfig = {
        url: modelDetail.url,
        method: 'post',
        headers: {
          'Authorization': `Bearer ${process.env[modelDetail.authorization]}`,
          'Content-Type': 'application/json',
        },
        data: {
          diagnosis_id,
          env: this.config.runEnv,
          version,
        },
        timeout: 0,
        responseType: 'json',
      }
      // Handle 503 Service Unavailable for request to Azure Web Service
      if (final_models.includes(checked_model_name)) {
        axios({
          url: modelDetail.url,
          method: 'options',
        })
      }
      return axios(config)
        .then(async (response: AxiosResponse<any>) => {
          let result,
            start_end_peak,
            // message: string,
            retake_measurement: number,
            //  interpretation: any,
            model_name: string

          if (!final_models.includes(checked_model_name)) {
            const response_data = JSON.parse(response.data)
            result = response_data.result.map((lead) => {
              return lead.map((beat) => {
                return Number.parseInt(beat, 10)
              })
            })
            start_end_peak = response_data.start_end_peak.map((lead) => {
              return lead.map((beat) => {
                return beat.map((x) => {
                  return Number.parseInt(x, 10)
                })
              })
            })
            // add new field
            //  message = response_data.message
            retake_measurement = response_data.retake_measurement
            //  interpretation = response_data.interpretation
            model_name = response_data.model_name
          }
          else {
            result = response.data.data.result
            start_end_peak = response.data.data.start_end_peak
            // add new field
            //  message = response.data.data.message
            retake_measurement = response.data.data.retake_measurement
            //  interpretation = response.data.data.interpretation
            model_name = response.data.data.model_name
          }

          await this.anomalyService.saveAnomaly(
            checked_model_name,
            diagnosis_id,
            result,
            start_end_peak,
            retake_measurement,
          )
          return {
            code: WaffleRequestStatus.SUCCESS,
            data: {
              result,
              start_end_peak,
              retake_measurement,
              model_name,
              interpretation: response.data.data.interpretation,
            },
          }
        })
        .catch((error) => {
          return { code: WaffleRequestStatus.ERROR, data: error }
        })
    }
    else {
      const { result, start_end_peak, retake_measurement, model_name }
        = saved_in_db
      return {
        code: WaffleRequestStatus.SUCCESS,
        data: {
          result,
          start_end_peak,
          retake_measurement,
          model_name,
        },
      }
    }
  }

  public async deleteSavedAnomalyResult(
    model_name: string,
    diagnosis_id: string,
  ): Promise<WaffleResponse> {
    await this.anomalyService.deleteAnomaly(model_name, diagnosis_id)

    return {
      code: WaffleRequestStatus.SUCCESS,
      data: {},
      message: `The anomaly result [${diagnosis_id}][${model_name}] has been deleted `,
    }
  }

  private get_signal(peaks, measurements, beat_window) {
    const start_end_peak = []
    const mlisig = []
    const mlisig_adjusted = []
    const size = beat_window / 4
    const f_samp = 250 // Hz sampling rate
    const half_sample_window = (f_samp * beat_window) / (2 * 1000)
    peaks.forEach((p) => {
      const i_start = p - half_sample_window
      const i_end = p + half_sample_window
      start_end_peak.push([i_start, i_end])
    })
    start_end_peak.forEach((e) => {
      mlisig.push(measurements[0].raw_datas[(e[0], e[1])])
      mlisig.push(measurements[1].raw_datas[(e[0], e[1])])
    })
    mlisig.forEach((s) => {
      if (s.length < size) {
        mlisig_adjusted.push(s + Array.from({ length: size - s.length }).fill(0))
      }
      if (s.length > size) {
        mlisig_adjusted.push(s.slice(0, size))
      }
      if (s.length === size) {
        mlisig_adjusted.push(s)
      }
    })
    return [mlisig_adjusted, start_end_peak]
  }

  public async getAnomaliesWithAutoencoder(
    version: string,
    diagnosis_id: string,
  ): Promise<WaffleResponse> {
    // const modelsInfo: IModelsInfo =
    //   await self.modelsInfoService.getModelsInfo();

    const saved_in_db: AnomalyDocument = await this.anomalyService.getAnomaly(
      `autoencoder:${version}`,
      diagnosis_id,
    )

    if (!saved_in_db) {
      //
      const measures: Array<MeasureDocument> = await this.measureModel
        .find({ diagnosis_id })
        .catch(() => {
          throw new ApiException(
            'PROCESS_FAILED',
            WaffleRequestStatus.PROCESS_FAILED,
            HttpStatus.INTERNAL_SERVER_ERROR,
          )
        })

      const peaks = measures[0].peak_indexs
      const measurements: any = measures.map(measure => measure.values)
      const signal = this.get_signal(peaks, measurements, 500)
      // flatten
      const values = signal.reduce((acc, val) => acc.concat(val), [])
      const max = Math.max.apply(null, values)
      const min = Math.min.apply(null, values)
      // normalize
      const normalized_signal = signal.map((x) => {
        return x.map((y) => {
          return (y - min) / (max - min)
        })
      })

      const data = { instances: normalized_signal }

      const config: AxiosRequestConfig = {
        url: 'http://localhost:8501/v1/models/autoencoder:predict',
        method: 'post',
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(data),
      }

      // Handle 503 Service Unavailable for request to Azure Web Service
      return axios(config)
        .then(async (response: AxiosResponse<any>) => {
          const result = response.data.predictions
          const start_end_peak = signal[1]

          await this.anomalyService.saveAnomaly(
            `autoencoder${version}`,
            diagnosis_id,
            result,
            start_end_peak,
          )
          return {
            code: WaffleRequestStatus.SUCCESS,
            data: {
              result,
              start_end_peak,
            },
          }
        })
        .catch((error) => {
          return { code: WaffleRequestStatus.ERROR, data: error }
        })
    }
    else {
      return {
        code: WaffleRequestStatus.SUCCESS,
        data: {
          result: saved_in_db.result,
          start_end_peak: saved_in_db.start_end_peak,
        },
      }
    }
  }

  // public async getAnomalies(diagnosis_id: string): Promise<WaffleResponse> {
  //   const config: AxiosRequestConfig = {
  //     url: process.env["ML_API_URL"] + "/anomaly/",
  //     method: "post",
  //     headers: { Authorization: "" },
  //     data: {
  //       diagnosis_id: diagnosis_id
  //     },
  //     timeout: 5000,
  //     responseType: "json"
  //   };
  //   return axios(config)
  //     .then((response: AxiosResponse<any>) => {
  //       return { code: WaffleRequestStatus.SUCCESS, data: response.data };
  //     })
  //     .catch(error => {
  //       return { code: WaffleRequestStatus.ERROR, data: error };
  //     });
  // }
}
