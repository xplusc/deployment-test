/*
 * API sub-router for photos collection endpoints.
 */

const { Router } = require('express')
const { unlink } = require('node:fs')
const { ObjectId } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { validateAgainstSchema } = require('../lib/validation')
const {
    PhotoSchema,
    getPhotoById,
    savePhotoFile
} = require('../models/photo')

const { upload } = require('../lib/upload')

const router = Router()

/*
 * POST /photos - Route to create a new photo.
 */
router.post('/', upload.single('image'), async (req, res, next) => {
    console.log('  -- req.file:', req.file)
    console.log('  -- req.body:', req.body)
    if (!req.file) {
        res.status(400).send({
            error: 'Invalid file'
        })
        return
    }
    if (!validateAgainstSchema(req.body, PhotoSchema)) {
        res.status(400).send({
            error: 'Request body is not a valid photo object'
        })
        return
    }
    const photo = {
        contentType: req.file.mimetype,
        filename: req.file.filename,
        path: req.file.path,
        businessId: req.body.businessId,
        caption: req.body.caption
    }
    try {
        const id = await savePhotoFile(photo)

        // Delete the now duplicate photo file
        unlink(photo.path, (err) => {
            if (err) throw err
            console.log('== Deleted photo from file structure')
        })

        const extension = (photo.filename.split('.'))[1]
        const filename = `${id}.${extension}`

        const db = getDbReference()
        const photosFiles = db.collection('photos.files')
        photosFiles.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { "filename": filename } }
        )

        res.status(201).send({
            id: id
        })
    } catch (err) {
        next(err)
    }
})

/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const photo = await getPhotoById(req.params.id)
        console.log('== photo:', photo)
        if (photo) {
            const resBody = {
                _id: photo._id,
                filename: photo.filename,
                contentType: photo.metadata.contetType,
                businessId: photo.metadata.businessId,
                caption: photo.metadata.caption,
                url: `/media/photos/${photo.filename}`
            }
            res.status(200).send(resBody)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

module.exports = router
