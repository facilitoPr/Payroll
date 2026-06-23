import awsS3 from "../../config/spaces";

export const uploadImageToSpaces = async (
  imageBuffer: Buffer,
  folder: string,
) => {
  try {
    const uploadResult = await awsS3
      .upload({
        Bucket: process.env.BUCKET_NAME,
        Key: `${folder}/${Date.now()}.png`,
        Body: imageBuffer,
        ACL: "public-read",
        ContentType: "image/png",
      })
      .promise();

    return {
      url: uploadResult.Location,
    };
  } catch (error) {
    console.log(error);
    throw new Error("Error al subir la imagen a Digital Ocean Spaces");
  }
};