import { HttpStatus, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { v4 as uuid } from 'uuid'
import { WaffleRequestStatus } from '../shared/enums/common.enum'
import { ApiException } from '../shared/exceptions/api.exception'
import {
  WaffleResponse,
  WaffleSuccessCreateResponse,
  WaffleSuccessResponse,
} from '../shared/interfaces/common.interface'
import { CreateNoteDTO } from './note.dto'
import { Note, NoteDocument } from './note.schemas'

@Injectable()
export class NoteService {
  constructor(
    @InjectModel(Note.name, 'sharedConnection')
    private readonly noteModel: Model<NoteDocument>,
  ) {}

  public async getNotes(diagnosis_id: string): Promise<WaffleResponse> {
    const notes: Array<NoteDocument> = await this.noteModel
      .find({ diagnosis_id })
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (!notes) {
      throw new ApiException(
        `Notes not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const result: WaffleSuccessResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: notes.map((o) => {
        return {
          id: o.id,
          diagnosis_id: o.diagnosis_id,
          note: o.note,
          x1: o.x1,
          x2: o.x2,
          channel: o.channel,
          created_at: o.created_at,
        }
      }),
    }
    return Promise.resolve(result)
  }

  public async getAllNotes(): Promise<WaffleResponse> {
    const notes: Array<NoteDocument> = await this.noteModel
      .find({})
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (!notes) {
      throw new ApiException(
        `notes not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const result: WaffleSuccessResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: notes.map((o) => {
        return {
          diagnosis_id: o.diagnosis_id,
          note: o.note,
        }
      }),
    }

    return Promise.resolve(result)
  }

  public async createNote(body: CreateNoteDTO): Promise<WaffleResponse> {
    const create_data = {
      id: uuid(),
      diagnosis_id: body.diagnosis_id,
      x1: body.x1,
      x2: body.x2,
      channel: body.channel,
      note: body.note,
    }

    const model = new this.noteModel(create_data)
    await model.save().catch(() => {
      throw new ApiException(
        `PROCESS_FAILED`,
        WaffleRequestStatus.PROCESS_FAILED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    })

    const result: WaffleSuccessCreateResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: { create_counts: 1, datas: [{ note_id: model.id }] },
    }

    return Promise.resolve(result)
  }

  public async modifyNote(body: CreateNoteDTO): Promise<WaffleResponse> {
    const note: NoteDocument = await this.noteModel
      .findOneAndUpdate(
        {
          id: body.id,
        },
        {
          x1: body.x1,
          x2: body.x2,
          channel: body.channel,
          note: body.note,
        },
      )
      .catch(() => {
        throw new ApiException(
          `PROCESS_FAILED`,
          WaffleRequestStatus.PROCESS_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
        )
      })

    if (!note) {
      throw new ApiException(
        `note not found`,
        WaffleRequestStatus.OBJECT_NOT_EXISTED,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }

    const result: WaffleSuccessResponse = {
      code: WaffleRequestStatus.SUCCESS,
      data: {
        id: note.id,
        diagnosis_id: note.diagnosis_id,
      },
    }
    return Promise.resolve(result)
  }

  public async deleteNote(id: string): Promise<WaffleResponse> {
    try {
      await this.noteModel.deleteOne({ id })
      return {
        code: WaffleRequestStatus.SUCCESS,
        data: {},
      }
    }
    catch {
      return {
        code: WaffleRequestStatus.PROCESS_FAILED,
        data: { message: 'Deletion failed!' },
      }
    }
  }
}
