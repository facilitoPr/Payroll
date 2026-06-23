import path from "path";
import awsS3 from "../../config/spaces";

export const uploadRawFileToSpaces = async (
  file: Express.Multer.File,
  folder: string,
) => {
  try {
    const ext = path.extname(file.originalname).toLowerCase() || "";
    const baseName = path
      .basename(file.originalname, ext)
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_-]/g, "");

    const finalName = `${Date.now()}-${baseName || "file"}${ext}`;

    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) {
      throw new Error("BUCKET_NAME environment variable is not defined");
    }

    const uploadResult = await awsS3
      .upload({
        Bucket: bucketName,
        Key: `${folder}/${finalName}`,
        Body: file.buffer,
        ACL: "public-read",
        ContentType: file.mimetype || "application/octet-stream",
      })
      .promise();

    return {
      url: uploadResult.Location,
      key: uploadResult.Key,
      path: uploadResult.Key,
      location: uploadResult.Location,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Error al subir el archivo a Digital Ocean Spaces");
  }
};