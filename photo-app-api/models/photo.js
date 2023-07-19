/*
 * Photo schema and data accessor methods.
 */

const { ObjectId, GridFSBucket } = require('mongodb')
const fs = require('node:fs')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
    businessId: { required: true },
    caption: { required: false }
}
exports.PhotoSchema = PhotoSchema

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
    photo = extractValidFields(photo, PhotoSchema)
    photo.businessId = ObjectId(photo.businessId)
    const db = getDbReference()
    const collection = db.collection('photos')
    const result = await collection.insertOne(photo)
    return result.insertedId
}
exports.insertNewPhoto = insertNewPhoto

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
    const db = getDbReference()
    //const collection = db.collection('photos.files')
    const bucket = new GridFSBucket(db, { bucketName: 'photos' })
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const results = await bucket.find({ _id: new ObjectId(id) })
            .toArray()
        console.log('== results:', results)
        return results[0]
    }
}
exports.getPhotoById = getPhotoById

/*
 * Save a photo into the DB using GridFS
 */
async function savePhotoFile(photo) {
    return new Promise(function (resolve, reject) {
        const db = getDbReference()
        const bucket = new GridFSBucket(db, { bucketName: 'photos' })
        const metadata = {
            contentType: photo.contentType,
            businessId: new ObjectId(photo.businessId),
            caption: photo.caption
        }
        const extension = (photo.filename.split('.'))[1]
        const uploadStream = bucket.openUploadStream(
            photo.filename,
            { metadata: metadata }
        )
        fs.createReadStream(photo.path).pipe(uploadStream)
            .on('error', function (err) {
                reject(err)
            })
            .on('finish', function (result) {
                console.log('== Upload success, result:', result)
                resolve(result._id)
            })
    })
}
exports.savePhotoFile = savePhotoFile

function getPhotoDownloadStreamByFilename(filename) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'photos' })
    return bucket.openDownloadStreamByName(filename)
}
exports.getPhotoDownloadStreamByFilename = getPhotoDownloadStreamByFilename