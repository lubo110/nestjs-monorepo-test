import { InjectQueue } from '@nestjs/bull'
import { Injectable } from '@nestjs/common'
import { JobOptions, Queue } from 'bull'
import { ClsService } from 'nestjs-cls'
import { IPredictionMessage } from '../../comment/comment.interface'
import { JOB_NAMES, QUEUE_NAMES } from '../../shared/strings'

@Injectable()
export class PredictionProducer {
  constructor(
    @InjectQueue(QUEUE_NAMES.ECG_PREDICTION) private predictionQueue: Queue,
    private readonly cls: ClsService,
  ) {}

  async createJob(message: IPredictionMessage, _opts?: JobOptions) {
    const job_id = this.cls.get('req_id')
    await this.predictionQueue.add(JOB_NAMES.ECG_PREDICTION, message, {
      jobId: job_id,
    })
  }
}
