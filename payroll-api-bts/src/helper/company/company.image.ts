import { AuthRequest } from "../../middlewares/validate-jwt";
import { getUploadedFieldUrl } from "../upload/upload.get";

export const mergeUploadedImagesIntoBody = (req: AuthRequest, body: any) => {
  const logoUploadedUrl =
    getUploadedFieldUrl(req, "logo") ||
    getUploadedFieldUrl(req, "logoUrl") ||
    "";

  const coverUploadedUrl =
    getUploadedFieldUrl(req, "cover") ||
    getUploadedFieldUrl(req, "coverUrl") ||
    "";

  const merged = {
    ...body,
  };

  if (logoUploadedUrl) {
    merged.logo = logoUploadedUrl;
    merged.logoUrl = logoUploadedUrl;
  }

  if (coverUploadedUrl) {
    merged.coverUrl = coverUploadedUrl;
  }

  return merged;
};
