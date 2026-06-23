import awsS3 from "../../config/spaces";

export const deleteFileFromSpaces = async (fileUrl: string) => {
  const splitUrl = fileUrl.split(".com/");
  const key = splitUrl[1];

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  };

  try {
    await awsS3.deleteObject(params).promise();
    console.log("Archivo eliminado correctamente.");
  } catch (error: any) {
    if (error.code === "NoSuchKey") {
      console.log("El archivo no existe en Amazon S3.");
    } else {
      console.error("Error al intentar eliminar el archivo:", error);
    }
  }
};

export const isManagedSpacesFile = (url: string) => {
  if (!url) return false;

  const cdnEndpoint = process.env.SPACES_CDN_ENDPOINT || "";
  const bucketEndpoint = process.env.SPACES_BUCKET_ENDPOINT || "";
  const endpointSpace = process.env.ENDPOINTSPACE || "";

  return [cdnEndpoint, bucketEndpoint, endpointSpace].some(
    (base) => base && url.includes(base),
  );
};
