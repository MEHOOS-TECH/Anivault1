import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  const form = formidable({});

  form.parse(req, async (err, fields, files) => {

    if (err) {
      return res.status(500).json({
        error: "Upload failed",
      });
    }

    const file = files.file[0];

    const fileStream = fs.createReadStream(file.filepath);

    const fileName =
      `videos/${Date.now()}-${file.originalFilename}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: fileName,
      Body: fileStream,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    const publicUrl =
      `${process.env.R2_PUBLIC_URL}/${fileName}`;

    res.status(200).json({
      success: true,
      url: publicUrl,
    });

  });

}
