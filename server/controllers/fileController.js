
import aws from 'aws-sdk';
import fs from 'fs';

const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: "us-east-2"
});

function uploadToS3(file, folder, callback) {
    const fileStream = fs.createReadStream(file.path);
    const uploadParams = {
        Bucket: "bindifffiles",
        Key: folder + file.originalname,
        Body: fileStream
    };
    s3.upload(uploadParams, callback);
}

async function uploadFile(req, res) {
    console.log(req.body.folder);
    try {
        uploadToS3(req.file, req.body.folder, (err, data) => {
            if (err) {
                console.log(err);
                return res.status(500).send("Failed to upload file");
            }
            res.status(200).send("File uploaded successfully");
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Failed to upload file");
    }
}

async function createFolder(req, res) {
    const date = new Date() + '/';
    const params = {
        Bucket: "bindifffiles",
        Key: date
    };
    s3.putObject(params).promise();
    return res.status(200).json({
        message: "Folder created successfully",
        folder: date
    });
    // s3.upload(params, function (err, data) {
    //     if (err) {
    //             return res.status(500).json({
    //                 message: "error creating folder"
    //             });
    //         } else {
    //             return res.status(200).json({
    //                 message: "Folder created successfully",
    //                 folder: date
    //             });
    //         }
    //     });
}
export {uploadFile, createFolder};