import { BadRequestException } from '@nestjs/common'

type validFileExtension = 'png' | 'jpg' | 'jpeg'
type validFileMimeType = 'image/png' | 'image/jpg' | 'image/jpeg'

const _validFileExtensions: validFileExtension[] = ['jpeg', 'png', 'jpg']
const validFileMimeTypes: validFileMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/jpg',
]

export const saveImageHelper = {
  //   filename: (req, file, cb) => {
  //     const fileExtension: string = path.extname(file.originalname);
  //     // const fileName: string = path.basename(file.originalname) + +fileExtension;
  //   },
  limits: {
    // TODO: Change this line after compression
    fileSize: 15000000, // 150 KB for a 1080x1080 JPG 90
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes: validFileMimeType[] = validFileMimeTypes
    allowedMimeTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(
          new BadRequestException(
            'File must be a png, jpg/jpeg',
            'Validation Failed',
          ),
          false,
        )
  },
}
