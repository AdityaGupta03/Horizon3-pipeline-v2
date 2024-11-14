import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";

const s3Client = new S3Client({
  region: "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function uploadToS3(
  file: { path: string; originalname: string },
  folder: string,
) {
  const fileStream = fs.createReadStream(file.path);
  const uploadParams = {
    Bucket: "bindifffiles",
    Key: folder + file.originalname,
    Body: fileStream,
  };

  const upload = new Upload({
    client: s3Client,
    params: uploadParams,
  });

  return upload.done();
}

async function uploadFile(req: any, res: any): Promise<void> {
  console.log(req.body.folder);
  try {
    await uploadToS3(req.file, req.body.folder);
    res.status(200).send("File uploaded successfully");
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to upload file");
  }
}

async function createFolder(req: any, res: any): Promise<void> {
  const now = new Date();
  const date =
    now.getUTCMonth() +
    1 +
    "-" +
    now.getUTCDate() +
    "-" +
    now.getUTCFullYear() +
    "(" +
    (now.getUTCHours() < 10 ? "0" + now.getUTCHours() : now.getUTCHours()) +
    ":" +
    (now.getUTCMinutes() < 10
      ? "0" + now.getUTCMinutes()
      : now.getUTCMinutes()) +
    ":" +
    (now.getUTCSeconds() < 10
      ? "0" + now.getUTCSeconds()
      : now.getUTCSeconds()) +
    ")/";

  const params = {
    Bucket: "bindifffiles",
    Key: date,
  };

  try {
    await s3Client.send(new PutObjectCommand(params));
    res.status(200).json({
      message: "Folder created successfully",
      folder: date,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to create folder");
  }
}

async function downloadFile(req: any, res: any) {
  console.log(req.body);
  const params = {
    Bucket: "reports407",
    Key: req.query.url,
  };

  try {
    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.setHeader(
      "Content-disposition",
      `attachment; filename=${req.query.url}`,
    );
    res.setHeader("Content-type", "application/pdf");
    res.redirect(url);
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  }
}

async function delete_file(req: any, res: any) {
  console.log(req.body);
  const params = {
    Bucket: "reports407",
    Key: req.body.url,
  };

  try {
    await s3Client.send(new DeleteObjectCommand(params));
    res.status(200).json({ msg: "Wassup gang" });
  } catch (err) {
    console.log(err);
    res.status(500).send("Failed to delete file");
  }
}

export { createFolder, delete_file, downloadFile, uploadFile };
