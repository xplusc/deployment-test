const multer = require('multer')
const crypto = require('node:crypto')

const imageTypes = {
    'image/jpeg': 'jpg',
    'image/png':  'png'
}
exports.imageTypes = imageTypes

const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/../uploads`,
        filename: (req, file, callback) => {
            const filename  = crypto.pseudoRandomBytes(16).toString('hex')
            const extention = imageTypes[file.mimetype]
            callback(null, `${filename}.${extention}`)
        }
    }),
    fileFilter: (req, file, callback) => {
        callback(null, !!imageTypes[file.mimetype])
    }
})
exports.upload = upload