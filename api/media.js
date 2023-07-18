/*
 * API sub-router for media files endpoints.
 */

const { Router } = require('express')

const {
    getPhotoDownloadStreamByFilename
} = require('../models/photo')

const router = Router()

/*
 * GET /media/photos/:filename - Route to download a photo file.
 */
router.get('/photos/:filename', async (req, res, next) => {
    getPhotoDownloadStreamByFilename(req.params.filename)
        .on('error', function (err) {
            if (err.code === 'ENOENT') {
                next()
            } else {
                next(err)
            }
        })
        .on('file', function (file) {
            res.status(200).type(file.metadata.contentType)
        })
        .pipe(res)
})

module.exports = router
