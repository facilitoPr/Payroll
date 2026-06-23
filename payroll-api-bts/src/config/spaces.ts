import { Endpoint, S3 } from "aws-sdk";

const spacesEndPoint = new Endpoint(process.env.ENDPOINTSPACE as string);

const awsS3 = new S3({
  endpoint: spacesEndPoint,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
});

export default awsS3;